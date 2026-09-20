import { IsDateString, IsIn, IsString, Length, Matches, MinLength } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  @MinLength(3)
  fullLegalName!: string;

  @IsString()
  @Matches(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/, { message: 'Invalid PAN format' })
  panNumber!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsString()
  @MinLength(5)
  addressLine1!: string;

  @IsString()
  @MinLength(2)
  addressCity!: string;

  @IsString()
  @MinLength(2)
  addressState!: string;

  @IsString()
  @Length(4, 10)
  addressPostalCode!: string;

  @IsIn(['aadhaar', 'passport', 'driving_license'])
  documentType!: 'aadhaar' | 'passport' | 'driving_license';

  @IsString()
  @MinLength(4)
  documentReference!: string;
}
