import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/bcrypt.util';
import { generateToken } from '../utils/jwt.util';
import { User } from '@prisma/client';

export interface RegisterDto {
  phone: string;
  name: string;
  password?: string;  // Optional - defaults to '1234'
  email?: string;
  role?: string;
  division?: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterDto): Promise<LoginResponse> {
    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existingUser) {
      throw new Error('이미 등록된 전화번호입니다');
    }

    // Use default password '1234' if not provided
    const password = data.password || '1234';

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        phone: data.phone,
        password: hashedPassword,
        name: data.name,
        email: data.email,
        role: (data.role as any) || 'STAFF',
        division: data.division as any,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: (user.email || user.phone) as string,
      role: user.role,
      division: user.division || undefined,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Login user (using phone number)
   */
  async login(phone: string, password: string): Promise<LoginResponse> {
    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new Error('전화번호 또는 비밀번호가 올바르지 않습니다');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('비활성화된 계정입니다');
    }

    // Check if user is soft deleted
    if (user.deletedAt) {
      throw new Error('삭제된 계정입니다');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('전화번호 또는 비밀번호가 올바르지 않습니다');
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: (user.email || user.phone) as string,
      role: user.role,
      division: user.division || undefined,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Get current user by ID
   */
  async getCurrentUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        staff: true,
      },
    });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword as any;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // Verify old password
    const isPasswordValid = await comparePassword(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('현재 비밀번호가 올바르지 않습니다');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}
