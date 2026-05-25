import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/Button';
import { InputField } from '@/components/InputField';
import { hasValidFirebaseConfig } from '@/constants/config';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { signUp } from '@/services/auth';
import type { UserRole } from '@/types';
import { homeHrefForRole } from '@/utils/navigation';
import { markOnboardingSeen } from '@/utils/onboardingStorage';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { validateDisplayName, validateEmail, validatePassword } from '@/utils/validation';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('rider');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (!hasValidFirebaseConfig) {
      setError(
        'Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* to .env (no spaces or quotes), then restart npm run dev.',
      );
      return;
    }

    const nameError = validateDisplayName(displayName);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (nameError || emailError || passwordError) {
      setError(nameError ?? emailError ?? passwordError);
      return;
    }

    setLoading(true);

    try {
      const profile = await signUp(
        email.trim(),
        password,
        displayName.trim(),
        role,
        phone.trim() || undefined,
      );
      await markOnboardingSeen();
      router.replace(homeHrefForRole(profile.role));
    } catch (registerError) {
      setError(getFirebaseErrorMessage(registerError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppLogo width={240} style={styles.logo} />
        <Text style={styles.subtitle}>Create your BoltRide account as a rider or driver.</Text>

        <InputField label="Full name" value={displayName} onChangeText={setDisplayName} />
        <InputField
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <InputField
          label="Phone (optional)"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <InputField
          label="Password"
          secureTextEntry
          allowPasswordPreview
          textContentType="newPassword"
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
        />

        <View style={styles.roleRow}>
          {(['rider', 'driver'] as UserRole[]).map((option) => (
            <Pressable
              key={option}
              onPress={() => setRole(option)}
              style={[styles.roleChip, role === option && styles.roleChipActive]}>
              <Text style={[styles.roleText, role === option && styles.roleTextActive]}>
                {option === 'rider' ? 'Rider' : 'Driver'}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Create account" onPress={handleRegister} loading={loading} />

        <Text style={styles.footer}>
          Already registered?{' '}
          <Link href="/(auth)/login" style={styles.link}>
            Sign in
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
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleChip: {
    flex: 1,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  roleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleText: {
    fontWeight: '600',
    color: Colors.text,
  },
  roleTextActive: {
    color: Colors.black,
  },
  error: {
    color: Colors.error,
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
