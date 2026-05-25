import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { InputField } from '@/components/InputField';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { setHomeWorkFavorites } from '@/services/favorites';

export default function FavoritesScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { location } = useCurrentLocation();
  const [homeLabel, setHomeLabel] = useState('Home');
  const [workLabel, setWorkLabel] = useState('Work');
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!user || !location) return;
    await setHomeWorkFavorites(
      user.uid,
      { address: homeLabel, coordinates: location },
      {
        address: workLabel,
        coordinates: { latitude: location.latitude + 0.03, longitude: location.longitude + 0.03 },
      },
    );
    setSaved(true);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.secondary }} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Favorite locations</Text>
      <InputField label="Home label" value={homeLabel} onChangeText={setHomeLabel} />
      <InputField label="Work label" value={workLabel} onChangeText={setWorkLabel} />
      <Text style={{ color: colors.textSecondary }}>Uses your current GPS for Home; Work is offset slightly for demo.</Text>
      <Button label="Save Home & Work" onPress={save} />
      {saved ? <Text style={{ color: colors.success }}>Saved! Use quick buttons on Ride tab.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.md },
  title: { fontSize: 22, fontWeight: '800' },
});
