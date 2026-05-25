import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Alert, Linking, Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Spacing } from '@/constants/theme';
import { triggerSos } from '@/services/rides';

interface SOSButtonProps {
  rideId?: string;
  emergencyContacts?: string[];
}

export function SOSButton({ rideId, emergencyContacts = [] }: SOSButtonProps) {
  const { colors } = useTheme();

  const handleSos = () => {
    Alert.alert(
      'Emergency SOS',
      'Share your live trip with emergency contacts and alert support?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            if (rideId) {
              await triggerSos(rideId);
            }
            const message = encodeURIComponent(
              'SOS: I need help on my BoltRide trip. Please check on me.',
            );
            for (const phone of emergencyContacts.slice(0, 3)) {
              void Linking.openURL(`sms:${phone}?body=${message}`);
            }
            Alert.alert('SOS sent', 'Emergency contacts notified. Stay safe.');
          },
        },
      ],
    );
  };

  return (
    <Pressable
      onPress={handleSos}
      style={[styles.button, { backgroundColor: colors.error }]}>
      <FontAwesome name="exclamation-triangle" size={18} color={colors.white} />
      <Text style={[styles.label, { color: colors.white }]}>SOS</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  label: {
    fontWeight: '800',
    fontSize: 16,
  },
});
