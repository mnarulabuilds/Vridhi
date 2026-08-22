import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

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

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: {
                email,
            },
        });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: {
                id,
            },
        });
    }

    async create(data: {
        name: string;
        email: string;
        passwordHash: string;
    }) {
        return this.prisma.user.create({
            data: {
                ...data,
                categories: {
                    create: DEFAULT_CATEGORIES,
                },
            },
        });
    }
}
