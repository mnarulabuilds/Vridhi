import { Injectable } from '@nestjs/common';
import { isValidPan, normalizePan } from './pan.validator';

export interface KycSubmissionInput {
  fullLegalName: string;
  panNumber: string;
  dateOfBirth: Date;
  addressLine1: string;
  addressCity: string;
  addressState: string;
  addressPostalCode: string;
  documentType: 'aadhaar' | 'passport' | 'driving_license';
  documentReference: string;
}

export interface AutomatedKycResult {
  approved: boolean;
  reason?: string;
}

/**
 * Fully automated checks — no human reviewer. Production would plug in OCR / vendor APIs here.
 */
@Injectable()
export class AutomatedKycVerifier {
  verify(input: KycSubmissionInput): AutomatedKycResult {
    const name = input.fullLegalName.trim();
    if (name.length < 3) {
      return { approved: false, reason: 'Enter your full legal name as on your ID.' };
    }

    if (!isValidPan(input.panNumber)) {
      return { approved: false, reason: 'PAN must match format ABCDE1234F.' };
    }

    const ageMs = Date.now() - input.dateOfBirth.getTime();
    const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
    if (ageYears < 18) {
      return { approved: false, reason: 'You must be at least 18 to verify.' };
    }
    if (ageYears > 120) {
      return { approved: false, reason: 'Check your date of birth.' };
    }

    if (!input.addressLine1.trim() || !input.addressCity.trim() || !input.addressPostalCode.trim()) {
      return { approved: false, reason: 'Complete your address.' };
    }

    const docRef = input.documentReference.replace(/\s/g, '');
    if (docRef.length < 4) {
      return { approved: false, reason: 'Document reference is too short.' };
    }

    // Simulated document checksum: last digit of doc ref must match last digit of PAN year slot.
    const pan = normalizePan(input.panNumber);
    const panDigit = pan.charAt(5);
    const docLast = docRef.replace(/\D/g, '').slice(-1) || docRef.slice(-1);
    if (docLast !== panDigit && input.documentType === 'aadhaar') {
      return {
        approved: false,
        reason: 'Document details could not be matched to your PAN (automated check).',
      };
    }

    return { approved: true };
  }
}
