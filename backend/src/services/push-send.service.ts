/**
 * Push Send Service
 * @description Expo Push API 를 통해 알림 발송
 *
 * Expo Push API 문서: https://docs.expo.dev/push-notifications/sending-notifications/
 *  - 한 요청에 최대 100개 메시지
 *  - 우리는 Expo가 FCM/APNs 로 forwarding 해줌 (Firebase Server Key 등록은 EAS credentials 에서 처리)
 */

import * as pushTokenService from './push-token.service';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

interface ExpoMessage {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface SendResult {
  totalTokens: number;
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

export interface SendPushOptions {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * 여러 토큰에 푸시 발송
 *  - 100개씩 청크로 나눠 Expo API 호출
 *  - DeviceNotRegistered / InvalidCredentials 토큰은 자동 비활성화
 */
export async function sendPush(options: SendPushOptions): Promise<SendResult> {
  const { tokens, title, body, data } = options;
  const result: SendResult = {
    totalTokens: tokens.length,
    successCount: 0,
    failureCount: 0,
    invalidTokens: [],
  };
  if (tokens.length === 0) return result;

  // 청크
  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    chunks.push(tokens.slice(i, i + BATCH_SIZE));
  }

  for (const chunk of chunks) {
    const messages: ExpoMessage[] = chunk.map((to) => ({
      to,
      title,
      body,
      data: data || {},
      sound: 'default',
      priority: 'high',
      channelId: 'default',
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
      });

      if (!res.ok) {
        console.error(`[push-send] Expo API ${res.status}:`, await res.text());
        result.failureCount += chunk.length;
        continue;
      }

      const json = (await res.json()) as { data?: ExpoTicket[] };
      const tickets = json.data || [];

      tickets.forEach((ticket, idx) => {
        if (ticket.status === 'ok') {
          result.successCount += 1;
        } else {
          result.failureCount += 1;
          const errCode = ticket.details?.error;
          if (
            errCode === 'DeviceNotRegistered' ||
            errCode === 'InvalidCredentials'
          ) {
            result.invalidTokens.push(chunk[idx]);
          }
          console.warn(
            `[push-send] ticket error (token=${chunk[idx]?.slice(0, 30)}...): ${ticket.message} [${errCode}]`
          );
        }
      });
    } catch (err) {
      console.error('[push-send] chunk failed:', err);
      result.failureCount += chunk.length;
    }
  }

  // 무효 토큰은 자동으로 비활성화
  if (result.invalidTokens.length > 0) {
    await pushTokenService.deactivateTokens(result.invalidTokens);
    console.log(
      `[push-send] deactivated ${result.invalidTokens.length} invalid token(s)`
    );
  }

  console.log(
    `[push-send] sent: total=${result.totalTokens}, ok=${result.successCount}, fail=${result.failureCount}`
  );
  return result;
}
