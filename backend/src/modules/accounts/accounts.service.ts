import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { currentBalance, LedgerEntry } from '../../common/money/ledger';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  private withCurrentBalance(account: {
    id: string;
    openingBalance: unknown;
    transactions: LedgerEntry[];
    incomingTransfers: LedgerEntry[];
  }) {
    const { transactions, incomingTransfers, ...accountData } = account;
    return {
      ...accountData,
      currentBalance: currentBalance(
        Number(account.openingBalance),
        [...transactions, ...incomingTransfers],
        account.id,
      ),
    };
  }

  private async getAccountOrThrow(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId, isArchived: false },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  private ledgerSelect = {
    amount: true,
    type: true,
    accountId: true,
    transferToAccountId: true,
  } as const;

  async create(userId: string, dto: CreateAccountDto) {
    const account = await this.prisma.account.create({
      data: {
        name: dto.name,
        type: dto.type,
        openingBalance: dto.openingBalance,
        currency: dto.currency ?? 'INR',
        icon: dto.icon,
        color: dto.color,
        userId,
      },
    });
    return this.findOne(userId, account.id);
  }

  async findAll(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, isArchived: false },
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: { select: this.ledgerSelect },
        incomingTransfers: { select: this.ledgerSelect },
      },
    });
    return accounts.map((account) => this.withCurrentBalance(account));
  }

  async findOne(userId: string, accountId: string) {
    await this.getAccountOrThrow(userId, accountId);
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      include: {
        transactions: { select: this.ledgerSelect },
        incomingTransfers: { select: this.ledgerSelect },
      },
    });
    return this.withCurrentBalance(account);
  }

  async update(userId: string, accountId: string, dto: UpdateAccountDto) {
    await this.getAccountOrThrow(userId, accountId);
    await this.prisma.account.update({ where: { id: accountId }, data: dto });
    return this.findOne(userId, accountId);
  }

  async archive(userId: string, accountId: string) {
    await this.getAccountOrThrow(userId, accountId);
    return this.prisma.account.update({
      where: { id: accountId },
      data: { isArchived: true },
    });
  }
}
