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
      signZones: { orderBy: { sortOrder: 'asc' } },
    },
  });
}

/**
 * 서명 영역 추가
 */
export async function addSignZone(contractId: string, data: {
  label: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  sortOrder?: number;
}) {
  return prisma.contractSignZone.create({
    data: {
      contractId,
      label: data.label,
      pageNumber: data.pageNumber,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      sortOrder: data.sortOrder || 0,
    },
  });
}

/**
 * 서명 영역 삭제
 */
export async function deleteSignZone(signZoneId: string) {
  return prisma.contractSignZone.delete({
    where: { id: signZoneId },
  });
}

/**
 * 서명 영역 전체 교체 (기존 삭제 후 새로 생성)
 */
export async function replaceSignZones(contractId: string, zones: {
  label: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  sortOrder: number;
}[]) {
  await prisma.contractSignZone.deleteMany({ where: { contractId } });

  if (zones.length > 0) {
    await prisma.contractSignZone.createMany({
      data: zones.map((z) => ({
        contractId,
        label: z.label,
        pageNumber: z.pageNumber,
        x: z.x,
        y: z.y,
        width: z.width,
        height: z.height,
        sortOrder: z.sortOrder,
      })),
    });
  }

  return prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      pages: { orderBy: { pageNumber: 'asc' } },
      signZones: { orderBy: { sortOrder: 'asc' } },
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
        signZones: { orderBy: { sortOrder: 'asc' } },
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
      signZones: { orderBy: { sortOrder: 'asc' } },
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
      contract: { deletedAt: null },
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
          signZones: { orderBy: { sortOrder: 'asc' } },
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
  signatureBuffer: Buffer;
}) {
  // 본인의 배정인지 확인
  const assignment = await prisma.contractAssignment.findFirst({
    where: { id: data.assignmentId, userId: data.userId },
    include: {
      contract: {
        include: {
          pages: { orderBy: { pageNumber: 'asc' } },
          signZones: { orderBy: { sortOrder: 'asc' } },
        },
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

  // 서명 합성 문서 생성 (여러 페이지에 서명 합성)
  let signedDocumentUrl: string | undefined;
  try {
    signedDocumentUrl = await compositeSignedDocuments(
      assignment.contract,
      data.signatureBuffer,
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
 * 서명 합성 문서 생성 (다중 서명 영역 지원)
 * 서명이 있는 모든 페이지를 합성하여 JSON 형태로 URL 목록 저장
 */
async function compositeSignedDocuments(
  contract: any,
  signatureBuffer: Buffer,
  assignmentId: string
): Promise<string> {
  const { signZones, pages } = contract;

  if (!signZones || signZones.length === 0) {
    throw new Error('서명 영역이 설정되지 않았습니다.');
  }

  // 서명이 필요한 페이지 번호 목록 (중복 제거)
  const signPageNumbers = Array.from(new Set<number>(signZones.map((z: any) => z.pageNumber)));

  // 페이지별로 합성
  const signedPages: { pageNumber: number; url: string }[] = [];

  for (const pageNum of signPageNumbers) {
    const page = pages.find((p: any) => p.pageNumber === pageNum);
    if (!page) continue;

    // 해당 페이지의 서명 영역들
    const zonesForPage = signZones.filter((z: any) => z.pageNumber === pageNum);

    // 페이지 이미지 다운로드
    const pageResponse = await axios.get(page.imageUrl, { responseType: 'arraybuffer' });
    const pageBuffer = Buffer.from(pageResponse.data);

    // 원본 이미지 메타데이터
    const pageImage = sharp(pageBuffer).png();
    const pageMeta = await pageImage.metadata();
    const pageW = pageMeta.width || 1000;
    const pageH = pageMeta.height || 1414;

    // 흰 배경 위에 원본 이미지
    let compositeInputs: { input: Buffer; left: number; top: number }[] = [
      { input: await pageImage.toBuffer(), left: 0, top: 0 },
    ];

    // 각 서명 영역에 서명 합성
    for (const zone of zonesForPage) {
      const sx = Math.round((zone.x / 100) * pageW);
      const sy = Math.round((zone.y / 100) * pageH);
      const sw = Math.round((zone.width / 100) * pageW);
      const sh = Math.round((zone.height / 100) * pageH);

      const resizedSig = await sharp(signatureBuffer)
        .resize(sw, sh, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();

      compositeInputs.push({ input: resizedSig, left: sx, top: sy });
    }

    // 합성
    const composited = await sharp({
      create: { width: pageW, height: pageH, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
      .composite(compositeInputs)
      .jpeg({ quality: 90 })
      .toBuffer();

    // 업로드
    const filename = `signed_${assignmentId}_p${pageNum}.jpg`;
    const url = await uploadBuffer(composited, 'contracts', filename, 'image/jpeg');
    signedPages.push({ pageNumber: pageNum, url });
  }

  // JSON 형태로 저장 (여러 페이지 합성 결과)
  return JSON.stringify(signedPages);
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
