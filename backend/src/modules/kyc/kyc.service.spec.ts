import { BadRequestException } from '@nestjs/common';
import { KycService } from './kyc.service';
import { AutomatedKycVerifier } from './automated-kyc-verifier';

describe('KycService', () => {
  const prisma = {
    kycProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
  const verifier = new AutomatedKycVerifier();
  const service = new KycService(prisma as never, verifier);

  beforeEach(() => jest.clearAllMocks());

  it('returns NOT_STARTED when no profile', async () => {
    prisma.kycProfile.findUnique.mockResolvedValue(null);
    const status = await service.status('u1');
    expect(status.status).toBe('NOT_STARTED');
  });

  it('returns masked profile when present', async () => {
    prisma.kycProfile.findUnique.mockResolvedValue({
      status: 'VERIFIED',
      fullLegalName: 'Ada',
      panNumber: 'ABCDE1234F',
      dateOfBirth: new Date(),
      addressLine1: 'x',
      addressCity: 'y',
      addressState: 'z',
      addressPostalCode: '1',
      documentType: 'passport',
      verifiedAt: new Date(),
      rejectionReason: null,
    });
    const status = await service.status('u1');
    expect(status.panNumber).toContain('*');
  });

  it('submits and verifies profile', async () => {
    prisma.kycProfile.upsert.mockResolvedValue({
      status: 'VERIFIED',
      verifiedAt: new Date(),
      rejectionReason: null,
      panNumber: 'ABCDE1234F',
    });
    const result = await service.submit('u1', {
      fullLegalName: 'Ada Lovelace',
      panNumber: 'ABCDE1234F',
      dateOfBirth: '1990-06-15',
      addressLine1: '12 MG Road',
      addressCity: 'Bengaluru',
      addressState: 'KA',
      addressPostalCode: '560001',
      documentType: 'passport',
      documentReference: 'P1234567',
    });
    expect(result.status).toBe('VERIFIED');
    expect(result.panNumber).toContain('*');
  });

  it('rejects invalid date of birth', async () => {
    await expect(
      service.submit('u1', {
        fullLegalName: 'Ada Lovelace',
        panNumber: 'ABCDE1234F',
        dateOfBirth: 'not-a-date',
        addressLine1: '12 MG Road',
        addressCity: 'Bengaluru',
        addressState: 'KA',
        addressPostalCode: '560001',
        documentType: 'passport',
        documentReference: 'P1234567',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records rejection from verifier', async () => {
    prisma.kycProfile.upsert.mockResolvedValue({
      status: 'REJECTED',
      verifiedAt: null,
      rejectionReason: 'Invalid PAN',
      panNumber: 'BAD',
    });
    const result = await service.submit('u1', {
      fullLegalName: 'Ada Lovelace',
      panNumber: 'INVALID',
      dateOfBirth: '1990-06-15',
      addressLine1: '12 MG Road',
      addressCity: 'Bengaluru',
      addressState: 'KA',
      addressPostalCode: '560001',
      documentType: 'passport',
      documentReference: 'P1234567',
    });
    expect(result.status).toBe('REJECTED');
  });
});
