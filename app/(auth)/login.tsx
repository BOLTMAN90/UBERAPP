import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/Button';
import { InputField } from '@/components/InputField';
import { demoAccounts, hasValidFirebaseConfig, useFirebaseEmulators } from '@/constants/config';
import { Colors, Spacing } from '@/constants/theme';
import { getUserProfile, signIn } from '@/services/auth';
import { homeHrefForProfile } from '@/utils/navigation';
import { markOnboardingSeen } from '@/utils/onboardingStorage';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { validateEmail, validatePassword } from '@/utils/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fillDemoAccount = (role: 'rider' | 'driver') => {
    setEmail(demoAccounts[role].email);
    setPassword(demoAccounts[role].password);
  };

  const handleLogin = async () => {
    setError(null);

    if (!hasValidFirebaseConfig && !useFirebaseEmulators) {
      setError(
        'Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* to .env (no spaces or quotes), then restart npm run dev.',
      );
      return;
    }

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) {
      setError(emailError ?? passwordError);
      return;
    }

    setLoading(true);

    try {
      const user = await signIn(email.trim(), password);
      await markOnboardingSeen();
      const profile = await getUserProfile(user.uid);
      router.replace(homeHrefForProfile(profile));
    } catch (loginError) {
      setError(getFirebaseErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppLogo width={260} style={styles.logo} />
        <Text style={styles.subtitle}>Sign in to request rides or drive with BoltRide.</Text>

        <InputField
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <InputField
          label="Password"
          secureTextEntry
          allowPasswordPreview
          textContentType="password"
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {useFirebaseEmulators ? (
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Local demo accounts</Text>
            <Text style={styles.demoCopy}>
              Start the emulators with npm run dev, then sign in with the seeded rider or driver.
            </Text>
            <View style={styles.demoRow}>
              <Button label="Use rider demo" variant="secondary" onPress={() => fillDemoAccount('rider')} />
              <Button label="Use driver demo" variant="secondary" onPress={() => fillDemoAccount('driver')} />
            </View>
          </View>
        ) : null}

        <Button label="Sign in" onPress={handleLogin} loading={loading} />

        <Text style={styles.footer}>
          New here?{' '}
          <Link href="/(auth)/register" style={styles.link}>
            Create an account
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.authBackground,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  logo: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  error: {
    color: Colors.error,
  },
  demoBox: {
    gap: Spacing.sm,
  },
  demoTitle: {
    fontWeight: '700',
    color: Colors.text,
  },
  demoCopy: {
    color: Colors.textSecondary,
  },
  demoRow: {
    gap: Spacing.sm,
  },
  footer: {
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  link: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
});
