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
    const groupIds = assignedSiteGroups.map(g => g.id);
    const departmentName = user.staff?.department;

    const siteSelect = {
      id: true, name: true, type: true, division: true,
      address: true, latitude: true, longitude: true,
      group: { select: { id: true, name: true, division: true } },
    };

    // 서로 독립적인 3개 부가 쿼리를 병렬 실행 (네트워크 왕복 합산 제거)
    const [groupSites, driverRoutes, departmentSite] = await Promise.all([
      groupIds.length > 0
        ? prisma.site.findMany({
            where: { groupId: { in: groupIds }, deletedAt: null },
            select: siteSelect,
          })
        : Promise.resolve([] as any[]),
      user.role === 'DELIVERY_DRIVER'
        ? prisma.deliveryAssignment.findMany({
            where: { driverId: user.id, isActive: true },
            include: {
              route: {
                include: {
                  routeStops: {
                    include: { site: { select: siteSelect } },
                    orderBy: { stopNumber: 'asc' },
                  },
                },
              },
            },
          })
        : Promise.resolve([] as any[]),
      departmentName
        ? prisma.site.findFirst({
            where: { name: departmentName, deletedAt: null },
            select: siteSelect,
          })
        : Promise.resolve(null as any),
    ]);

    // 개인 배정 + 그룹 확장 사이트 병합
    const allSitesMap = new Map<string, any>();
    [...individualSites, ...groupSites].forEach(site => allSitesMap.set(site.id, site));

    // 배송기사: 코스에 포함된 사업장 추가
    if (driverRoutes.length > 0) {
      const routeSites = driverRoutes.flatMap((dr: any) =>
        dr.route.routeStops.map((stop: any) => stop.site)
      );
      routeSites.forEach((site: any) => allSitesMap.set(site.id, site));
    }

    let assignedSites = Array.from(allSitesMap.values());

    // 부서 사업장이 있으면 맨 앞에 추가(중복 시 기존 위치 유지)
    if (departmentSite && !assignedSites.some((s: any) => s.id === departmentSite.id)) {
      assignedSites.unshift(departmentSite);
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
   * 고객 셀프 회원가입 (사업장 코드 기반)
   */
  async registerCustomer(data: {
    siteCode: string;
    phone: string;
    name: string;
    password: string;
  }): Promise<LoginResponse> {
    // 사업장 코드 확인
    const site = await prisma.site.findFirst({
      where: { siteCode: { equals: data.siteCode, mode: 'insensitive' }, isActive: true, deletedAt: null },
      select: { id: true, name: true, type: true, division: true },
    });

    if (!site) {
      throw new Error('유효하지 않은 사업장 코드입니다');
    }

    // 전화번호 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existingUser) {
      throw new Error('이미 등록된 전화번호입니다');
    }

    const hashedPassword = await hashPassword(data.password);

    // Transaction: User + Staff + StaffSite 생성
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: data.phone,
          password: hashedPassword,
          name: data.name,
          role: Role.CUSTOMER,
          division: site.division as any,
        },
      });

      const staff = await tx.staff.create({
        data: {
          userId: user.id,
        },
      });

      await tx.staffSite.create({
        data: {
          staffId: staff.id,
          siteId: site.id,
          isPrimary: true,
        },
      });

      return user;
    });

    const token = generateToken({
      userId: result.id,
      email: result.phone,
      role: result.role,
      division: result.division || undefined,
    });

    const { password: _, ...userWithoutPassword } = result;

    return {
      user: {
        ...userWithoutPassword,
        staffSites: [site],
        siteId: site.id,
      } as any,
      token,
    };
  }

  /**
   * Get current user by ID (login과 동일한 수준의 정보 반환)
   */
  async getCurrentUser(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // login과 동일한 사업장 목록 구성
    const individualSites = user.staff?.staffSites?.map(ss => ss.site) || [];
    const assignedSiteGroups = user.staff?.staffSiteGroups?.map(sg => sg.siteGroup) || [];
    const groupIds = assignedSiteGroups.map(g => g.id);

    const siteSelect = {
      id: true, name: true, type: true, division: true,
      address: true, latitude: true, longitude: true,
      group: { select: { id: true, name: true, division: true } },
    };

    let assignedSites: any[];
    if (groupIds.length > 0) {
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

    // 부서 사업장
    const departmentName = user.staff?.department;
    let departmentSite: any = null;
    if (departmentName) {
      departmentSite = await prisma.site.findFirst({
        where: { name: departmentName, deletedAt: null },
        select: siteSelect,
      });
      if (departmentSite && !assignedSites.some((s: any) => s.id === departmentSite.id)) {
        assignedSites.unshift(departmentSite);
      }
    }

    const primarySiteId = departmentSite?.id || assignedSites[0]?.id || null;
    const { password: _, staff, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      staffSites: assignedSites,
      staffSiteGroups: assignedSiteGroups,
      siteId: primarySiteId,
    };
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

  /**
   * 회원 탈퇴 (Apple Guideline 5.1.1(v) 대응)
   * - soft delete + PII 익명화 + 푸시 토큰 정리
   * - VOC/식수/배식사진 등 비즈니스 데이터는 유지하되 작성자만 익명화 표시
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    if (user.deletedAt) {
      throw new Error('이미 탈퇴 처리된 계정입니다');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('비밀번호가 올바르지 않습니다');
    }

    // 무작위 해시로 password 무효화 (재로그인 차단)
    const scrambledPassword = await hashPassword(
      crypto.randomBytes(32).toString('hex')
    );

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          isActive: false,
          name: '탈퇴한 사용자',
          email: null,
          phone: `__deleted_${userId}`,
          password: scrambledPassword,
        },
      });

      await tx.pushToken.deleteMany({ where: { userId } });
    });
  }
}
