import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetClass } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  listHoldings(userId: string) {
    return this.prisma.holding.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  }

  async upsertHolding(
    userId: string,
    dto: {
      id?: string;
      symbol: string;
      name: string;
      assetClass?: AssetClass;
      quantity: number;
      costBasis: number;
      currency?: string;
      lastPrice?: number;
      accountId?: string;
    },
  ) {
    const data = {
      symbol: dto.symbol.toUpperCase(),
      name: dto.name,
      assetClass: dto.assetClass ?? AssetClass.OTHER,
      quantity: dto.quantity,
      costBasis: dto.costBasis,
      currency: dto.currency ?? 'INR',
      lastPrice: dto.lastPrice,
      lastPriceAt: dto.lastPrice != null ? new Date() : undefined,
      accountId: dto.accountId,
    };
    if (dto.id) {
      const existing = await this.prisma.holding.findFirst({ where: { id: dto.id, userId } });
      if (!existing) throw new NotFoundException('Holding not found');
      return this.prisma.holding.update({ where: { id: dto.id }, data });
    }
    return this.prisma.holding.create({ data: { ...data, userId } });
  }

  async deleteHolding(userId: string, id: string) {
    const existing = await this.prisma.holding.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Holding not found');
    await this.prisma.holding.delete({ where: { id } });
    return { success: true };
  }

  async summary(userId: string) {
    const holdings = await this.listHoldings(userId);
    let invested = 0;
    let marketValue = 0;
    const byClass: Record<string, number> = {};
    for (const row of holdings) {
      const cost = Number(row.costBasis);
      const price = row.lastPrice != null ? Number(row.lastPrice) : cost / Math.max(Number(row.quantity), 1);
      const value = price * Number(row.quantity);
      invested += cost;
      marketValue += value;
      byClass[row.assetClass] = (byClass[row.assetClass] ?? 0) + value;
    }
    const gain = marketValue - invested;
    return {
      invested,
      marketValue,
      gain,
      gainPercent: invested ? gain / invested : 0,
      allocation: byClass,
      holdings,
    };
  }
}
