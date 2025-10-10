import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.util';
import { errorResponse } from '../utils/api-response.util';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * JWT authentication middleware
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(errorResponse('토큰이 제공되지 않았습니다', 'NO_TOKEN'));
      return;
    }

    // Extract token
    const token = authHeader.substring(7);

    // Verify token
    const payload = verifyToken(token);

    // Attach user to request object
    req.user = payload;

    next();
  } catch (error: any) {
    res.status(401).json(errorResponse('유효하지 않은 토큰입니다', 'INVALID_TOKEN'));
  }
}

/**
 * Role-based authorization middleware
 */
export function roleMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      if (!allowedRoles.includes(userRole)) {
        res.status(403).json(errorResponse('권한이 없습니다', 'FORBIDDEN'));
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json(errorResponse('서버 오류가 발생했습니다', 'INTERNAL_ERROR'));
    }
  };
}

/**
 * Division-based access control middleware
 */
export function divisionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const userRole = req.user?.role;
    const userDivision = req.user?.division;

    // SUPER_ADMIN can access all divisions
    if (userRole === 'SUPER_ADMIN') {
      next();
      return;
    }

    // HQ_ADMIN can only access HQ division
    if (userRole === 'HQ_ADMIN' && userDivision !== 'HQ') {
      res.status(403).json(errorResponse('접근 권한이 없습니다', 'ACCESS_DENIED'));
      return;
    }

    // YEONGNAM_ADMIN can only access YEONGNAM division
    if (userRole === 'YEONGNAM_ADMIN' && userDivision !== 'YEONGNAM') {
      res.status(403).json(errorResponse('접근 권한이 없습니다', 'ACCESS_DENIED'));
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json(errorResponse('서버 오류가 발생했습니다', 'INTERNAL_ERROR'));
  }
}
