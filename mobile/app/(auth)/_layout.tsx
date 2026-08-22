import { Redirect, Stack, usePathname } from 'expo-router';
import { useAuth } from '@/src/providers/auth-provider';
import { useBiometrics } from '@/src/providers/biometric-provider';

export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuth();
  const { biometrics, isUnlocked } = useBiometrics();
  const pathname = usePathname();

  if (!loading && isAuthenticated && !(biometrics && !isUnlocked)) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  if (!loading && isAuthenticated && biometrics && !isUnlocked && !pathname.includes('unlock')) {
    return <Redirect href="/(auth)/unlock" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
