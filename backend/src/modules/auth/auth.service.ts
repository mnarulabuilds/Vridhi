import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService, toPublicProfile } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { EmailService } from '../../common/email/email.service';
import { EntitlementsService } from '../../common/entitlements/entitlements.service';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly entitlements: EntitlementsService,
  ) {}

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createAuthResponse(user: {
    id: string;
    name: string;
    email: string;
    preferredCurrency: string;
    timezone: string;
    locale: string;
  }) {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = randomBytes(48).toString('hex');
    const days = Number(this.configService.get('JWT_REFRESH_TOKEN_EXPIRY_DAYS') ?? 30);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: toPublicProfile(user),
    };
  }

  async register(dto: RegisterDto) {
        const existingUser = await this.usersService.findByEmail(dto.email.trim().toLowerCase());
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email.trim().toLowerCase(),
      passwordHash,
    });
    await this.entitlements.ensureSubscription(user.id);
    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto) {
        const user = await this.usersService.findByEmail(dto.email.trim().toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.createAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.createAuthResponse(stored.user);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return { success: true };
    }
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashRefreshToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return toPublicProfile(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) throw new UnauthorizedException('Current password is incorrect');
    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS) },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email.trim().toLowerCase());
    const accepted = { accepted: true as const };
    if (!user) {
      return accepted;
    }
    const token = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashRefreshToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await this.emailService.sendPasswordReset(user.email, token);
    if (this.configService.get('NODE_ENV') !== 'production') {
      return { ...accepted, debugResetToken: token };
    }
    return accepted;
  }

  async resetPassword(token: string, newPassword: string) {
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashRefreshToken(token) },
    });
    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS) },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { success: true };
  }
}
