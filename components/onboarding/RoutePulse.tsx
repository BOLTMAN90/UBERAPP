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

const ROUTE_WIDTH = 220;

export function RoutePulse() {
  const dash = useSharedValue(0);
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);
  const carX = useSharedValue(-30);

  useEffect(() => {
    dash.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
    pulse1.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    pulse2.value = withDelay(
      900,
      withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      ),
    );
    carX.value = withRepeat(
      withTiming(ROUTE_WIDTH - 30, { duration: 4200, easing: Easing.inOut(Easing.cubic) }),
      -1,
      false,
    );
  }, [carX, dash, pulse1, pulse2]);

  const trailStyle = useAnimatedStyle(() => ({
    width: ROUTE_WIDTH * dash.value,
  }));

  const carStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: carX.value }],
  }));

  const ripple1Style = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - pulse1.value),
    transform: [{ scale: 1 + pulse1.value * 2.4 }],
  }));

  const ripple2Style = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - pulse2.value),
    transform: [{ scale: 1 + pulse2.value * 2.4 }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.ripple, ripple1Style]} />
      <Animated.View style={[styles.ripple, ripple2Style]} />

      <View style={styles.routeBase} />
      <Animated.View style={[styles.routeTrail, trailStyle]} />

      <View style={[styles.pin, styles.pinStart]}>
        <View style={styles.pinDot} />
      </View>
      <View style={[styles.pin, styles.pinEnd]}>
        <View style={[styles.pinDot, { backgroundColor: OnboardingTheme.brandInk }]} />
      </View>

      <Animated.View style={[styles.car, carStyle]}>
        <View style={styles.carBody} />
        <View style={styles.carWindow} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: ROUTE_WIDTH + 40,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: OnboardingTheme.accent,
    backgroundColor: OnboardingTheme.glow,
  },
  routeBase: {
    width: ROUTE_WIDTH,
    height: 4,
    borderRadius: 2,
    backgroundColor: OnboardingTheme.routeBase,
    position: 'absolute',
    top: 90,
    left: 20,
  },
  routeTrail: {
    height: 4,
    borderRadius: 2,
    backgroundColor: OnboardingTheme.accent,
    position: 'absolute',
    top: 90,
    left: 20,
    shadowColor: OnboardingTheme.accent,
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  pin: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OnboardingTheme.accentSoft,
    borderWidth: 1,
    borderColor: OnboardingTheme.accent,
    top: 80,
  },
  pinStart: { left: 8 },
  pinEnd: { right: 8 },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: OnboardingTheme.accentDeep,
  },
  car: {
    position: 'absolute',
    top: 70,
    left: 24,
    width: 36,
    height: 18,
  },
  carBody: {
    width: 36,
    height: 14,
    borderRadius: 6,
    backgroundColor: OnboardingTheme.brandInk,
    shadowColor: OnboardingTheme.accent,
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  carWindow: {
    position: 'absolute',
    top: 2,
    left: 10,
    width: 16,
    height: 6,
    borderRadius: 2,
    backgroundColor: OnboardingTheme.accent,
    opacity: 0.95,
  },
});
