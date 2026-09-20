export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  preferredCurrency?: string;
  timezone?: string;
  locale?: string;
  onboardingCompletedAt?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}
