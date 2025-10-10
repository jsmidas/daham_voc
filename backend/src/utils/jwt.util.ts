import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  division?: string;
}

/**
 * Generate JWT token
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error: any) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Refresh JWT token
 */
export function refreshToken(oldToken: string): string {
  const payload = verifyToken(oldToken);

  // Remove expiration fields before creating new token
  const { userId, email, role, division } = payload;

  return generateToken({
    userId,
    email,
    role,
    division,
  });
}
