import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { rateRide, updateDriverRating } from '@/services/ratings';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

export default function RateRideScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const { colors } = useTheme();
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!rideId) return;
    setLoading(true);
    await rateRide(rideId, 'rider', rating);
    const snap = await getDoc(doc(db, 'rides', rideId));
    const driverId = snap.data()?.driverId;
    if (driverId) await updateDriverRating(driverId, rating);
    setLoading(false);
    router.back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.secondary }]}>
      <Text style={[styles.title, { color: colors.text }]}>Rate your driver</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            label={`${n}★`}
            variant={rating === n ? 'primary' : 'outline'}
            onPress={() => setRating(n)}
          />
        ))}
      </View>
      <Button label="Submit rating" onPress={submit} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: Spacing.lg, gap: Spacing.lg },
  title: { fontSize: 22, fontWeight: '800' },
  stars: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
