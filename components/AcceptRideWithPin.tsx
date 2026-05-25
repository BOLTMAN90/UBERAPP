import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface AcceptRideWithPinProps {
  /** Called with the trimmed PIN. Should return true if accepted, false if PIN is wrong. */
  onAccept: (pin: string) => Promise<boolean>;
  onDecline: () => void;
  /** Disable inputs while parent is busy. */
  disabled?: boolean;
  /** PIN attached to the booking (shown to the driver so they can confirm acceptance). */
  expectedPin?: string | null;
}

const PIN_LENGTH = 4;

/**
 * Driver-side accept-with-PIN block.
 * The driver collects the PIN from the rider verbally and types it here.
 * If the PIN doesn't match, the ride is NOT accepted.
 */
export function AcceptRideWithPin({
  onAccept,
  onDecline,
  disabled,
  expectedPin,
}: AcceptRideWithPinProps) {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setError(null);
    if (pin.trim().length !== PIN_LENGTH) {
      setError(`Enter the ${PIN_LENGTH}-digit PIN from the rider.`);
      return;
    }
    setLoading(true);
    try {
      const ok = await onAccept(pin.trim());
      if (!ok) {
        setError("PIN doesn't match. Ask the rider for the correct code.");
        return;
      }
      setPin('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not accept ride.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(digits);
    if (error) setError(null);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.white, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={[styles.lockIcon, { backgroundColor: colors.primary }]}>
          <FontAwesome name="lock" size={14} color={Colors.black} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Confirm with rider PIN</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Type the {PIN_LENGTH}-digit PIN sent with this booking to accept the ride.
          </Text>
        </View>
      </View>

      {expectedPin ? (
        <View style={[styles.pinDisplay, { borderColor: colors.primary }]}>
          <Text style={[styles.pinDisplayLabel, { color: colors.primaryDark }]}>
            BOOKING PIN
          </Text>
          <Text style={[styles.pinDisplayValue, { color: colors.text }]}>{expectedPin}</Text>
          <Text style={[styles.pinDisplayHint, { color: colors.textSecondary }]}>
            Type this PIN below to accept the booking
          </Text>
        </View>
      ) : null}

      <TextInput
        value={pin}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={PIN_LENGTH}
        editable={!disabled && !loading}
        placeholder="••••"
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: error ? colors.error : pin.length === PIN_LENGTH ? colors.primary : colors.border,
            backgroundColor: colors.secondary,
          },
        ]}
        accessibilityLabel="Rider PIN input"
      />

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
          <FontAwesome name="exclamation-circle" size={12} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Button
          label="Verify & accept"
          onPress={handleAccept}
          loading={loading}
          disabled={pin.length !== PIN_LENGTH || disabled}
        />
        <Button label="Decline" variant="outline" onPress={onDecline} disabled={loading || disabled} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  lockIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  input: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  pinDisplay: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 2,
  },
  pinDisplayLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  pinDisplayValue: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 10,
  },
  pinDisplayHint: {
    fontSize: 11,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
