import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { RIDE_CATEGORIES, type RideCategoryMeta } from '@/constants/rideOptions';
import { getVehicleProducts } from '@/constants/vehicleProducts';
import { useTheme } from '@/context/ThemeContext';
import type { CurrencyCode, RideCategory } from '@/types';
import { estimateFare } from '@/utils/geo';
import { formatMoney } from '@/utils/currency';
import { estimateEtaMinutes } from '@/utils/ride';

interface PremiumVehicleSelectorProps {
  value: RideCategory;
  onChange: (category: RideCategory) => void;
  distanceKm?: number;
  currency?: CurrencyCode;
  surgeMultiplier?: number;
  /** Limit which categories appear (defaults to all). */
  categories?: RideCategory[];
  /** Called when the rider wants to drill into a category to pick a specific vehicle. */
  onOpenCategory?: (category: RideCategory) => void;
}

interface VehicleCardProps {
  meta: RideCategoryMeta;
  active: boolean;
  index: number;
  fare: number | null;
  etaMinutes: number | null;
  currency: CurrencyCode;
  productCount: number;
  onPress: () => void;
  onOpen?: () => void;
}

const ANIMATED_ENTRY_DELAY = 40;

function VehicleCard({
  meta,
  active,
  index,
  fare,
  etaMinutes,
  currency,
  productCount,
  onPress,
  onOpen,
}: VehicleCardProps) {
  const { colors } = useTheme();

  const enter = useSharedValue(0);
  const press = useSharedValue(1);
  const select = useSharedValue(active ? 1 : 0);
  const glow = useSharedValue(0);

  useEffect(() => {
    enter.value = withDelay(
      index * ANIMATED_ENTRY_DELAY,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
  }, [enter, index]);

  useEffect(() => {
    select.value = withTiming(active ? 1 : 0, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
    if (active) {
      glow.value = withRepeat(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      glow.value = 0;
    }
  }, [active, glow, select]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: (1 - enter.value) * 18 },
      { scale: press.value },
    ],
  }));

  const cardStyle = useAnimatedStyle(() => {
    const borderColor =
      select.value > 0.5 ? colors.primary : colors.border;
    const backgroundColor =
      select.value > 0.5 ? colors.white : colors.white;
    return {
      borderColor,
      backgroundColor,
      borderWidth: 1 + select.value * 1.4,
      shadowOpacity: 0.05 + select.value * 0.12,
    };
  });

  const iconWrapStyle = useAnimatedStyle(() => {
    const bg =
      select.value > 0.5
        ? colors.primary
        : 'rgba(251, 192, 45, 0.12)';
    return { backgroundColor: bg };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: active ? 0.18 + glow.value * 0.18 : 0,
    transform: [{ scale: 1 + glow.value * 0.04 }],
  }));

  const handlePressIn = () => {
    press.value = withTiming(0.97, { duration: 110 });
  };
  const handlePressOut = () => {
    press.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) });
  };

  return (
    <Animated.View style={[styles.cardWrap, wrapStyle]}>
      <Animated.View style={[styles.cardGlow, glowStyle]} />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => {
          if (active && onOpen) {
            onOpen();
          } else {
            onPress();
          }
        }}
        onLongPress={onOpen}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Animated.View style={[styles.iconWrap, iconWrapStyle]}>
            <FontAwesome
              name={meta.icon as 'car'}
              size={22}
              color={active ? Colors.black : colors.primary}
            />
          </Animated.View>

          <View style={styles.cardBody}>
            <View style={styles.headerRow}>
              <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
                {meta.label}
              </Text>
              {meta.badge ? (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: colors.primary,
                    },
                  ]}>
                  <Text style={styles.badgeText}>{meta.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[styles.description, { color: colors.textSecondary }]}
              numberOfLines={1}>
              {meta.description}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <FontAwesome name="user" size={11} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {meta.capacity}
                </Text>
              </View>
              {etaMinutes != null ? (
                <View style={styles.metaItem}>
                  <FontAwesome name="clock-o" size={11} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {etaMinutes} min
                  </Text>
                </View>
              ) : null}
              {productCount > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`See ${meta.label} vehicles`}
                  onPress={onOpen}
                  hitSlop={6}
                  style={styles.optionsButton}>
                  <Text style={[styles.optionsText, { color: colors.primaryDark }]}>
                    See {productCount} {productCount === 1 ? 'option' : 'options'}
                  </Text>
                  <FontAwesome name="chevron-right" size={9} color={colors.primaryDark} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.fareCol}>
            {fare != null ? (
              <>
                <Text style={[styles.fareText, { color: colors.text }]} numberOfLines={1}>
                  {formatMoney(fare, currency)}
                </Text>
                {meta.multiplier > 1.01 ? (
                  <Text style={[styles.fareDelta, { color: colors.primaryDark }]}>
                    ×{meta.multiplier.toFixed(2)}
                  </Text>
                ) : meta.multiplier < 0.99 ? (
                  <Text style={[styles.fareDelta, { color: colors.success }]}>
                    save {Math.round((1 - meta.multiplier) * 100)}%
                  </Text>
                ) : (
                  <Text style={[styles.fareDelta, { color: colors.textSecondary }]}>
                    standard
                  </Text>
                )}
              </>
            ) : (
              <Text style={[styles.fareDelta, { color: colors.textSecondary }]}>
                Pick destination
              </Text>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function PremiumVehicleSelector({
  value,
  onChange,
  distanceKm,
  currency = 'USD',
  surgeMultiplier = 1,
  categories,
  onOpenCategory,
}: PremiumVehicleSelectorProps) {
  const { colors } = useTheme();
  const list = categories
    ? RIDE_CATEGORIES.filter((c) => categories.includes(c.id))
    : RIDE_CATEGORIES;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose your ride</Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          {distanceKm
            ? `${distanceKm.toFixed(1)} km · live fare`
            : 'Add destination to see fare'}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        bounces>
        {list.map((meta, idx) => {
          const fare = distanceKm
            ? estimateFare(distanceKm, meta.id, surgeMultiplier)
            : null;
          const baseEta = distanceKm ? estimateEtaMinutes(distanceKm) : null;
          const etaMinutes =
            baseEta != null ? baseEta + (meta.etaBiasMinutes ?? 0) : null;

          return (
            <VehicleCard
              key={meta.id}
              meta={meta}
              active={value === meta.id}
              index={idx}
              fare={fare}
              etaMinutes={etaMinutes}
              currency={currency}
              productCount={getVehicleProducts(meta.id).length}
              onPress={() => onChange(meta.id)}
              onOpen={
                onOpenCategory
                  ? () => {
                      onChange(meta.id);
                      onOpenCategory(meta.id);
                    }
                  : undefined
              }
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    gap: 2,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
  },
  list: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  cardWrap: {
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: -3,
    bottom: -3,
    left: -3,
    right: -3,
    borderRadius: Radius.lg + 3,
    backgroundColor: Colors.primary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    shadowColor: '#000',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  description: {
    fontSize: 12.5,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.black,
    letterSpacing: 0.7,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  optionsButton: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(251, 192, 45, 0.14)',
    borderRadius: 999,
  },
  optionsText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  fareCol: {
    alignItems: 'flex-end',
    gap: 2,
    minWidth: 72,
  },
  fareText: {
    fontSize: 15,
    fontWeight: '800',
  },
  fareDelta: {
    fontSize: 11,
    fontWeight: '700',
  },
});
