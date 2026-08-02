import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';


import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionsService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async create(
        userId: string,
        dto: CreateTransactionDto,
    ) {
        // Ensure the account belongs to the user
        if (dto.accountId) {
            const account =
                await this.prisma.account.findFirst({
                    where: {
                        id: dto.accountId,
                        userId,
                        isArchived: false,
                    },
                });

            if (!account) {
                throw new NotFoundException(
                    'Account not found.',
                );
            }
        }

        return this.prisma.transaction.create({
            data: {
                title: dto.title,
                amount: dto.amount,
                type: dto.type,
                category: dto.category,
                notes: dto.notes,
                transactionDate: new Date(
                    dto.transactionDate,
                ),
                accountId: dto.accountId,
            },
        });
    }

    async findAll(userId: string) {
        return this.prisma.transaction.findMany({
            where: {
                account: {
                    userId,
                },
            },

            include: {
                account: true,
            },

            orderBy: {
                transactionDate: 'desc',
            },
        });
    }

    async findOne(
        userId: string,
        id: string,
    ) {
        const transaction =
            await this.prisma.transaction.findFirst({
                where: {
                    id,

                    account: {
                        userId,
                    },
                },

                include: {
                    account: true,
                },
            });

        if (!transaction) {
            throw new NotFoundException(
                'Transaction not found.',
            );
        }

        return transaction;
    }

    async update(
        userId: string,
        id: string,
        dto: UpdateTransactionDto,
    ) {
        await this.findOne(userId, id);

        return this.prisma.transaction.update({
            where: {
                id,
            },

            data: {
                ...dto,

                transactionDate:
                    dto.transactionDate
                        ? new Date(
                            dto.transactionDate,
                        )
                        : undefined,
            },
        });
    }

    async remove(
        userId: string,
        id: string,
    ) {
        await this.findOne(userId, id);

        await this.prisma.transaction.delete({
            where: {
                id,
            },
        });

        return {
            success: true,
        };
    }
}