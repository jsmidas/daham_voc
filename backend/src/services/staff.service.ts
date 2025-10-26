/**
 * Staff Service
 * @description 담당자 관리 서비스
 */

import { PrismaClient, Division, Role } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 담당자 목록 조회 (필터링, 페이징)
 */
export async function getStaffList(query: {
  page?: number;
  limit?: number;
  division?: Division;
  role?: Role;
  search?: string;
  department?: string;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Number(query.limit) || 20);
  const skip = (page - 1) * limit;

  // 필터 조건 생성
  const where: any = {
    deletedAt: null,
    user: { deletedAt: null },
  };

  // Division 필터
  if (query.division) {
    where.user = { ...where.user, division: query.division };
  }

  // Role 필터
  if (query.role) {
    where.user = { ...where.user, role: query.role };
  }

  // Department 필터
  if (query.department) {
    where.department = query.department;
  }

  // 검색 (이름, 전화번호, 이메일, 사번)
  if (query.search) {
    where.OR = [
      { user: { name: { contains: query.search, mode: 'insensitive' } } },
      { user: { phone: { contains: query.search, mode: 'insensitive' } } },
      { user: { email: { contains: query.search, mode: 'insensitive' } } },
      { employeeNo: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  // 데이터 조회
  const [staffList, total] = await Promise.all([
    prisma.staff.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            division: true,
            isActive: true,
            canUseAttendance: true,
            lastLoginAt: true,
          },
        },
        manager: {
          select: {
            id: true,
            employeeNo: true,
            user: { select: { name: true, phone: true } },
          },
        },
        staffSites: {
          where: { removedAt: null },
          include: {
            site: {
              select: {
                id: true,
                name: true,
                type: true,
                division: true,
              },
            },
          },
        },
      },
    }),
    prisma.staff.count({ where }),
  ]);

  return {
    items: staffList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 담당자 상세 조회
 */
export async function getStaffById(staffId: string) {
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, deletedAt: null },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          division: true,
          isActive: true,
          canUseAttendance: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
      manager: {
        select: {
          id: true,
          employeeNo: true,
          user: { select: { name: true, phone: true } },
        },
      },
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
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      },
    },
  });

  if (!staff) {
    throw new Error('담당자를 찾을 수 없습니다');
  }

  return staff;
}

/**
 * 담당자 생성 (User + Staff 함께 생성)
 */
export async function createStaff(data: {
  // User 정보
  name: string;
  phone: string;
  email?: string;
  password: string;
  role: Role;
  division?: Division;
  canUseAttendance?: boolean;
  // Staff 정보
  employeeNo?: string;
  department?: string;
  position?: string;
  managerId?: string;
  // 사업장 배정
  siteIds?: string[];
}) {
  // 중복 체크: phone
  const existingUser = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existingUser) {
    throw new Error('이미 사용 중인 전화번호입니다');
  }

  // employeeNo가 제공된 경우 중복 체크
  if (data.employeeNo) {
    const existingStaff = await prisma.staff.findUnique({ where: { employeeNo: data.employeeNo } });
    if (existingStaff) {
      throw new Error('이미 사용 중인 사번입니다');
    }
  }

  // bcrypt로 비밀번호 해싱
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Transaction으로 User + Staff + StaffSite 생성
  const staff = await prisma.$transaction(async (tx) => {
    // 1. User 생성
    const user = await tx.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        division: data.division,
        isActive: true,
        canUseAttendance: data.canUseAttendance ?? false,
      },
    });

    // 2. Staff 생성
    const newStaff = await tx.staff.create({
      data: {
        userId: user.id,
        employeeNo: data.employeeNo || null,
        department: data.department,
        position: data.position,
        managerId: data.managerId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
            division: true,
            canUseAttendance: true,
          },
        },
      },
    });

    // 3. StaffSite 생성 (사업장 배정)
    if (data.siteIds && data.siteIds.length > 0) {
      await tx.staffSite.createMany({
        data: data.siteIds.map((siteId) => ({
          staffId: newStaff.id,
          siteId,
          isPrimary: false,
        })),
      });
    }

    return newStaff;
  });

  return staff;
}

