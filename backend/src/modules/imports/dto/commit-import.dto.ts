import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ColumnMappingDto {
  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsString()
  debit?: string;

  @IsOptional()
  @IsString()
  credit?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  merchant?: string;

  @IsOptional()
  @IsString()
  type?: string;
}

export class CommitImportDto {
  @IsString()
  accountId: string;

  @ValidateNested()
  @Type(() => ColumnMappingDto)
  mapping: ColumnMappingDto;

  @IsArray()
  @IsString({ each: true })
  header: string[];

  @IsArray()
  rows: string[][];
}
