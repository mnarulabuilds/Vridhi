import { AuthenticatedUser } from '@/src/types/auth';

export function appEntryHref(user: AuthenticatedUser | null | undefined) {
  if (user && !user.onboardingCompletedAt) {
    return '/(app)/onboarding' as const;
  }
  return '/(app)/(tabs)' as const;
}

export function needsOnboarding(user: AuthenticatedUser | null | undefined) {
  return !!user && !user.onboardingCompletedAt;
}
