import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/bcrypt.util';
import { generateToken } from '../utils/jwt.util';
import { User } from '@prisma/client';

export interface RegisterDto {
  phone: string;
  name: string;
  password?: string;  // Optional - defaults to '1234'
  email?: string;
  role?: string;
  division?: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterDto): Promise<LoginResponse> {
    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existingUser) {
      throw new Error('이미 등록된 전화번호입니다');
    }

    // Use default password '1234' if not provided
    const password = data.password || '1234';

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        phone: data.phone,
        password: hashedPassword,
        name: data.name,
        email: data.email,
        role: (data.role as any) || 'STAFF',
        division: data.division as any,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: (user.email || user.phone) as string,
      role: user.role,
      division: user.division || undefined,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Login user (using phone number)
   */
  async login(phone: string, password: string): Promise<LoginResponse> {
    // Find user by phone (include staff sites for mobile app)
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        staff: {
          include: {
            staffSites: {
              where: { removedAt: null },
              include: {
                site: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                    division: true,
                    address: true,
                    latitude: true,
                    longitude: true,
                    group: {
                      select: {
                        id: true,
                        name: true,
                        division: true,
                      },
                    },
                  },
                },
              },
            },
            staffSiteGroups: {
              where: { removedAt: null },
              include: {
                siteGroup: {
                  select: {
                    id: true,
                    name: true,
                    division: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('전화번호 또는 비밀번호가 올바르지 않습니다');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('비활성화된 계정입니다');
    }

    // Check if user is soft deleted
    if (user.deletedAt) {
      throw new Error('삭제된 계정입니다');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('전화번호 또는 비밀번호가 올바르지 않습니다');
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: (user.email || user.phone) as string,
      role: user.role,
      division: user.division || undefined,
    });

    // Extract assigned sites and site groups
    const individualSites = user.staff?.staffSites?.map(ss => ss.site) || [];
    const assignedSiteGroups = user.staff?.staffSiteGroups?.map(sg => sg.siteGroup) || [];

    // Expand site groups: fetch all sites belonging to assigned groups
    let groupSites: any[] = [];
    if (assignedSiteGroups.length > 0) {
      const groupIds = assignedSiteGroups.map(g => g.id);
      groupSites = await prisma.site.findMany({
        where: {
          groupId: { in: groupIds },
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          type: true,
          division: true,
          address: true,
          latitude: true,
          longitude: true,
          group: {
            select: {
              id: true,
              name: true,
              division: true,
            },
          },
        },
      });
    }

    // Combine individual sites and group sites, remove duplicates
    const allSitesMap = new Map();
    [...individualSites, ...groupSites].forEach(site => {
      allSitesMap.set(site.id, site);
    });
    let assignedSites = Array.from(allSitesMap.values());

    // 관리자 역할인 경우 전체 사업장 목록을 반환
    const adminRoles = ['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN'];
    const isAdmin = adminRoles.includes(user.role);
    if (isAdmin && assignedSites.length === 0) {
      console.log(`[Auth] Admin user ${user.name} - fetching all sites`);
      assignedSites = await prisma.site.findMany({
        where: {
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          type: true,
          division: true,
          address: true,
          latitude: true,
          longitude: true,
          group: {
            select: {
              id: true,
              name: true,
              division: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
      console.log(`[Auth] Admin user ${user.name} - found ${assignedSites.length} sites`);
    }

    // Remove password from response
    const { password: _, staff, ...userWithoutPassword } = user;

    return {
      user: {
        ...userWithoutPassword,
        staffSites: assignedSites,
        staffSiteGroups: assignedSiteGroups,
        // Keep siteId for backward compatibility (single site)
        siteId: assignedSites[0]?.id || null,
      } as any,
      token,
    };
  }

  /**
   * Get current user by ID
   */
  async getCurrentUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        staff: true,
      },
    });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword as any;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // Verify old password
    const isPasswordValid = await comparePassword(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('현재 비밀번호가 올바르지 않습니다');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}
