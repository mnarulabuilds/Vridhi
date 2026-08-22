import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsString, Min } from 'class-validator';

export class UpsertBudgetDto {
  @IsString() categoryId: string;
  @Type(() => Number) @IsNumber() @Min(0) amount: number;
  @IsDateString() periodStart: string;
  @IsDateString() periodEnd: string;
}
