import { api } from './client';

export type KycStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED';

export interface KycStatusResponse {
  status: KycStatus;
  fullLegalName: string | null;
  panNumber: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
}

export interface SubmitKycPayload {
  fullLegalName: string;
  panNumber: string;
  dateOfBirth: string;
  addressLine1: string;
  addressCity: string;
  addressState: string;
  addressPostalCode: string;
  documentType: 'aadhaar' | 'passport' | 'driving_license';
  documentReference: string;
}

export const KycApi = {
  status: async () => (await api.get<KycStatusResponse>('/kyc/status')).data,
  submit: async (payload: SubmitKycPayload) =>
    (await api.post<{ status: KycStatus; rejectionReason?: string | null }>('/kyc/submit', payload)).data,
};
