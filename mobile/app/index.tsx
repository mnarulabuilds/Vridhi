import { Redirect } from 'expo-router';

import { useAuth } from '@/src/providers/auth-provider';

export default function Index() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}