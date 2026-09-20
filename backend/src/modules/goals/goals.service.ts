import { Injectable, NotFoundException } from '@nestjs/common';
import { GoalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId, status: { not: GoalStatus.COMPLETED } },
      orderBy: { targetDate: 'asc' },
    });
  }

  async upsert(
    userId: string,
    dto: {
      id?: string;
      name: string;
      targetAmount: number;
      currentAmount?: number;
      targetDate?: string;
      currency?: string;
    },
  ) {
    const data = {
      name: dto.name,
      targetAmount: dto.targetAmount,
      currentAmount: dto.currentAmount ?? 0,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      currency: dto.currency ?? 'INR',
    };
    if (dto.id) {
      const existing = await this.prisma.goal.findFirst({ where: { id: dto.id, userId } });
      if (!existing) throw new NotFoundException('Goal not found');
      return this.prisma.goal.update({ where: { id: dto.id }, data });
    }
    return this.prisma.goal.create({ data: { ...data, userId } });
  }

  async complete(userId: string, id: string) {
    const existing = await this.prisma.goal.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Goal not found');
    return this.prisma.goal.update({
      where: { id },
      data: { status: GoalStatus.COMPLETED, currentAmount: existing.targetAmount },
    });
  }
}
