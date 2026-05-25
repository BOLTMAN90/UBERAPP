import { Stack } from 'expo-router';

import { OnboardingTheme } from '@/constants/onboardingTheme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: OnboardingTheme.background },
        animation: 'fade',
      }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
