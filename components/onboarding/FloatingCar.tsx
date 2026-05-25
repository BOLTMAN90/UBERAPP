import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { OnboardingTheme } from '@/constants/onboardingTheme';

export function FloatingCar() {
  const float = useSharedValue(0);
  const glow = useSharedValue(0);
  const tilt = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    glow.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    tilt.value = withRepeat(
      withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [float, glow, tilt]);

  const carStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -float.value * 14 },
      { rotateZ: `${(tilt.value - 0.5) * 4}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + glow.value * 0.4,
    transform: [{ scale: 0.95 + glow.value * 0.12 }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.4 - float.value * 0.25,
    transform: [{ scaleX: 1 - float.value * 0.18 }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={[styles.car, carStyle]}>
        <FontAwesome name="taxi" size={64} color={OnboardingTheme.brandInk} />
      </Animated.View>
      <Animated.View style={[styles.shadow, shadowStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: OnboardingTheme.glow,
    shadowColor: OnboardingTheme.accent,
    shadowOpacity: 0.7,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  car: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OnboardingTheme.accent,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: OnboardingTheme.accentDeep,
  },
  shadow: {
    position: 'absolute',
    bottom: 14,
    width: 90,
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
});
