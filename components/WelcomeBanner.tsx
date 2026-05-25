import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface WelcomeBannerProps {
  name?: string | null;
  photoURL?: string | null;
  /** Optional top inset (e.g. status bar). Defaults to a comfortable value. */
  topInset?: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(name?: string | null): string {
  if (!name) return 'rider';
  const trimmed = name.trim();
  if (!trimmed || trimmed.toLowerCase() === 'user') return 'rider';
  return trimmed.split(/\s+/)[0];
}

/**
 * Floating premium welcome card that sits over the top of the map.
 * Shows "WELCOME TO BOLTRIDE" plus a personalized greeting.
 */
export function WelcomeBanner({ name, photoURL, topInset = Spacing.md }: WelcomeBannerProps) {
  const { colors } = useTheme();
  const enter = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    enter.value = withDelay(80, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    glow.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [enter, glow]);

  const bannerStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * -14 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.16 + glow.value * 0.22,
    transform: [{ scale: 1 + glow.value * 0.02 }],
  }));

  const firstName = getFirstName(name);

  return (
    <Animated.View style={[styles.wrap, { top: topInset }, bannerStyle]} pointerEvents="box-none">
      <Animated.View style={[styles.glow, glowStyle]} />
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatarImg} />
          ) : (
            <FontAwesome name="user" size={18} color={Colors.black} />
          )}
        </View>

        <View style={styles.body}>
          <Text style={[styles.eyebrow, { color: colors.primaryDark }]} numberOfLines={1}>
            WELCOME TO BOLTRIDE
          </Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {getGreeting()}, {firstName}
          </Text>
        </View>

        <View style={[styles.brandDot, { backgroundColor: colors.primary }]}>
          <FontAwesome name="bolt" size={14} color={Colors.black} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 5,
  },
  glow: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    left: -4,
    right: -4,
    borderRadius: Radius.lg + 4,
    backgroundColor: Colors.primary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
