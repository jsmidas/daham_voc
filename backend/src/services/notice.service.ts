/**
 * Notice Service
 * @description 공지 관리 서비스 (부문/역할/개인 타겟팅)
 */

import { prisma } from '../config/database';
import { Prisma, Division, Role, NoticeTarget } from '@prisma/client';

const ADMIN_ROLES: Role[] = [
  'SUPER_ADMIN',
  'HQ_ADMIN',
  'YEONGNAM_ADMIN',
  'GROUP_MANAGER',
];

interface ListParams {
  page?: number;
  limit?: number;
  targetType?: NoticeTarget;
  search?: string;
  includeUnpublished?: boolean;
}

interface CreateInput {
  title: string;
  content: string;
  targetType: NoticeTarget;
  targetDivisions?: Division[];
  targetRoles?: Role[];
  targetUserIds?: string[];
  isPinned?: boolean;
  publishedAt?: Date | null;
  expiresAt?: Date | null;
}

type UpdateInput = Partial<CreateInput>;

interface ViewerContext {
  userId: string;
  role: Role;
  division: Division | null;
}

/**
 * 본인에게 보이는 공지 필터 빌드
 */
function buildVisibilityFilter(viewer: ViewerContext): Prisma.NoticeWhereInput {
  const now = new Date();
  const orFilters: Prisma.NoticeWhereInput[] = [
    { targetType: 'ALL' },
    { targetType: 'USER', targetUserIds: { has: viewer.userId } },
    { targetType: 'ROLE', targetRoles: { has: viewer.role } },
  ];
  if (viewer.division) {
    orFilters.push({
      targetType: 'DIVISION',
      targetDivisions: { has: viewer.division },
    });
  }
  return {
    deletedAt: null,
    publishedAt: { not: null, lte: now },
    AND: [
      { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      { OR: orFilters },
    ],
  };
}

/**
 * 관리자 권한 검증 (작성/수정/삭제)
 */
function assertCanWrite(role: Role) {
  if (!ADMIN_ROLES.includes(role)) {
    throw new Error('공지를 작성할 권한이 없습니다');
  }
}

/**
 * 관리자가 작성/수정 시 본인 권한 범위 내 대상만 지정 가능한지 검증
 */
function assertTargetAllowed(viewer: ViewerContext, input: CreateInput | UpdateInput) {
  if (viewer.role === 'SUPER_ADMIN') return;

  // HQ/YEONGNAM 관리자는 본인 division만 지정 가능
  if (viewer.role === 'HQ_ADMIN' || viewer.role === 'YEONGNAM_ADMIN') {
    if (input.targetType === 'ALL') {
      throw new Error('전체 공지는 슈퍼관리자만 작성할 수 있습니다');
    }
    if (input.targetType === 'DIVISION') {
      const myDivision = viewer.division;
      const targets = input.targetDivisions || [];
      if (targets.some((d) => d !== myDivision)) {
        throw new Error('본인 부문 외의 공지는 작성할 수 없습니다');
      }
    }
  }

  // GROUP_MANAGER는 ROLE/USER만 가능 (DIVISION/ALL 불가)
  if (viewer.role === 'GROUP_MANAGER') {
    if (input.targetType === 'ALL' || input.targetType === 'DIVISION') {
      throw new Error('해당 범위의 공지는 작성할 수 없습니다');
    }
  }
}

/**
 * 본인에게 보이는 공지 목록 조회 (모바일/일반 사용자용)
 */
export async function listForViewer(viewer: ViewerContext, params: ListParams = {}) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.NoticeWhereInput = {
    ...buildVisibilityFilter(viewer),
    ...(params.search && {
      OR: [
        { title: { contains: params.search, mode: 'insensitive' } },
        { content: { contains: params.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      skip,
      take: limit,
      include: {
        author: { select: { id: true, name: true, role: true } },
        reads: {
          where: { userId: viewer.userId },
          select: { id: true, readAt: true },
        },
      },
    }),
    prisma.notice.count({ where }),
  ]);

  const data = items.map((n) => ({
    ...n,
    isRead: n.reads.length > 0,
    reads: undefined,
  }));

  return { items: data, total, page, limit };
}

/**
 * 미읽음 개수 (모바일 뱃지용)
 */
export async function unreadCount(viewer: ViewerContext): Promise<number> {
  const where = buildVisibilityFilter(viewer);
  const total = await prisma.notice.count({
    where: {
      ...where,
      reads: { none: { userId: viewer.userId } },
    },
  });
  return total;
}

/**
 * 관리자용 전체 목록 (임시저장 포함)
 */
export async function listForAdmin(viewer: ViewerContext, params: ListParams = {}) {
  assertCanWrite(viewer.role);

  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.NoticeWhereInput = {
    deletedAt: null,
    ...(params.targetType && { targetType: params.targetType }),
    ...(params.search && {
      OR: [
        { title: { contains: params.search, mode: 'insensitive' } },
        { content: { contains: params.search, mode: 'insensitive' } },
      ],
    }),
  };

  // SUPER_ADMIN 외에는 본인 권한 범위 내 공지만 조회
  if (viewer.role !== 'SUPER_ADMIN') {
    const scope: Prisma.NoticeWhereInput[] = [{ authorId: viewer.userId }];
    if (
      viewer.division &&
      (viewer.role === 'HQ_ADMIN' || viewer.role === 'YEONGNAM_ADMIN')
    ) {
      scope.push({
        targetType: 'DIVISION',
        targetDivisions: { has: viewer.division },
      });
    }
    where.OR = scope;
  }

  const [items, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      include: {
        author: { select: { id: true, name: true, role: true } },
        _count: { select: { reads: true } },
      },
    }),
    prisma.notice.count({ where }),
  ]);

  return { items, total, page, limit };
}

