import { Request, Response, NextFunction } from 'express';
import { DeliveryLogService } from '../services/delivery-log.service';

const deliveryLogService = new DeliveryLogService();

/**
 * POST /api/v1/delivery-logs
 * 배송 기록 생성
 */
export async function createDeliveryLog(req: Request, res: Response, next: NextFunction) {
  try {
    const log = await deliveryLogService.createDeliveryLog(req.body);

    res.status(201).json({
      success: true,
      data: log,
      message: '배송 기록이 생성되었습니다',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/delivery-logs/initialize
 * 일일 배송 기록 일괄 생성
 */
export async function initializeDailyLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { routeId, driverId, deliveryDate } = req.body;
    const logs = await deliveryLogService.initializeDailyLogs(
      routeId,
      driverId,
      new Date(deliveryDate)
    );

    res.status(201).json({
      success: true,
      data: logs,
      message: `${logs.length}개의 배송 기록이 생성되었습니다`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/delivery-logs/:id/check-in
 * 사업장 도착 체크인
 */
export async function checkIn(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const log = await deliveryLogService.checkIn(id, req.body);

    res.json({
      success: true,
      data: log,
      message: '체크인이 완료되었습니다',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/delivery-logs/:id/check-out
 * 사업장 출발 체크아웃
 */
export async function checkOut(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const log = await deliveryLogService.checkOut(id, req.body);

    res.json({
      success: true,
      data: log,
      message: '체크아웃이 완료되었습니다',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/delivery-logs
 * 배송 기록 목록 조회
 */
export async function getDeliveryLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { routeId, siteId, driverId, deliveryDate, status } = req.query;

    const logs = await deliveryLogService.getDeliveryLogs({
      routeId: routeId as string | undefined,
      siteId: siteId as string | undefined,
      driverId: driverId as string | undefined,
      deliveryDate: deliveryDate ? new Date(deliveryDate as string) : undefined,
      status: status as any,
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/delivery-logs/:id
 * 배송 기록 상세 조회
 */
export async function getDeliveryLogById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const log = await deliveryLogService.getDeliveryLogById(id);

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/delivery-logs/my-today
 * 오늘의 나의 배송 기록 조회 (기사용)
 */
export async function getMyTodayLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다',
      });
      return;
    }

    const logs = await deliveryLogService.getDriverTodayLogs(userId);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/delivery-logs/:id
 * 배송 기록 삭제
 */
export async function deleteDeliveryLog(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await deliveryLogService.deleteDeliveryLog(id);

    res.json({
      success: true,
      message: '배송 기록이 삭제되었습니다',
    });
  } catch (error) {
    next(error);
  }
}
