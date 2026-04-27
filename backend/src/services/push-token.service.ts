/**
 * Push Token Service
 * @description 모바일 푸시 토큰 등록/해제
 */

import { prisma } from '../config/database';

export interface RegisterTokenInput {
  userId: string;
  token: string;
  platform: string; // 'android' | 'ios'
  deviceName?: string;
  appVersion?: string;
}

/**
 * 토큰 등록 또는 갱신 (idempotent)
 *  - 같은 token 이 이미 존재하면 userId, lastUsedAt 등을 갱신
 *  - 같은 userId 의 다른 기기 토큰은 그대로 유지 (멀티 디바이스 지원)
 */
export async function registerToken(input: RegisterTokenInput) {
  if (!input.token?.startsWith('ExponentPushToken[')) {
    throw new Error('유효하지 않은 푸시 토큰 형식입니다');
  }

  return prisma.pushToken.upsert({
    where: { token: input.token },
    create: {
      userId: input.userId,
      token: input.token,
      platform: input.platform,
      deviceName: input.deviceName,
      appVersion: input.appVersion,
      isActive: true,
    },
    update: {
      userId: input.userId,
      platform: input.platform,
      deviceName: input.deviceName,
      appVersion: input.appVersion,
      isActive: true,
      lastUsedAt: new Date(),
    },
  });
}

/**
 * 토큰 해제 (로그아웃 시 호출)
 *  - hard delete 대신 isActive=false 로 비활성화 (감사 추적용)
 */
export async function unregisterToken(token: string): Promise<void> {
  await prisma.pushToken.updateMany({
    where: { token },
    data: { isActive: false },
  });
}

/**
 * 사용자의 모든 활성 토큰 조회
 */
export async function getActiveTokensForUser(userId: string): Promise<string[]> {
  const tokens = await prisma.pushToken.findMany({
    where: { userId, isActive: true },
    select: { token: true },
  });
  return tokens.map((t) => t.token);
}

/**
 * 여러 사용자의 활성 토큰 조회
 */
export async function getActiveTokensForUsers(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: userIds }, isActive: true },
    select: { token: true },
  });
  return tokens.map((t) => t.token);
}

/**
 * Expo가 반환한 무효 토큰들 일괄 비활성화
 *  (push 발송 후 receipt 확인 시 'DeviceNotRegistered' 등 발생한 토큰들)
 */
export async function deactivateTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  await prisma.pushToken.updateMany({
    where: { token: { in: tokens } },
    data: { isActive: false },
  });
}
