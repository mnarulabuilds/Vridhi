import { AuthService } from './auth.service';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

describe('AuthService', () => {
  const usersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };
  const jwtService = { signAsync: jest.fn().mockResolvedValue('access') };
  const prisma = {
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: { update: jest.fn() },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_REFRESH_TOKEN_EXPIRY_DAYS') return 30;
      if (key === 'NODE_ENV') return 'test';
      return undefined;
    }),
  };

  const emailService = { sendPasswordReset: jest.fn().mockResolvedValue(undefined) };
  const entitlements = { ensureSubscription: jest.fn().mockResolvedValue({ plan: 'FREE' }) };

  const service = new AuthService(
    usersService as any,
    jwtService as any,
    prisma as any,
    configService as any,
    emailService as any,
    entitlements as any,
  );

  const user = {
    id: 'u1',
    name: 'Maya',
    email: 'maya@example.com',
    preferredCurrency: 'INR',
    timezone: 'Asia/Kolkata',
    locale: 'en-IN',
    passwordHash: '',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jwtService.signAsync.mockResolvedValue('access');
    user.passwordHash = await bcrypt.hash('secret12', 4);
  });

  it('rejects unknown login credentials', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await expect(service.login({ email: 'a@b.com', password: 'secret12' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('logs in with valid credentials', async () => {
    usersService.findByEmail.mockResolvedValue(user);
    prisma.refreshToken.create.mockResolvedValue({});
    const res = await service.login({ email: 'maya@example.com', password: 'secret12' });
    expect(res.accessToken).toBe('access');
    expect(res.user.email).toBe('maya@example.com');
  });

  it('rejects duplicate registration', async () => {
    usersService.findByEmail.mockResolvedValue(user);
    await expect(
      service.register({
        name: 'Maya',
        email: 'maya@example.com',
        password: 'secret12',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('registers a new user', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(user);
    prisma.refreshToken.create.mockResolvedValue({});
    const res = await service.register({
      name: 'Maya',
      email: 'maya@example.com',
      password: 'secret12',
    });
    expect(res.refreshToken).toHaveLength(96);
  });

  it('rejects invalid refresh tokens', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(null);
    await expect(service.refresh('not-a-real-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates refresh tokens', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user,
    });
    prisma.refreshToken.update.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({});
    const res = await service.refresh('abc');
    expect(res.accessToken).toBe('access');
  });

  it('logout is idempotent', async () => {
    await expect(service.logout()).resolves.toEqual({ success: true });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    await expect(service.logout('token')).resolves.toEqual({ success: true });
  });

  it('changes password and revokes sessions', async () => {
    usersService.findById.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue({});
    prisma.refreshToken.updateMany.mockResolvedValue({});
    await expect(service.changePassword('u1', 'secret12', 'newsecret12')).resolves.toEqual({
      success: true,
    });
    await expect(service.changePassword('u1', 'secret12', 'secret12')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('forgot password always returns accepted', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await expect(service.forgotPassword('ghost@example.com')).resolves.toEqual({ accepted: true });
    usersService.findByEmail.mockResolvedValue(user);
    prisma.passwordResetToken.create.mockResolvedValue({});
    const res = await service.forgotPassword('maya@example.com');
    expect(res.accepted).toBe(true);
  });

  it('returns profile and revokes all sessions', async () => {
    usersService.findById.mockResolvedValue(user);
    await expect(service.getProfile('u1')).resolves.toMatchObject({ email: user.email });
    prisma.refreshToken.updateMany.mockResolvedValue({});
    await expect(service.logoutAll('u1')).resolves.toEqual({ success: true });
  });

  it('resets password with a valid token', async () => {
    const token = 'reset-token';
    const tokenHash = createHash('sha256').update(token).digest('hex');
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'pr1',
      userId: 'u1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prisma.user.update.mockResolvedValue({});
    prisma.passwordResetToken.update.mockResolvedValue({});
    prisma.refreshToken.updateMany.mockResolvedValue({});
    prisma.$transaction.mockImplementation((ops: unknown[]) => Promise.all(ops as Promise<unknown>[]));
    await expect(service.resetPassword(token, 'newsecret12')).resolves.toEqual({ success: true });
    expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith({ where: { tokenHash } });
  });
});
