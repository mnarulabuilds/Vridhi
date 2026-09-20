import { Redirect } from 'expo-router';

import { useAuth } from '@/src/providers/auth-provider';
import { appEntryHref } from '@/src/navigation/app-entry';

export default function Index() {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href={appEntryHref(user)} />;
  }

  return <Redirect href="/(auth)/login" />;
}