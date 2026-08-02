import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

import { TransactionType } from '../enum/transaction-type.enum';

export class CreateTransactionDto {
  @IsString()
  title: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  merchant?: string;


  @IsDateString()
  transactionDate: string;

  @IsString()
  accountId: string;
}