import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { RideDetailView } from '@/components/RideDetailView';
import { useTheme } from '@/context/ThemeContext';
import { getRideById } from '@/services/rides';
import type { Ride } from '@/types';

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    void getRideById(id).then((r) => {
      setRide(r);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
        <Text style={{ color: colors.textSecondary }}>Trip not found.</Text>
      </View>
    );
  }

  return <RideDetailView ride={ride} />;
}
