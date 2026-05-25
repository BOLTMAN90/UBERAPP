import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { InputField } from '@/components/InputField';
import { useTheme } from '@/context/ThemeContext';
import { Spacing } from '@/constants/theme';
import { verifyRidePin } from '@/services/rides';

interface PinVerificationProps {
  rideId: string;
  pinCode?: string;
  mode: 'driver' | 'rider';
  onVerified: () => void;
}

export function PinVerification({ rideId, pinCode, mode, onVerified }: PinVerificationProps) {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (mode === 'rider' && pinCode) {
    return (
      <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Your ride PIN</Text>
        <Text style={[styles.pin, { color: colors.primary }]}>{pinCode}</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Share this PIN with the driver. They must enter it to accept your ride.
        </Text>
      </View>
    );
  }

  const handleVerify = async () => {
    setError(null);
    setLoading(true);
    const ok = await verifyRidePin(rideId, pin.trim());
    setLoading(false);
    if (!ok) {
      setError('Incorrect PIN. Ask the rider for the correct code.');
      return;
    }
    onVerified();
  };

  return (
    <View style={styles.box}>
      <Text style={[styles.title, { color: colors.text }]}>Enter rider PIN</Text>
      <InputField
        label="4-digit PIN"
        keyboardType="number-pad"
        maxLength={4}
        value={pin}
        onChangeText={setPin}
      />
      {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
      <Button label="Verify & start trip" onPress={handleVerify} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
  },
  pin: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
  },
});
