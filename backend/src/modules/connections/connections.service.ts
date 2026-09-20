import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BANK_AGGREGATOR, type BankAggregator } from './aggregators/bank-aggregator.interface';
import { importHash } from '../imports/imports.service';

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(BANK_AGGREGATOR) private readonly aggregator: BankAggregator,
  ) {}

  list(userId: string) {
    return this.prisma.financialConnection.findMany({
      where: { userId },
      include: { externalAccounts: { include: { account: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLinkSession(userId: string) {
    return this.aggregator.createLinkSession(userId);
  }

  async completeLink(userId: string, publicToken: string) {
    const exchanged = await this.aggregator.exchangePublicToken(publicToken);
    const connection = await this.prisma.financialConnection.create({
      data: {
        userId,
        provider: this.aggregator.providerId,
        institutionName: exchanged.institutionName,
        externalItemId: exchanged.externalItemId,
        status: ConnectionStatus.LINKED,
      },
    });
    return connection;
  }

  async sync(userId: string, connectionId: string) {
    const connection = await this.prisma.financialConnection.findFirst({
      where: { id: connectionId, userId },
      include: { externalAccounts: { include: { account: true } } },
    });
    if (!connection?.externalItemId) {
      throw new NotFoundException('Connection not found');
    }

    await this.prisma.financialConnection.update({
      where: { id: connection.id },
      data: { status: ConnectionStatus.SYNCING, lastError: null },
    });

    try {
      const result = await this.aggregator.syncTransactions(connection.externalItemId);
      let created = 0;
      for (const externalAccount of connection.externalAccounts) {
        const account = externalAccount.account;
        if (!account) continue;
        for (const tx of result.transactions) {
          const hash = importHash(
            account.id,
            tx.transactionDate.toISOString(),
            tx.amount,
            tx.title,
            tx.type,
          );
          try {
            await this.prisma.transaction.create({
              data: {
                title: tx.title,
                amount: tx.amount,
                type: tx.type,
                merchant: tx.merchant,
                transactionDate: tx.transactionDate,
                accountId: account.id,
                externalId: tx.externalId,
                importHash: hash,
              },
            });
            created += 1;
          } catch {
            // duplicate importHash / externalId
          }
        }
      }
      return this.prisma.financialConnection.update({
        where: { id: connection.id },
        data: {
          status: ConnectionStatus.LINKED,
          lastSyncedAt: new Date(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      await this.prisma.financialConnection.update({
        where: { id: connection.id },
        data: { status: ConnectionStatus.ERROR, lastError: message },
      });
      throw error;
    }
  }
}
