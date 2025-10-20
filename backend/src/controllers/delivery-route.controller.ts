import { Request, Response, NextFunction } from 'express';
import { DeliveryRouteService } from '../services/delivery-route.service';

const deliveryRouteService = new DeliveryRouteService();

/**
 * GET /api/v1/delivery-routes
 * 배송 코스 목록 조회
 */
export async function getDeliveryRoutes(req: Request, res: Response, next: NextFunction) {
  try {
    const { division, isActive, search } = req.query;

    const routes = await deliveryRouteService.getDeliveryRoutes({
      division: division as 'HQ' | 'YEONGNAM' | undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string | undefined,
    });

    res.json({
      success: true,
      data: routes,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/delivery-routes/:id
 * 배송 코스 상세 조회
 */
export async function getDeliveryRouteById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const route = await deliveryRouteService.getDeliveryRouteById(id);

    res.json({
      success: true,
      data: route,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/delivery-routes
 * 배송 코스 생성
 */
export async function createDeliveryRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const route = await deliveryRouteService.createDeliveryRoute(req.body);

    res.status(201).json({
      success: true,
      data: route,
      message: '배송 코스가 생성되었습니다',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/delivery-routes/:id
 * 배송 코스 수정
 */
export async function updateDeliveryRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const route = await deliveryRouteService.updateDeliveryRoute(id, req.body);

    res.json({
      success: true,
      data: route,
      message: '배송 코스가 수정되었습니다',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/delivery-routes/:id
 * 배송 코스 삭제
 */
export async function deleteDeliveryRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await deliveryRouteService.deleteDeliveryRoute(id);

    res.json({
      success: true,
      message: '배송 코스가 삭제되었습니다',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/delivery-routes/:id/stops
 * 코스에 사업장 추가
 */
export async function addSiteToRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await deliveryRouteService.addSiteToRoute(id, req.body);

    res.status(201).json({
      success: true,
      message: '사업장이 코스에 추가되었습니다',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/delivery-routes/:routeId/stops/:siteId
 * 코스에서 사업장 제거
 */
export async function removeSiteFromRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const { routeId, siteId } = req.params;
    await deliveryRouteService.removeSiteFromRoute(routeId, siteId);

    res.json({
      success: true,
      message: '사업장이 코스에서 제거되었습니다',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/delivery-routes/:id/stops/reorder
 * 코스 사업장 순서 변경
 */
export async function updateRouteStops(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await deliveryRouteService.updateRouteStops(id, req.body);

    res.json({
      success: true,
      message: '사업장 순서가 변경되었습니다',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/delivery-routes/:id/assign-drivers
 * 기사 배정
 */
export async function assignDrivers(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await deliveryRouteService.assignDrivers({
      routeId: id,
      driverIds: req.body.driverIds,
    });

    res.json({
      success: true,
      message: '기사가 배정되었습니다',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/delivery-routes/my-routes
 * 내 배송 코스 조회 (배송기사용)
 */
export async function getMyRoutes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId; // JWT에서 추출

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다',
      });
      return;
    }

    const routes = await deliveryRouteService.getDriverRoutes(userId);

    res.json({
      success: true,
      data: routes,
    });
  } catch (error) {
    next(error);
  }
}
