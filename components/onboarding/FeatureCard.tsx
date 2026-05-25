import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { OnboardingTheme } from '@/constants/onboardingTheme';

interface FeatureCardProps {
  icon: keyof typeof FontAwesome.glyphMap;
  title: string;
  description: string;
  delay: number;
  active: boolean;
}

export function FeatureCard({ icon, title, description, delay, active }: FeatureCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    if (active) {
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
      );
      translateY.value = withDelay(
        delay,
        withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }),
      );
    } else {
      opacity.value = 0;
      translateY.value = 18;
    }
  }, [active, delay, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.card, style]}>
      <View style={styles.iconWrap}>
        <FontAwesome name={icon} size={18} color={OnboardingTheme.accentDeep} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: OnboardingTheme.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: OnboardingTheme.hairline,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OnboardingTheme.accentSoft,
    borderWidth: 1,
    borderColor: OnboardingTheme.cardBorder,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: OnboardingTheme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    color: OnboardingTheme.textMuted,
    fontSize: 12.5,
    lineHeight: 17,
  },
});
