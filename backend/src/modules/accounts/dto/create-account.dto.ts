import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';
import { AccountType } from '../enum/account-type.enum';


export class CreateAccountDto {

  @IsString()
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingBalance: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;
}