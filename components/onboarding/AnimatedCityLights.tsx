import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { OnboardingTheme } from '@/constants/onboardingTheme';

interface LightConfig {
  top: number;
  left: number;
  size: number;
  delay: number;
  hue: string;
  duration: number;
}

const LIGHTS: LightConfig[] = [
  { top: 28, left: 18, size: 6, delay: 0, hue: OnboardingTheme.accent, duration: 1800 },
  { top: 52, left: 70, size: 8, delay: 250, hue: OnboardingTheme.accentDeep, duration: 2200 },
  { top: 75, left: 32, size: 5, delay: 500, hue: OnboardingTheme.accent, duration: 2000 },
  { top: 18, left: 78, size: 5, delay: 750, hue: OnboardingTheme.accentDeep, duration: 2400 },
  { top: 88, left: 60, size: 6, delay: 1000, hue: OnboardingTheme.accent, duration: 1900 },
  { top: 40, left: 48, size: 4, delay: 600, hue: OnboardingTheme.accentDeep, duration: 1700 },
  { top: 62, left: 12, size: 7, delay: 350, hue: OnboardingTheme.accent, duration: 2300 },
];

function CityLight({ top, left, size, delay, hue, duration }: LightConfig) {
  const opacity = useSharedValue(0.15);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.85, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.4, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [delay, duration, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.light,
        {
          top: `${top}%`,
          left: `${left}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: hue,
          shadowColor: hue,
        },
        style,
      ]}
    />
  );
}

export function AnimatedCityLights() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {LIGHTS.map((light, idx) => (
        <CityLight key={idx} {...light} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  light: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 4,
  },
});
