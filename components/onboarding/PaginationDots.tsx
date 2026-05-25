import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { OnboardingTheme } from '@/constants/onboardingTheme';

interface PaginationDotsProps {
  total: number;
  current: number;
}

interface DotProps {
  active: boolean;
}

function Dot({ active }: DotProps) {
  const width = useSharedValue(active ? 26 : 8);
  const opacity = useSharedValue(active ? 1 : 0.45);

  useEffect(() => {
    width.value = withTiming(active ? 26 : 8, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(active ? 1 : 0.45, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
  }, [active, opacity, width]);

  const style = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
    backgroundColor: active ? OnboardingTheme.accent : OnboardingTheme.textFaint,
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function PaginationDots({ total, current }: PaginationDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <Dot key={i} active={i === current} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