/**
 * 담당자 수정 (User + Staff 정보 수정)
 */
export async function updateStaff(
  staffId: string,
  data: {
    // User 정보
    name?: string;
    phone?: string;
    email?: string;
    role?: Role;
    division?: Division;
    isActive?: boolean;
    canUseAttendance?: boolean;
    // Staff 정보
    department?: string;
    position?: string;
    managerId?: string;
  }
) {
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, deletedAt: null },
  });

  if (!staff) {
    throw new Error('담당자를 찾을 수 없습니다');
  }

  // phone 중복 체크 (다른 사용자가 사용 중인지)
  if (data.phone && data.phone !== staff.userId) {
    const existingUser = await prisma.user.findUnique({
      where: { phone: data.phone },
    });
    if (existingUser && existingUser.id !== staff.userId) {
      throw new Error('이미 사용 중인 전화번호입니다');
    }
  }

  // Transaction으로 User + Staff 수정
  const updated = await prisma.$transaction(async (tx) => {
    // User 정보 수정
    const userUpdateData: any = {};
    if (data.name !== undefined) userUpdateData.name = data.name;
    if (data.phone !== undefined) userUpdateData.phone = data.phone;
    if (data.email !== undefined) userUpdateData.email = data.email;
    if (data.role !== undefined) userUpdateData.role = data.role;
    if (data.division !== undefined) userUpdateData.division = data.division;
    if (data.isActive !== undefined) userUpdateData.isActive = data.isActive;
    if (data.canUseAttendance !== undefined) userUpdateData.canUseAttendance = data.canUseAttendance;

    if (Object.keys(userUpdateData).length > 0) {
      await tx.user.update({
        where: { id: staff.userId },
        data: userUpdateData,
      });
    }

    // Staff 정보 수정
    const staffUpdateData: any = {};
    if (data.department !== undefined) staffUpdateData.department = data.department;
    if (data.position !== undefined) staffUpdateData.position = data.position;
    if (data.managerId !== undefined) staffUpdateData.managerId = data.managerId;

    const updatedStaff = await tx.staff.update({
      where: { id: staffId },
      data: staffUpdateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
            division: true,
            isActive: true,
            canUseAttendance: true,
          },
        },
      },
    });

    return updatedStaff;
  });

  return updated;
}

/**
 * 담당자 삭제 (Soft delete: User + Staff)
 */
export async function deleteStaff(staffId: string) {
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, deletedAt: null },
  });

  if (!staff) {
    throw new Error('담당자를 찾을 수 없습니다');
  }

  await prisma.$transaction(async (tx) => {
    const now = new Date();
    // Staff soft delete
    await tx.staff.update({
      where: { id: staffId },
      data: { deletedAt: now },
    });
    // User soft delete
    await tx.user.update({
      where: { id: staff.userId },
      data: { deletedAt: now },
    });
  });

  return { message: '담당자가 삭제되었습니다' };
}

/**
 * 담당자 사업장 배정 (StaffSite 관리)
 */
export async function assignStaffToSites(
  staffId: string,
  siteIds: string[]
) {
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, deletedAt: null },
  });

  if (!staff) {
    throw new Error('담당자를 찾을 수 없습니다');
  }

  // 기존 배정 완전히 삭제 (unique constraint 충돌 방지)
  await prisma.staffSite.deleteMany({
    where: {
      staffId,
    },
  });

  // 새로운 사업장 배정
  if (siteIds.length > 0) {
    await prisma.staffSite.createMany({
      data: siteIds.map((siteId) => ({
        staffId,
        siteId,
        isPrimary: false,
      })),
    });
  }

  return { message: '사업장이 배정되었습니다' };
}

/**
 * 비밀번호 초기화 (관리자 기능)
 */
export async function resetStaffPassword(staffId: string, newPassword: string) {
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, deletedAt: null },
  });

  if (!staff) {
    throw new Error('담당자를 찾을 수 없습니다');
  }

  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: staff.userId },
    data: { password: hashedPassword },
  });

  return { message: '비밀번호가 초기화되었습니다' };
}
