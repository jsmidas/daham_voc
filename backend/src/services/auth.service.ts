import { prisma } from '../config/database';
import crypto from 'crypto';
import { hashPassword, comparePassword } from '../utils/bcrypt.util';
import { generateToken } from '../utils/jwt.util';
import { User, Role, Division } from '@prisma/client';


/**
 * Generate a secure random password
 */
function generateSecurePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  const randomBytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

export interface RegisterDto {
  phone: string;
  name: string;
  password?: string;  // Optional - generates secure random password if not provided
  email?: string;
  role?: Role;
  division?: Division;
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

    // Generate secure random password if not provided
    const password = data.password || generateSecurePassword();
    const isGeneratedPassword = !data.password;

    if (isGeneratedPassword) {
      console.log(`[Auth] Generated password for user ${data.phone}: ${password}`);
      // In production, this should be sent via SMS or email instead of logging
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        phone: data.phone,
        password: hashedPassword,
        name: data.name,
        email: data.email,
        role: data.role || Role.SITE_STAFF,
        division: data.division,
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
    // 1단계: 사용자 기본 정보만 조회 (가벼운 쿼리)
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        staff: {
          include: {
            staffSites: {
              where: { removedAt: null },
              select: { site: { select: { id: true, name: true, type: true, division: true, address: true, latitude: true, longitude: true, group: { select: { id: true, name: true, division: true } } } } },
            },
            staffSiteGroups: {
              where: { removedAt: null },
              select: { siteGroup: { select: { id: true, name: true, division: true } } },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('전화번호 또는 비밀번호가 올바르지 않습니다');
    }

    if (!user.isActive) {
      throw new Error('비활성화된 계정입니다');
    }

    if (user.deletedAt) {
      throw new Error('삭제된 계정입니다');
    }

    // 비밀번호 검증
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('전화번호 또는 비밀번호가 올바르지 않습니다');
    }

    // lastLoginAt 업데이트는 비동기로 (응답을 기다리지 않음)
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});

    // JWT 토큰 생성 (동기, 빠름)
    const token = generateToken({
      userId: user.id,
      email: (user.email || user.phone) as string,
      role: user.role,
      division: user.division || undefined,
    });

    // 사업장 목록 구성
    const individualSites = user.staff?.staffSites?.map(ss => ss.site) || [];
    const assignedSiteGroups = user.staff?.staffSiteGroups?.map(sg => sg.siteGroup) || [];

    // 그룹 소속 사이트 확장 (웹에서 배정한 사업장만 반환)
    const groupIds = assignedSiteGroups.map(g => g.id);

    const siteSelect = {
      id: true, name: true, type: true, division: true,
      address: true, latitude: true, longitude: true,
      group: { select: { id: true, name: true, division: true } },
    };

    let assignedSites: any[];

    if (groupIds.length > 0) {
      // 그룹 소속 사이트 확장
      const groupSites = await prisma.site.findMany({
        where: { groupId: { in: groupIds }, deletedAt: null },
        select: siteSelect,
      });
      const allSitesMap = new Map();
      [...individualSites, ...groupSites].forEach(site => allSitesMap.set(site.id, site));
      assignedSites = Array.from(allSitesMap.values());
    } else {
      assignedSites = individualSites;
    }

    // 웹에서 지정한 "부서(사업장)" 기반 기본 사업장 조회
    const departmentName = user.staff?.department;
    let departmentSite: any = null;
    if (departmentName) {
      departmentSite = await prisma.site.findFirst({
        where: { name: departmentName, deletedAt: null },
        select: siteSelect,
      });
      // 부서 사업장이 assignedSites에 없으면 추가
      if (departmentSite && !assignedSites.some((s: any) => s.id === departmentSite.id)) {
        assignedSites.unshift(departmentSite);
      }
    }

    // 기본 사업장: 부서 사업장 우선, 없으면 첫 번째 배정 사업장
    const primarySiteId = departmentSite?.id || assignedSites[0]?.id || null;

    const { password: _, staff, ...userWithoutPassword } = user;

    return {
      user: {
        ...userWithoutPassword,
        staffSites: assignedSites,
        staffSiteGroups: assignedSiteGroups,
        siteId: primarySiteId,
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
