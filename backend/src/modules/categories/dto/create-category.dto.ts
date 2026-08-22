import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TransactionType } from '../../transactions/enum/transaction-type.enum';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(60)
  name: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}
