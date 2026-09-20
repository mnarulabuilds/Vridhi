import { Redirect, Stack, usePathname } from 'expo-router';
import { useAuth } from '@/src/providers/auth-provider';
import { useBiometrics } from '@/src/providers/biometric-provider';
import { appEntryHref } from '@/src/navigation/app-entry';

export default function AuthLayout() {
  const { isAuthenticated, loading, user } = useAuth();
  const { biometrics, isUnlocked } = useBiometrics();
  const pathname = usePathname();

  if (!loading && isAuthenticated && !(biometrics && !isUnlocked)) {
    return <Redirect href={appEntryHref(user)} />;
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
