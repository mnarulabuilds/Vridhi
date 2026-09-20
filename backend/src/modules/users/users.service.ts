import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: TransactionType.INCOME },
  { name: 'Bonus', type: TransactionType.INCOME },
  { name: 'Other Income', type: TransactionType.INCOME },
  { name: 'Groceries', type: TransactionType.EXPENSE },
  { name: 'Rent/Mortgage', type: TransactionType.EXPENSE },
  { name: 'Utilities', type: TransactionType.EXPENSE },
  { name: 'Dining', type: TransactionType.EXPENSE },
  { name: 'Transport', type: TransactionType.EXPENSE },
  { name: 'Health', type: TransactionType.EXPENSE },
  { name: 'Shopping', type: TransactionType.EXPENSE },
  { name: 'Other', type: TransactionType.EXPENSE },
];

export function toPublicProfile(user: {
  id: string;
  name: string;
  email: string;
  preferredCurrency: string;
  timezone: string;
  locale: string;
  onboardingCompletedAt?: Date | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    preferredCurrency: user.preferredCurrency,
    timezone: user.timezone,
    locale: user.locale,
    onboardingCompletedAt: user.onboardingCompletedAt ?? null,
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: { name: string; email: string; passwordHash: string }) {
    return this.prisma.user.create({
      data: {
        ...data,
        categories: { create: DEFAULT_CATEGORIES },
      },
    });
  }

  async completeOnboarding(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompletedAt: new Date() },
    });
    return toPublicProfile(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name?.trim(),
        preferredCurrency: dto.preferredCurrency?.toUpperCase(),
        timezone: dto.timezone,
        locale: dto.locale,
      },
    });
    return toPublicProfile(user);
  }

  async exportData(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const [accounts, categories, budgets, transactions, conversations] = await Promise.all([
      this.prisma.account.findMany({ where: { userId } }),
      this.prisma.category.findMany({ where: { userId } }),
      this.prisma.budget.findMany({ where: { userId }, include: { category: true } }),
      this.prisma.transaction.findMany({
        where: { account: { userId } },
        include: { category: true },
        orderBy: { transactionDate: 'desc' },
      }),
      this.prisma.aiConversation.findMany({
        where: { userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      }),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      profile: toPublicProfile(user),
      accounts,
      categories,
      budgets,
      transactions,
      conversations,
    };
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid password');
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }
}
