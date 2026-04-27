/**
 * Notice Controller
 * @description 공지 관리 컨트롤러
 */

import { Request, Response } from 'express';
import * as noticeService from '../services/notice.service';
import {
  successResponse,
  errorResponse,
  createPaginationMeta,
} from '../utils/api-response.util';
import { Division, NoticeTarget, Role } from '@prisma/client';

function viewerFromReq(req: Request) {
  const u = req.user!;
  return {
    userId: u.userId,
    role: u.role as Role,
    division: (u.division as Division | undefined) ?? null,
  };
}

function parseDate(v: unknown): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

export async function listMine(req: Request, res: Response): Promise<void> {
  try {
    const viewer = viewerFromReq(req);
    const { items, total, page, limit } = await noticeService.listForViewer(viewer, {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      search: req.query.search as string | undefined,
    });
    res.json(successResponse(items, undefined, createPaginationMeta(page, limit, total)));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

export async function listAdmin(req: Request, res: Response): Promise<void> {
  try {
    const viewer = viewerFromReq(req);
    const { items, total, page, limit } = await noticeService.listForAdmin(viewer, {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      targetType: req.query.targetType as NoticeTarget | undefined,
      search: req.query.search as string | undefined,
    });
    res.json(successResponse(items, undefined, createPaginationMeta(page, limit, total)));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

export async function unreadCount(req: Request, res: Response): Promise<void> {
  try {
    const viewer = viewerFromReq(req);
    const count = await noticeService.unreadCount(viewer);
    res.json(successResponse({ count }));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const viewer = viewerFromReq(req);
    const markRead = req.query.markRead !== 'false';
    const notice = await noticeService.getById(viewer, req.params.id, markRead);
    res.json(successResponse(notice));
  } catch (error: any) {
    res.status(404).json(errorResponse(error.message));
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const viewer = viewerFromReq(req);
    const {
      title,
      content,
      targetType,
      targetDivisions,
      targetRoles,
      targetUserIds,
      isPinned,
      publishedAt,
      expiresAt,
    } = req.body ?? {};

    const notice = await noticeService.create(viewer, {
      title,
      content,
      targetType,
      targetDivisions,
      targetRoles,
      targetUserIds,
      isPinned,
      publishedAt: parseDate(publishedAt),
      expiresAt: parseDate(expiresAt),
    });
    res.status(201).json(successResponse(notice, '공지가 등록되었습니다'));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const viewer = viewerFromReq(req);
    const body = req.body ?? {};
    const notice = await noticeService.update(viewer, req.params.id, {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.targetType !== undefined && { targetType: body.targetType }),
      ...(body.targetDivisions !== undefined && { targetDivisions: body.targetDivisions }),
      ...(body.targetRoles !== undefined && { targetRoles: body.targetRoles }),
      ...(body.targetUserIds !== undefined && { targetUserIds: body.targetUserIds }),
      ...(body.isPinned !== undefined && { isPinned: body.isPinned }),
      ...(body.publishedAt !== undefined && { publishedAt: parseDate(body.publishedAt) }),
      ...(body.expiresAt !== undefined && { expiresAt: parseDate(body.expiresAt) }),
    });
    res.json(successResponse(notice, '공지가 수정되었습니다'));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const viewer = viewerFromReq(req);
    await noticeService.softDelete(viewer, req.params.id);
    res.json(successResponse(null, '공지가 삭제되었습니다'));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}
