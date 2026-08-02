import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" />
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="accounts/create"
        options={{
          title: 'Create Account',
        }}
      />
    </Stack>
  );
}