import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedCityLights } from '@/components/onboarding/AnimatedCityLights';
import { FeatureCard } from '@/components/onboarding/FeatureCard';
import { FloatingCar } from '@/components/onboarding/FloatingCar';
import { PaginationDots } from '@/components/onboarding/PaginationDots';
import { RoutePulse } from '@/components/onboarding/RoutePulse';
import { OnboardingTheme } from '@/constants/onboardingTheme';
import { useAuth } from '@/context/AuthContext';
import { homeHrefForProfile } from '@/utils/navigation';
import { markOnboardingSeen } from '@/utils/onboardingStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlideContent {
  key: string;
}

const SLIDES: SlideContent[] = [
  { key: 'welcome' },
  { key: 'brand' },
  { key: 'cta' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SlideContainer({
  children,
  active,
}: {
  children: React.ReactNode;
  active: boolean;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    if (active) {
      opacity.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
      translateY.value = withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) });
    } else {
      opacity.value = withTiming(0, { duration: 220 });
      translateY.value = 24;
    }
  }, [active, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[slideStyles.container, style]}>{children}</Animated.View>;
}

function WelcomeSlide({ active }: { active: boolean }) {
  const logoScale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      logoOpacity.value = withTiming(1, { duration: 600 });
      logoScale.value = withSequence(
        withTiming(1.05, { duration: 600, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(1, { duration: 220 }),
      );
    } else {
      logoOpacity.value = 0;
      logoScale.value = 0.85;
    }
  }, [active, logoOpacity, logoScale]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <SlideContainer active={active}>
      <View style={slideStyles.heroArea}>
        <AnimatedCityLights />
        <Animated.View style={[slideStyles.logoWrap, logoStyle]}>
          <View style={slideStyles.logoGlow} />
          <Image
            source={require('@/assets/images/boltride-logo.png')}
            style={slideStyles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
        <View style={slideStyles.routeWrap}>
          <RoutePulse />
        </View>
      </View>

      <View style={slideStyles.copy}>
        <Text style={slideStyles.eyebrow}>BOLTRIDE</Text>
        <Text style={slideStyles.title}>Welcome to BOLTRIDE</Text>
        <Text style={slideStyles.subtitle}>Fast, safe, and reliable rides anytime.</Text>
      </View>
    </SlideContainer>
  );
}

function BrandSlide({ active }: { active: boolean }) {
  return (
    <SlideContainer active={active}>
      <View style={slideStyles.heroArea}>
        <AnimatedCityLights />
        <View style={slideStyles.routeCenter}>
          <RoutePulse />
        </View>
      </View>

      <View style={slideStyles.copy}>
        <Text style={slideStyles.eyebrow}>SMART MOBILITY</Text>
        <Text style={slideStyles.title}>Smarter Mobility for Modern Cities</Text>
        <Text style={slideStyles.subtitle}>
          Book rides instantly with live tracking, secure trips, and seamless payments.
        </Text>

        <View style={slideStyles.featureGrid}>
          <FeatureCard
            icon="map-marker"
            title="Real-time tracking"
            description="Follow your driver live on the map"
            delay={150}
            active={active}
          />
          <FeatureCard
            icon="shield"
            title="Secure rides"
            description="PIN verification + SOS protection"
            delay={250}
            active={active}
          />
          <FeatureCard
            icon="bolt"
            title="AI ride matching"
            description="Smartly paired with the best driver"
            delay={350}
            active={active}
          />
          <FeatureCard
            icon="rocket"
            title="Instant booking"
            description="Tap once and a driver is on the way"
            delay={450}
            active={active}
          />
        </View>
      </View>
    </SlideContainer>
  );
}

function CtaSlide({
  active,
  onSignUp,
  onSignIn,
}: {
  active: boolean;
  onSignUp: () => void;
  onSignIn: () => void;
}) {
  const primaryGlow = useSharedValue(0);
  const fadeIn = useSharedValue(0);

  useEffect(() => {
    if (active) {
      fadeIn.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
      primaryGlow.value = withRepeat(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      fadeIn.value = 0;
      primaryGlow.value = 0;
    }
  }, [active, fadeIn, primaryGlow]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + primaryGlow.value * 0.5,
    transform: [{ scale: 1 + primaryGlow.value * 0.06 }],
  }));

  return (
    <SlideContainer active={active}>
      <View style={slideStyles.heroArea}>
        <AnimatedCityLights />
        <FloatingCar />
      </View>

      <Animated.View style={[slideStyles.copy, fadeStyle]}>
        <Text style={slideStyles.eyebrow}>JOIN BOLTRIDE</Text>
        <Text style={slideStyles.title}>Ready to Ride?</Text>
        <Text style={slideStyles.subtitle}>
          Create your account and experience premium transportation.
        </Text>

        <View style={ctaStyles.buttonStack}>
          <View style={ctaStyles.primaryWrap}>
            <Animated.View style={[ctaStyles.primaryGlow, glowStyle]} />
            <AnimatedPressable
              accessibilityRole="button"
              onPress={onSignUp}
              style={ctaStyles.primaryButton}>
              <Text style={ctaStyles.primaryLabel}>Create Account</Text>
              <FontAwesome name="arrow-right" size={14} color={OnboardingTheme.brandInk} />
            </AnimatedPressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onSignIn}
            style={ctaStyles.secondaryButton}>
            <Text style={ctaStyles.secondaryLabel}>Sign In</Text>
          </Pressable>
        </View>

        <Text style={ctaStyles.fineprint}>
          By continuing you agree to our Terms and acknowledge our Privacy Policy.
        </Text>
      </Animated.View>
    </SlideContainer>
  );
}

