import { createHash } from 'crypto';
import { parse } from 'csv-parse/sync';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '../transactions/enum/transaction-type.enum';

export interface ColumnMapping {
  date: string;
  amount?: string;
  debit?: string;
  credit?: string;
  title?: string;
  description?: string;
  merchant?: string;
  type?: string;
}

export interface ImportCommitDto {
  accountId: string;
  mapping: ColumnMapping;
  rows: string[][];
  header: string[];
}

const HEADER_ALIASES: Record<keyof ColumnMapping, string[]> = {
  date: ['date', 'txn date', 'transaction date', 'value date', 'posted'],
  amount: ['amount', 'amt', 'value'],
  debit: ['debit', 'withdrawal', 'withdrawals', 'dr'],
  credit: ['credit', 'deposit', 'deposits', 'cr'],
  title: ['title', 'narration', 'particulars', 'description', 'details'],
  description: ['description', 'narration', 'particulars', 'details'],
  merchant: ['merchant', 'payee'],
  type: ['type', 'transaction type', 'cr/dr'],
};

function guessMapping(header: string[]): ColumnMapping {
  const normalized = header.map((h) => h.trim().toLowerCase());
  const find = (keys: string[]) => {
    const index = normalized.findIndex((h) => keys.includes(h));
    return index >= 0 ? header[index] : undefined;
  };
  return {
    date: find(HEADER_ALIASES.date) ?? header[0],
    amount: find(HEADER_ALIASES.amount),
    debit: find(HEADER_ALIASES.debit),
    credit: find(HEADER_ALIASES.credit),
    title: find(HEADER_ALIASES.title) ?? find(HEADER_ALIASES.description),
    description: find(HEADER_ALIASES.description),
    merchant: find(HEADER_ALIASES.merchant),
    type: find(HEADER_ALIASES.type),
  };
}

function parseAmount(value?: string) {
  if (!value) return NaN;
  const cleaned = value.replace(/[,₹$]/g, '').trim();
  return Number(cleaned);
}

function parseDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

export function importHash(accountId: string, dateIso: string, amount: number, title: string, type: string) {
  return createHash('sha256')
    .update(`${accountId}|${dateIso}|${amount}|${title}|${type}`)
    .digest('hex');
}

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  previewFromRecords(records: string[][]) {
    if (!records.length) {
      throw new BadRequestException('CSV is empty');
    }
    const header = records[0];
    const rows = records.slice(1);
    return {
      header,
      suggestedMapping: guessMapping(header),
      rowCount: rows.length,
      sample: rows.slice(0, 8),
      rows,
    };
  }

  preview(fileBuffer: Buffer) {
    const records = parse(fileBuffer, {
      relaxColumnCount: true,
      skip_empty_lines: true,
      trim: true,
    }) as string[][];
    return this.previewFromRecords(records);
  }

  async commit(userId: string, dto: ImportCommitDto) {
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId, isArchived: false },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const categories = await this.prisma.category.findMany({
      where: { userId, isArchived: false },
    });
    const otherExpense =
      categories.find((c) => c.type === 'EXPENSE' && c.name === 'Other') ??
      categories.find((c) => c.type === 'EXPENSE');
    const otherIncome =
      categories.find((c) => c.type === 'INCOME' && c.name === 'Other Income') ??
      categories.find((c) => c.type === 'INCOME');
    if (!otherExpense || !otherIncome) {
      throw new BadRequestException('User is missing default income/expense categories');
    }

    const col = (row: string[], name?: string) => {
      if (!name) return '';
      const index = dto.header.findIndex((h) => h === name);
      return index >= 0 ? (row[index] ?? '').trim() : '';
    };

    let created = 0;
    let skipped = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < dto.rows.length; i += 1) {
      const row = dto.rows[i];
      const dateValue = col(row, dto.mapping.date);
      const date = parseDate(dateValue);
      if (!date) {
        errors.push({ row: i + 2, message: 'Invalid date' });
        continue;
      }

      const debit = parseAmount(col(row, dto.mapping.debit));
      const credit = parseAmount(col(row, dto.mapping.credit));
      const rawAmount = parseAmount(col(row, dto.mapping.amount));
      const typeHint = col(row, dto.mapping.type).toUpperCase();
      const title =
        col(row, dto.mapping.title) ||
        col(row, dto.mapping.description) ||
        col(row, dto.mapping.merchant) ||
        'Imported transaction';

      let amount = 0;
      let type: TransactionType = TransactionType.EXPENSE;
      if (!Number.isNaN(debit) && debit > 0) {
        amount = debit;
        type = TransactionType.EXPENSE;
      } else if (!Number.isNaN(credit) && credit > 0) {
        amount = credit;
        type = TransactionType.INCOME;
      } else if (!Number.isNaN(rawAmount) && rawAmount !== 0) {
        amount = Math.abs(rawAmount);
        type = rawAmount < 0 || typeHint.includes('DR') || typeHint === 'DEBIT'
          ? TransactionType.EXPENSE
          : TransactionType.INCOME;
        if (typeHint.includes('CR') || typeHint === 'CREDIT' || typeHint === 'INCOME') {
          type = TransactionType.INCOME;
        }
      } else {
        errors.push({ row: i + 2, message: 'Missing amount' });
        continue;
      }

      const hash = importHash(
        dto.accountId,
        date.toISOString(),
        amount,
        title,
        type,
      );

      try {
        await this.prisma.transaction.create({
          data: {
            title,
            amount,
            type,
            merchant: col(row, dto.mapping.merchant) || null,
            notes: 'Imported from CSV',
            transactionDate: date,
            accountId: dto.accountId,
            categoryId: type === TransactionType.INCOME ? otherIncome.id : otherExpense.id,
            importHash: hash,
          },
        });
        created += 1;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          skipped += 1;
          continue;
        }
        throw error;
      }
    }

    return { created, skipped, errors };
  }
}
