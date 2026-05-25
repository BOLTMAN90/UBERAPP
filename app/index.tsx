import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { homeHrefForProfile } from '@/utils/navigation';
import { hasSeenOnboarding } from '@/utils/onboardingStorage';

/** App entry: signed-in users go home; guests see onboarding once, then login. */
export default function Index() {
  const { user, profile, loading: authLoading } = useAuth();
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [seenOnboarding, setSeenOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void hasSeenOnboarding().then((seen) => {
      if (!cancelled) {
        setSeenOnboarding(seen);
        setOnboardingReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (authLoading || !onboardingReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (user) {
    return <Redirect href={homeHrefForProfile(profile)} />;
  }

  if (!seenOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