export default function OnboardingScreen() {
  const { user, profile } = useAuth();
  const listRef = useRef<FlatList<SlideContent>>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (user) {
      router.replace(homeHrefForProfile(profile));
    }
  }, [user, profile]);

  const goToHomeIfSignedIn = () => {
    if (!user) return false;
    router.replace(homeHrefForProfile(profile));
    return true;
  };

  const handleSignUp = async () => {
    await markOnboardingSeen();
    if (goToHomeIfSignedIn()) return;
    router.replace('/(auth)/register');
  };

  const handleSignIn = async () => {
    await markOnboardingSeen();
    if (goToHomeIfSignedIn()) return;
    router.replace('/(auth)/login');
  };

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (next !== index) setIndex(next);
  };

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  };

  const handleSkip = async () => {
    await markOnboardingSeen();
    if (goToHomeIfSignedIn()) return;
    router.replace('/(auth)/login');
  };

  const renderItem = ({ item, index: i }: { item: SlideContent; index: number }) => {
    const active = i === index;
    if (item.key === 'welcome') return <WelcomeSlide active={active} />;
    if (item.key === 'brand') return <BrandSlide active={active} />;
    return <CtaSlide active={active} onSignUp={handleSignUp} onSignIn={handleSignIn} />;
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={screenStyles.root}>
      <StatusBar style="dark" />

      <SafeAreaView style={screenStyles.safe} edges={['top']}>
        <View style={screenStyles.headerRow}>
          <View style={screenStyles.brandPill}>
            <View style={screenStyles.brandDot} />
            <Text style={screenStyles.brandText}>BOLTRIDE</Text>
          </View>
          {!isLast ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleSkip}
              hitSlop={12}
              style={screenStyles.skipButton}>
              <Text style={screenStyles.skipLabel}>Skip</Text>
            </Pressable>
          ) : (
            <View style={screenStyles.skipPlaceholder} />
          )}
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          getItemLayout={(_, i) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * i,
            index: i,
          })}
          renderItem={renderItem}
          style={screenStyles.list}
        />

        <View style={screenStyles.footer}>
          <PaginationDots total={SLIDES.length} current={index} />

          {!isLast ? (
            <Pressable accessibilityRole="button" onPress={goNext} style={screenStyles.nextButton}>
              <Text style={screenStyles.nextLabel}>Next</Text>
              <FontAwesome
                name="long-arrow-right"
                size={16}
                color={OnboardingTheme.brandInk}
              />
            </Pressable>
          ) : (
            <View style={screenStyles.footerSpacer} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: OnboardingTheme.background,
  },
  safe: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: OnboardingTheme.hairline,
    backgroundColor: OnboardingTheme.surface,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: OnboardingTheme.accent,
    shadowColor: OnboardingTheme.accent,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  brandText: {
    color: OnboardingTheme.brandInk,
    fontWeight: '800',
    fontSize: 11.5,
    letterSpacing: 1.6,
  },
  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: OnboardingTheme.surface,
  },
  skipPlaceholder: {
    width: 56,
  },
  skipLabel: {
    color: OnboardingTheme.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  list: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    backgroundColor: OnboardingTheme.accent,
    borderRadius: 999,
    shadowColor: OnboardingTheme.accent,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  nextLabel: {
    color: OnboardingTheme.brandInk,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  footerSpacer: {
    width: 1,
    height: 1,
  },
});

const slideStyles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 24,
  },
  heroArea: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 28,
    marginTop: 18,
    backgroundColor: OnboardingTheme.backgroundElevated,
    borderWidth: 1,
    borderColor: OnboardingTheme.hairline,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    height: 150,
  },
  logoGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: OnboardingTheme.glow,
    opacity: 0.5,
  },
  logoImage: {
    width: 200,
    height: 120,
  },
  routeWrap: {
    position: 'absolute',
    bottom: 18,
    alignItems: 'center',
  },
  routeCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    paddingTop: 22,
    paddingBottom: 12,
    gap: 10,
  },
  eyebrow: {
    color: OnboardingTheme.accentDeep,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  title: {
    color: OnboardingTheme.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  subtitle: {
    color: OnboardingTheme.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  featureGrid: {
    marginTop: 16,
    gap: 10,
  },
});

const ctaStyles = StyleSheet.create({
  buttonStack: {
    marginTop: 20,
    gap: 12,
  },
  primaryWrap: {
    position: 'relative',
  },
  primaryGlow: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    left: -4,
    right: -4,
    borderRadius: 18,
    backgroundColor: OnboardingTheme.accent,
    opacity: 0.45,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: OnboardingTheme.accent,
  },
  primaryLabel: {
    color: OnboardingTheme.brandInk,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: OnboardingTheme.brandInk,
  },
  secondaryLabel: {
    color: OnboardingTheme.brandInk,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  fineprint: {
    marginTop: 14,
    color: OnboardingTheme.textFaint,
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 16,
  },
});
