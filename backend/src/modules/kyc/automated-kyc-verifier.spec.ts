import { AutomatedKycVerifier } from './automated-kyc-verifier';

describe('AutomatedKycVerifier', () => {
  const verifier = new AutomatedKycVerifier();
  const base = {
    fullLegalName: 'Ada Lovelace',
    panNumber: 'ABCDE1234F',
    dateOfBirth: new Date('1990-06-15'),
    addressLine1: '12 MG Road',
    addressCity: 'Bengaluru',
    addressState: 'KA',
    addressPostalCode: '560001',
    documentType: 'passport' as const,
    documentReference: 'P1234567',
  };

  it('approves valid submission', () => {
    expect(verifier.verify(base).approved).toBe(true);
  });

  it('rejects invalid PAN', () => {
    expect(verifier.verify({ ...base, panNumber: 'BAD' }).approved).toBe(false);
  });

  it('rejects underage users', () => {
    expect(
      verifier.verify({ ...base, dateOfBirth: new Date() }).approved,
    ).toBe(false);
  });

  it('rejects incomplete address and short names', () => {
    expect(verifier.verify({ ...base, fullLegalName: 'Al' }).approved).toBe(false);
    expect(verifier.verify({ ...base, addressLine1: '' }).approved).toBe(false);
  });

  it('rejects aadhaar when document digit mismatches PAN', () => {
    const result = verifier.verify({
      ...base,
      documentType: 'aadhaar',
      documentReference: '999999999999',
    });
    expect(result.approved).toBe(false);
  });
});
