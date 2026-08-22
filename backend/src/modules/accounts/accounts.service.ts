import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { Prisma } from '@prisma/client';

import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    private withCurrentBalance(account: any) {
        const transactionTotal = (account.transactions ?? []).reduce(
            (total: number, transaction: { amount: unknown; type: string }) => {
                const amount = Number(transaction.amount);

                return transaction.type === 'INCOME'
                    ? total + amount
                    : total - amount;
            },
            0,
        );

        const { transactions, ...accountData } = account;

        return {
            ...accountData,
            currentBalance: Number(account.openingBalance) + transactionTotal,
        };
    }

    private async getAccountOrThrow(
        userId: string,
        accountId: string,
    ) {
        const account = await this.prisma.account.findFirst({
            where: {
                id: accountId,
                userId,
                isArchived: false,
            },
        });

        if (!account) {
            throw new NotFoundException('Account not found');
        }

        return account;
    }

    async create(
        userId: string,
        dto: CreateAccountDto,
    ) {
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
            where: {
                userId,
                isArchived: false,
            },

            orderBy: {
                createdAt: 'desc',
            },

            include: {
                transactions: {
                    select: {
                        amount: true,
                        type: true,
                    },
                },
            },
        });

        return accounts.map(account => this.withCurrentBalance(account));
    }

    async findOne(
        userId: string,
        accountId: string,
    ) {
        await this.getAccountOrThrow(userId, accountId);

        const account = await this.prisma.account.findUniqueOrThrow({
            where: { id: accountId },
            include: {
                transactions: {
                    select: {
                        amount: true,
                        type: true,
                    },
                },
            },
        });

        return this.withCurrentBalance(account);
    }

    async update(
        userId: string,
        accountId: string,
        dto: UpdateAccountDto,
    ) {
        await this.getAccountOrThrow(userId, accountId);

        await this.prisma.account.update({
            where: {
                id: accountId,
            },
            data: dto,
        });

        return this.findOne(userId, accountId);
    }

    async archive(
        userId: string,
        accountId: string,
    ) {

        await this.getAccountOrThrow(userId, accountId);
        
        return this.prisma.account.update({
            where: {
                id: accountId,
            },
            data: {
                isArchived: true,
            },
        });
    }
}
