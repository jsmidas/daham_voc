/**
 * Contract Service
 * @description 전자 근로계약서 서비스
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 계약서 생성
 */
export async function createContract(data: {
  title: string;
  description?: string;
  createdBy: string;
  pages: { pageNumber: number; imageUrl: string }[];
}) {
  return prisma.contract.create({
    data: {
      title: data.title,
      description: data.description,
      createdBy: data.createdBy,
      pages: {
        create: data.pages.map((p) => ({
          pageNumber: p.pageNumber,
          imageUrl: p.imageUrl,
        })),
      },
    },
    include: {
      pages: { orderBy: { pageNumber: 'asc' } },
    },
  });
}

/**
 * 계약서 목록 조회 (관리자용)
 */
export async function getContracts(filter: {
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = filter.page || 1;
  const limit = filter.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };
  if (filter.isActive !== undefined) where.isActive = filter.isActive;

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where,
      include: {
        pages: { orderBy: { pageNumber: 'asc' } },
        assignments: {
          include: { user: { select: { id: true, name: true, phone: true, role: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.contract.count({ where }),
  ]);

  return {
    data: contracts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * 계약서 상세 조회
 */
export async function getContractById(id: string) {
  return prisma.contract.findUnique({
    where: { id },
    include: {
      pages: { orderBy: { pageNumber: 'asc' } },
      assignments: {
        include: { user: { select: { id: true, name: true, phone: true, role: true } } },
      },
    },
  });
}

/**
 * 대상자 배정
 */
export async function assignContract(data: {
  contractId: string;
  userIds: string[];
  expiresAt?: string;
}) {
  const assignments = await prisma.contractAssignment.createMany({
    data: data.userIds.map((userId) => ({
      contractId: data.contractId,
      userId,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    })),
    skipDuplicates: true,
  });

  return { count: assignments.count };
}

/**
 * 내 계약서 조회 (모바일용 - 본인에게 배정된 것만)
 */
export async function getMyContracts(userId: string) {
  const assignments = await prisma.contractAssignment.findMany({
    where: { userId },
    include: {
      contract: {
        include: {
          pages: { orderBy: { pageNumber: 'asc' } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return assignments;
}

/**
 * 서명 제출
 */
export async function signContract(data: {
  assignmentId: string;
  userId: string;
  signatureImageUrl: string;
  signedDocumentUrl?: string;
}) {
  // 본인의 배정인지 확인
  const assignment = await prisma.contractAssignment.findFirst({
    where: { id: data.assignmentId, userId: data.userId },
  });

  if (!assignment) {
    throw new Error('배정된 계약서가 아닙니다.');
  }

  if (assignment.status === 'SIGNED') {
    throw new Error('이미 서명된 계약서입니다.');
  }

  if (assignment.status === 'EXPIRED') {
    throw new Error('서명 기한이 만료된 계약서입니다.');
  }

  return prisma.contractAssignment.update({
    where: { id: data.assignmentId },
    data: {
      status: 'SIGNED',
      signedAt: new Date(),
      signatureImageUrl: data.signatureImageUrl,
      signedDocumentUrl: data.signedDocumentUrl,
    },
    include: {
      contract: { select: { id: true, title: true } },
      user: { select: { id: true, name: true } },
    },
  });
}

/**
 * 서명 현황 조회 (관리자용)
 */
export async function getContractStatus(contractId: string) {
  const assignments = await prisma.contractAssignment.findMany({
    where: { contractId },
    include: {
      user: { select: { id: true, name: true, phone: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const summary = {
    total: assignments.length,
    signed: assignments.filter((a) => a.status === 'SIGNED').length,
    pending: assignments.filter((a) => a.status === 'PENDING').length,
    expired: assignments.filter((a) => a.status === 'EXPIRED').length,
  };

  return { assignments, summary };
}

/**
 * 계약서 삭제 (soft delete)
 */
export async function deleteContract(id: string) {
  return prisma.contract.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
}

/**
 * 배정 취소
 */
export async function removeAssignment(assignmentId: string) {
  return prisma.contractAssignment.delete({
    where: { id: assignmentId },
  });
}
