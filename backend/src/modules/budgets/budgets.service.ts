import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertBudgetDto } from './dto/upsert-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  findForPeriod(userId: string, periodStart: Date) {
    return this.prisma.budget.findMany({ where: { userId, periodStart }, include: { category: true }, orderBy: { category: { name: 'asc' } } });
  }

  async upsert(userId: string, dto: UpsertBudgetDto) {
    const start = new Date(dto.periodStart);
    const end = new Date(dto.periodEnd);
    if (start >= end) throw new BadRequestException('Budget period end must be after its start');
    const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId, userId, isArchived: false } });
    if (!category) throw new NotFoundException('Category not found');
    return this.prisma.budget.upsert({
      where: { userId_categoryId_periodStart: { userId, categoryId: dto.categoryId, periodStart: start } },
      create: { userId, categoryId: dto.categoryId, amount: dto.amount, periodStart: start, periodEnd: end },
      update: { amount: dto.amount, periodEnd: end },
      include: { category: true },
    });
  }
}
