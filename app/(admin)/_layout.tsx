import { Stack } from 'expo-router';

import { useTheme } from '@/context/ThemeContext';

export default function AdminLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.secondary },
        headerTitleStyle: { fontWeight: '700' },
      }}>
      <Stack.Screen name="index" options={{ title: 'BoltRide Admin' }} />
      <Stack.Screen name="users" options={{ title: 'Users & KYC' }} />
      <Stack.Screen name="rides" options={{ title: 'Live Rides' }} />
      <Stack.Screen name="settings" options={{ title: 'Platform Settings' }} />
    </Stack>
  );
}
