import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { LedgerEntry } from '../../common/money/ledger';
import { positionForAccount } from '../../common/money/net-worth';
import { LedgerLoaderService } from '../../common/ledger/ledger-loader.service';

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerLoader: LedgerLoaderService,
  ) {}

  private withCurrentBalance(account: {
    id: string;
    type: string;
    openingBalance: unknown;
    createdAt?: Date;
    transactions: LedgerEntry[];
    incomingTransfers: LedgerEntry[];
  }) {
    const { transactions, incomingTransfers, ...accountData } = account;
    const entries = [...transactions, ...incomingTransfers];
    const position = positionForAccount({
      id: account.id,
      type: account.type,
      openingBalance: Number(account.openingBalance),
      createdAt: account.createdAt,
      entries,
    });
    return {
      ...accountData,
      currentBalance: position.displayBalance,
      ledgerBalance: position.ledgerBalance,
      kind: position.kind,
      netWorthContribution: position.contribution,
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
    });
    const entriesByAccount = await this.ledgerLoader.loadEntriesForAccounts(
      userId,
      accounts.map((account) => account.id),
    );
    return accounts.map((account) =>
      this.withCurrentBalance({
        ...account,
        transactions: entriesByAccount.get(account.id) ?? [],
        incomingTransfers: [],
      }),
    );
  }

  async findOne(userId: string, accountId: string) {
    await this.getAccountOrThrow(userId, accountId);
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
    });
    const entriesByAccount = await this.ledgerLoader.loadEntriesForAccounts(userId, [accountId]);
    const entries = entriesByAccount.get(accountId) ?? [];
    return this.withCurrentBalance({
      ...account,
      transactions: entries,
      incomingTransfers: [],
    });
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
