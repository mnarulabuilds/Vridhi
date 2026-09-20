import { appEntryHref, needsOnboarding } from './app-entry';

describe('app-entry', () => {
  it('routes first-time users to onboarding', () => {
    expect(
      appEntryHref({
        id: '1',
        name: 'A',
        email: 'a@b.com',
        onboardingCompletedAt: null,
      }),
    ).toBe('/(app)/onboarding');
    expect(needsOnboarding({ id: '1', name: 'A', email: 'a@b.com' })).toBe(true);
  });

  it('routes returning users to the dashboard', () => {
    expect(
      appEntryHref({
        id: '1',
        name: 'A',
        email: 'a@b.com',
        onboardingCompletedAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toBe('/(app)/(tabs)');
    expect(
      needsOnboarding({
        id: '1',
        name: 'A',
        email: 'a@b.com',
        onboardingCompletedAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toBe(false);
  });
});
