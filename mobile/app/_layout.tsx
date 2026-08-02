import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppQueryProvider } from '@/src/providers/query-provider';
import { AuthProvider, } from '@/src/providers/auth-provider';
import {
  BiometricProvider,
} from '@/src/providers/biometric-provider';


function RootNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={
        colorScheme === 'dark'
          ? DarkTheme
          : DefaultTheme
      }
    >
      <AppQueryProvider>
        <AuthProvider>
          <BiometricProvider>
            <RootNavigator />
          </BiometricProvider>
        </AuthProvider>

        <StatusBar style="auto" />
      </AppQueryProvider>
    </ThemeProvider>
  );
}