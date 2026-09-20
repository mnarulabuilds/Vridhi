import { BadRequestException, Injectable } from '@nestjs/common';
import { KycStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AutomatedKycVerifier } from './automated-kyc-verifier';
import { maskPan, normalizePan } from './pan.validator';
import { SubmitKycDto } from './dto/submit-kyc.dto';

@Injectable()
export class KycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verifier: AutomatedKycVerifier,
  ) {}

  async status(userId: string) {
    const profile = await this.prisma.kycProfile.findUnique({ where: { userId } });
    if (!profile) {
      return {
        status: KycStatus.NOT_STARTED,
        fullLegalName: null,
        panNumber: null,
        dateOfBirth: null,
        addressLine1: null,
        addressCity: null,
        addressState: null,
        addressPostalCode: null,
        documentType: null,
        verifiedAt: null,
        rejectionReason: null,
      };
    }
    return {
      status: profile.status,
      fullLegalName: profile.fullLegalName,
      panNumber: profile.panNumber ? maskPan(profile.panNumber) : null,
      dateOfBirth: profile.dateOfBirth,
      addressLine1: profile.addressLine1,
      addressCity: profile.addressCity,
      addressState: profile.addressState,
      addressPostalCode: profile.addressPostalCode,
      documentType: profile.documentType,
      verifiedAt: profile.verifiedAt,
      rejectionReason: profile.rejectionReason,
    };
  }

  async submit(userId: string, dto: SubmitKycDto) {
    const dob = new Date(dto.dateOfBirth);
    if (Number.isNaN(dob.valueOf())) {
      throw new BadRequestException('Invalid date of birth');
    }

    const result = this.verifier.verify({
      fullLegalName: dto.fullLegalName,
      panNumber: dto.panNumber,
      dateOfBirth: dob,
      addressLine1: dto.addressLine1,
      addressCity: dto.addressCity,
      addressState: dto.addressState,
      addressPostalCode: dto.addressPostalCode,
      documentType: dto.documentType,
      documentReference: dto.documentReference,
    });

    const pan = normalizePan(dto.panNumber);
    const data = {
      fullLegalName: dto.fullLegalName.trim(),
      panNumber: pan,
      dateOfBirth: dob,
      addressLine1: dto.addressLine1.trim(),
      addressCity: dto.addressCity.trim(),
      addressState: dto.addressState.trim(),
      addressPostalCode: dto.addressPostalCode.trim(),
      documentType: dto.documentType,
      documentReference: dto.documentReference.trim(),
      status: result.approved ? KycStatus.VERIFIED : KycStatus.REJECTED,
      verifiedAt: result.approved ? new Date() : null,
      rejectionReason: result.approved ? null : result.reason ?? 'Verification failed',
    };

    const profile = await this.prisma.kycProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    return {
      status: profile.status,
      verifiedAt: profile.verifiedAt,
      rejectionReason: profile.rejectionReason,
      panNumber: maskPan(profile.panNumber ?? pan),
    };
  }
}