/**
 * 상세 조회 (자동 읽음 처리 포함)
 */
export async function getById(viewer: ViewerContext, id: string, markRead = true) {
  const notice = await prisma.notice.findFirst({
    where: { id, deletedAt: null },
    include: {
      author: { select: { id: true, name: true, role: true } },
      _count: { select: { reads: true } },
    },
  });
  if (!notice) throw new Error('공지를 찾을 수 없습니다');

  // 관리자가 아닌 경우 가시성 검증
  if (!ADMIN_ROLES.includes(viewer.role)) {
    const isVisible = await prisma.notice.findFirst({
      where: { id, ...buildVisibilityFilter(viewer) },
      select: { id: true },
    });
    if (!isVisible) throw new Error('공지를 찾을 수 없습니다');
  }

  if (markRead) {
    await prisma.noticeRead.upsert({
      where: { noticeId_userId: { noticeId: id, userId: viewer.userId } },
      update: {},
      create: { noticeId: id, userId: viewer.userId },
    });
  }

  return notice;
}

/**
 * 공지 작성
 */
export async function create(viewer: ViewerContext, input: CreateInput) {
  assertCanWrite(viewer.role);
  assertTargetAllowed(viewer, input);

  if (!input.title?.trim()) throw new Error('제목은 필수입니다');
  if (!input.content?.trim()) throw new Error('내용은 필수입니다');

  return prisma.notice.create({
    data: {
      title: input.title.trim(),
      content: input.content,
      targetType: input.targetType,
      targetDivisions: input.targetDivisions || [],
      targetRoles: input.targetRoles || [],
      targetUserIds: input.targetUserIds || [],
      isPinned: input.isPinned ?? false,
      publishedAt: input.publishedAt === undefined ? new Date() : input.publishedAt,
      expiresAt: input.expiresAt ?? null,
      authorId: viewer.userId,
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
  });
}

/**
 * 공지 수정
 */
export async function update(viewer: ViewerContext, id: string, input: UpdateInput) {
  assertCanWrite(viewer.role);

  const existing = await prisma.notice.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw new Error('공지를 찾을 수 없습니다');

  if (viewer.role !== 'SUPER_ADMIN' && existing.authorId !== viewer.userId) {
    throw new Error('본인이 작성한 공지만 수정할 수 있습니다');
  }

  if (input.targetType) {
    assertTargetAllowed(viewer, input);
  }

  return prisma.notice.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.targetType !== undefined && { targetType: input.targetType }),
      ...(input.targetDivisions !== undefined && {
        targetDivisions: input.targetDivisions,
      }),
      ...(input.targetRoles !== undefined && { targetRoles: input.targetRoles }),
      ...(input.targetUserIds !== undefined && {
        targetUserIds: input.targetUserIds,
      }),
      ...(input.isPinned !== undefined && { isPinned: input.isPinned }),
      ...(input.publishedAt !== undefined && { publishedAt: input.publishedAt }),
      ...(input.expiresAt !== undefined && { expiresAt: input.expiresAt }),
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
  });
}

/**
 * 공지 소프트 삭제
 */
export async function softDelete(viewer: ViewerContext, id: string) {
  assertCanWrite(viewer.role);
  const existing = await prisma.notice.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw new Error('공지를 찾을 수 없습니다');
  if (viewer.role !== 'SUPER_ADMIN' && existing.authorId !== viewer.userId) {
    throw new Error('본인이 작성한 공지만 삭제할 수 있습니다');
  }
  await prisma.notice.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
