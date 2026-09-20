import { Redirect, Stack, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/src/providers/auth-provider';
import { useBiometrics } from '@/src/providers/biometric-provider';
import { COLORS } from '@/src/theme';

export default function AppLayout() {
  const { isAuthenticated, loading, user } = useAuth();
  const { biometrics, isUnlocked, loading: bioLoading } = useBiometrics();
  const segments = useSegments();
  const onOnboarding = segments.includes('onboarding');

  if (loading || bioLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (biometrics && !isUnlocked) {
    return <Redirect href="/(auth)/unlock" />;
  }

  if (user && !user.onboardingCompletedAt && !onOnboarding) {
    return <Redirect href="/(app)/onboarding" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="portfolio" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="accounts/index" />
      <Stack.Screen name="accounts/create" options={{ title: 'Create Account' }} />
      <Stack.Screen name="transactions/quick" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
