/**
 * Push Token Controller
 */

import { Request, Response } from 'express';
import * as pushTokenService from '../services/push-token.service';
import { successResponse, errorResponse } from '../utils/api-response.util';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { token, platform, deviceName, appVersion } = req.body ?? {};

    if (!token || !platform) {
      res.status(400).json(errorResponse('token, platform 은 필수입니다'));
      return;
    }
    if (platform !== 'android' && platform !== 'ios') {
      res.status(400).json(errorResponse('platform 은 android 또는 ios 여야 합니다'));
      return;
    }

    const result = await pushTokenService.registerToken({
      userId,
      token,
      platform,
      deviceName,
      appVersion,
    });
    res.status(201).json(successResponse(result, '푸시 토큰이 등록되었습니다'));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

export async function unregister(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body ?? {};
    if (!token) {
      res.status(400).json(errorResponse('token 이 필요합니다'));
      return;
    }
    await pushTokenService.unregisterToken(token);
    res.json(successResponse(null, '푸시 토큰이 해제되었습니다'));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}
