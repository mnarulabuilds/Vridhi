import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

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
  };
  const configService = { get: jest.fn().mockReturnValue(30) };

  const service = new AuthService(
    usersService as any,
    jwtService as any,
    prisma as any,
    configService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jwtService.signAsync.mockResolvedValue('access');
  });

  it('rejects unknown login credentials', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await expect(service.login({ email: 'a@b.com', password: 'secret12' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects invalid refresh tokens', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(null);
    await expect(service.refresh('not-a-real-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
