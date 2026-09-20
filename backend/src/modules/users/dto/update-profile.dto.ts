import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'] as const;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn([...SUPPORTED_CURRENCIES])
  preferredCurrency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  locale?: string;
}
