import {
    ForbiddenException,
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
        return this.prisma.account.create({
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
    }

    async findAll(userId: string) {
        return this.prisma.account.findMany({
            where: {
                userId,
                isArchived: false,
            },

            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findOne(
        userId: string,
        accountId: string,
    ) {
        const account = await this.getAccountOrThrow(userId, accountId);            

        if (account.userId !== userId) {
            throw new ForbiddenException();
        }

        return account;
    }

    async update(
        userId: string,
        accountId: string,
        dto: UpdateAccountDto,
    ) {
        await this.getAccountOrThrow(userId, accountId);

        return this.prisma.account.update({
            where: {
                id: accountId,
            },
            data: dto,
        });
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