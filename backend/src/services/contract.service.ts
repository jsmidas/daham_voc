/**
 * Contract Service
 * @description 전자 근로계약서 서비스
 */

import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import axios from 'axios';
import { uploadBuffer } from './storage.service';

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
 * 서명 영역 설정
 */
export async function updateSignZone(contractId: string, data: {
  signPageNumber: number;
  signX: number;
  signY: number;
  signWidth: number;
  signHeight: number;
}) {
  return prisma.contract.update({
    where: { id: contractId },
    data: {
      signPageNumber: data.signPageNumber,
      signX: data.signX,
      signY: data.signY,
      signWidth: data.signWidth,
      signHeight: data.signHeight,
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
 * 서명 완료 후 1개월 지난 것은 제외
 */
export async function getMyContracts(userId: string) {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const assignments = await prisma.contractAssignment.findMany({
    where: {
      userId,
      OR: [
        { status: 'PENDING' },
        { status: 'EXPIRED' },
        { status: 'SIGNED', signedAt: { gte: oneMonthAgo } },
      ],
    },
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
 * 서명 제출 + 합성 문서 생성
 */
export async function signContract(data: {
  assignmentId: string;
  userId: string;
  signatureImageUrl: string;
}) {
  // 본인의 배정인지 확인
  const assignment = await prisma.contractAssignment.findFirst({
    where: { id: data.assignmentId, userId: data.userId },
    include: {
      contract: {
        include: { pages: { orderBy: { pageNumber: 'asc' } } },
      },
    },
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

  // 서명 합성 문서 생성
  let signedDocumentUrl: string | undefined;
  try {
    signedDocumentUrl = await compositeSignedDocument(
      assignment.contract,
      data.signatureImageUrl,
      data.assignmentId
    );
  } catch (err: any) {
    console.error('서명 합성 실패 (서명은 계속 저장):', err.message);
  }

  return prisma.contractAssignment.update({
    where: { id: data.assignmentId },
    data: {
      status: 'SIGNED',
      signedAt: new Date(),
      signatureImageUrl: data.signatureImageUrl,
      signedDocumentUrl,
    },
    include: {
      contract: { select: { id: true, title: true } },
      user: { select: { id: true, name: true } },
    },
  });
}

/**
 * 서명 합성 문서 생성
 * 계약서의 서명 페이지에 서명 이미지를 합성하여 저장
 */
async function compositeSignedDocument(
  contract: any,
  signatureImageUrl: string,
  assignmentId: string
): Promise<string> {
  const { signPageNumber, signX, signY, signWidth, signHeight, pages } = contract;

  if (!signPageNumber || signX == null || signY == null || signWidth == null || signHeight == null) {
    throw new Error('서명 영역이 설정되지 않았습니다.');
  }

  // 서명 페이지 이미지 가져오기
  const signPage = pages.find((p: any) => p.pageNumber === signPageNumber);
  if (!signPage) {
    throw new Error('서명 페이지를 찾을 수 없습니다.');
  }

  // 이미지 다운로드
  const [pageResponse, sigResponse] = await Promise.all([
    axios.get(signPage.imageUrl, { responseType: 'arraybuffer' }),
    axios.get(signatureImageUrl, { responseType: 'arraybuffer' }),
  ]);

  const pageBuffer = Buffer.from(pageResponse.data);
  const sigBuffer = Buffer.from(sigResponse.data);

  // 원본 이미지를 PNG로 변환 (알파 채널 지원)
  const pageImage = sharp(pageBuffer).png();
  const pageMeta = await pageImage.metadata();
  const pageW = pageMeta.width || 1000;
  const pageH = pageMeta.height || 1414;

  // 흰 배경 위에 원본 이미지를 올려서 알파 채널 문제 방지
  const baseImage = await sharp({
    create: { width: pageW, height: pageH, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([{ input: await pageImage.toBuffer(), left: 0, top: 0 }])
    .png()
    .toBuffer();

  // 서명 영역 계산 (% → px)
  const sx = Math.round((signX / 100) * pageW);
  const sy = Math.round((signY / 100) * pageH);
  const sw = Math.round((signWidth / 100) * pageW);
  const sh = Math.round((signHeight / 100) * pageH);

  // 서명 이미지: 흰 배경 제거하고 투명하게 리사이즈
  const resizedSig = await sharp(sigBuffer)
    .resize(sw, sh, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  // 합성
  const composited = await sharp(baseImage)
    .composite([{ input: resizedSig, left: sx, top: sy }])
    .jpeg({ quality: 90 })
    .toBuffer();

  // 업로드
  const filename = `signed_${assignmentId}_page${signPageNumber}.jpg`;
  const url = await uploadBuffer(composited, 'contracts', filename, 'image/jpeg');

  return url;
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
 * 계약 대상자 목록 조회 (isContractTarget=true)
 */
export async function getContractTargets() {
  return prisma.user.findMany({
    where: {
      isContractTarget: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      division: true,
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * 여러 계약서 일괄 배정
 */
export async function assignMultipleContracts(data: {
  contractIds: string[];
  userIds: string[];
  expiresAt?: string;
}) {
  let totalCount = 0;

  for (const contractId of data.contractIds) {
    const result = await prisma.contractAssignment.createMany({
      data: data.userIds.map((userId) => ({
        contractId,
        userId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      })),
      skipDuplicates: true,
    });
    totalCount += result.count;
  }

  return { count: totalCount, contracts: data.contractIds.length };
}

/**
 * 배정 취소
 */
export async function removeAssignment(assignmentId: string) {
  return prisma.contractAssignment.delete({
    where: { id: assignmentId },
  });
}
