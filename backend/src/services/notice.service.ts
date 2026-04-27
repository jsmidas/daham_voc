/**
 * Notice Service
 * @description 공지 관리 서비스 (부문/역할/개인 타겟팅)
 */

import { prisma } from '../config/database';
import { Prisma, Division, Role, NoticeTarget } from '@prisma/client';
import * as pushSendService from './push-send.service';

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
  sendPush?: boolean; // 등록 즉시 푸시 알림도 함께 발송 (publishedAt 이 즉시 발행일 때만 동작)
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

// 비관리자에게 공지를 보낼 수 있는 역할 (GROUP_MANAGER가 SUPER_ADMIN/HQ_ADMIN을 타겟팅하는 권한 escalation 방지)
const GROUP_MANAGER_TARGETABLE_ROLES: Role[] = [
  'SITE_MANAGER',
  'SITE_STAFF',
  'DELIVERY_DRIVER',
  'CLIENT',
  'CUSTOMER',
];

/**
 * 타겟 입력 정합성 검증 (배열 비어있는지)
 */
function assertTargetPayloadValid(input: CreateInput | UpdateInput) {
  if (input.targetType === 'DIVISION') {
    if (!input.targetDivisions || input.targetDivisions.length === 0) {
      throw new Error('부문을 1개 이상 선택해야 합니다');
    }
  }
  if (input.targetType === 'ROLE') {
    if (!input.targetRoles || input.targetRoles.length === 0) {
      throw new Error('역할을 1개 이상 선택해야 합니다');
    }
  }
  if (input.targetType === 'USER') {
    if (!input.targetUserIds || input.targetUserIds.length === 0) {
      throw new Error('대상자를 1명 이상 선택해야 합니다');
    }
  }
}

/**
 * 관리자가 작성/수정 시 본인 권한 범위 내 대상만 지정 가능한지 검증
 */
function assertTargetAllowed(viewer: ViewerContext, input: CreateInput | UpdateInput) {
  assertTargetPayloadValid(input);

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

  // GROUP_MANAGER는 ROLE/USER만 가능 (DIVISION/ALL 불가) + 타겟팅 가능 역할 제한
  if (viewer.role === 'GROUP_MANAGER') {
    if (input.targetType === 'ALL' || input.targetType === 'DIVISION') {
      throw new Error('해당 범위의 공지는 작성할 수 없습니다');
    }
    if (input.targetType === 'ROLE') {
      const targets = input.targetRoles || [];
      const disallowed = targets.filter((r) => !GROUP_MANAGER_TARGETABLE_ROLES.includes(r));
      if (disallowed.length > 0) {
        throw new Error(
          `다음 역할에는 공지를 보낼 수 없습니다: ${disallowed.join(', ')}`
        );
      }
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

  const publishedAt =
    input.publishedAt === undefined ? new Date() : input.publishedAt;

  const notice = await prisma.notice.create({
    data: {
      title: input.title.trim(),
      content: input.content,
      targetType: input.targetType,
      targetDivisions: input.targetDivisions || [],
      targetRoles: input.targetRoles || [],
      targetUserIds: input.targetUserIds || [],
      isPinned: input.isPinned ?? false,
      publishedAt,
      expiresAt: input.expiresAt ?? null,
      authorId: viewer.userId,
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
  });

  // 즉시 발행 + sendPush=true 인 경우 푸시 발송 (await 하지 않음 — 응답 지연 방지)
  // 임시저장(publishedAt=null) 또는 미래 발행은 발송하지 않음
  if (input.sendPush && publishedAt && publishedAt.getTime() <= Date.now()) {
    void sendPushForNotice(notice).catch((err) =>
      console.error('[notice] push send failed:', err)
    );
  }

  return notice;
}

/**
 * 공지 대상자에게 푸시 발송
 */
async function sendPushForNotice(notice: {
  id: string;
  title: string;
  content: string;
  targetType: NoticeTarget;
  targetDivisions: Division[];
  targetRoles: Role[];
  targetUserIds: string[];
}) {
  // 가시성 규칙으로 대상 사용자 ID 추출 → 그 사용자들의 활성 푸시 토큰 조회
  const userWhere: Prisma.UserWhereInput[] = [];
  if (notice.targetType === 'ALL') {
    userWhere.push({ isActive: true });
  } else if (notice.targetType === 'DIVISION') {
    userWhere.push({ isActive: true, division: { in: notice.targetDivisions } });
  } else if (notice.targetType === 'ROLE') {
    userWhere.push({ isActive: true, role: { in: notice.targetRoles } });
  } else if (notice.targetType === 'USER') {
    userWhere.push({ isActive: true, id: { in: notice.targetUserIds } });
  } else {
    return;
  }

  const users = await prisma.user.findMany({
    where: { AND: userWhere },
    select: { id: true },
  });
  if (users.length === 0) return;

  const tokens = await prisma.pushToken.findMany({
    where: {
      userId: { in: users.map((u) => u.id) },
      isActive: true,
    },
    select: { token: true },
  });
  if (tokens.length === 0) {
    console.log(`[notice] no active push tokens for notice ${notice.id}`);
    return;
  }

  await pushSendService.sendPush({
    tokens: tokens.map((t) => t.token),
    title: notice.title,
    body: notice.content.slice(0, 120), // 본문 너무 길면 자름
    data: { type: 'notice', noticeId: notice.id },
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

  // targetType 또는 어느 target 배열이라도 변경된다면 권한 재검증
  // (existing 값과 input 값을 합쳐서 최종 상태로 검증)
  if (
    input.targetType !== undefined ||
    input.targetDivisions !== undefined ||
    input.targetRoles !== undefined ||
    input.targetUserIds !== undefined
  ) {
    const merged: CreateInput = {
      title: existing.title,
      content: existing.content,
      targetType: (input.targetType ?? existing.targetType) as NoticeTarget,
      targetDivisions: (input.targetDivisions ?? existing.targetDivisions) as Division[],
      targetRoles: (input.targetRoles ?? existing.targetRoles) as Role[],
      targetUserIds: input.targetUserIds ?? existing.targetUserIds,
    };
    assertTargetAllowed(viewer, merged);
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
