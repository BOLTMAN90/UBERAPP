import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { getCategoryMeta } from '@/constants/rideOptions';
import { getVehicleProducts, type VehicleProduct } from '@/constants/vehicleProducts';
import { useTheme } from '@/context/ThemeContext';
import type { CurrencyCode, RideCategory } from '@/types';
import { estimateFare } from '@/utils/geo';
import { formatMoney } from '@/utils/currency';
import { estimateEtaMinutes } from '@/utils/ride';

interface VehicleProductsModalProps {
  visible: boolean;
  category: RideCategory;
  selectedProductId?: string | null;
  onClose: () => void;
  onSelect: (product: VehicleProduct) => void;
  onConfirm?: (product: VehicleProduct) => void;
  distanceKm?: number;
  currency?: CurrencyCode;
  surgeMultiplier?: number;
}

interface ProductRowProps {
  product: VehicleProduct;
  index: number;
  active: boolean;
  fare: number | null;
  etaMinutes: number | null;
  currency: CurrencyCode;
  onPress: () => void;
}

function ProductRow({
  product,
  index,
  active,
  fare,
  etaMinutes,
  currency,
  onPress,
}: ProductRowProps) {
  const { colors } = useTheme();
  const enter = useSharedValue(0);
  const press = useSharedValue(1);

  useEffect(() => {
    enter.value = withDelay(
      index * 60,
      withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }),
    );
  }, [enter, index]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: (1 - enter.value) * 16 },
      { scale: press.value },
    ],
  }));

  return (
    <Animated.View style={wrapStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={onPress}
        onPressIn={() => {
          press.value = withTiming(0.97, { duration: 110 });
        }}
        onPressOut={() => {
          press.value = withTiming(1, { duration: 160 });
        }}
        style={[
          rowStyles.row,
          {
            backgroundColor: colors.white,
            borderColor: active ? colors.primary : colors.border,
            borderWidth: active ? 2 : 1,
          },
        ]}>
        <View
          style={[
            rowStyles.iconWrap,
            { backgroundColor: active ? colors.primary : 'rgba(251, 192, 45, 0.12)' },
          ]}>
          <FontAwesome
            name={product.icon as 'car'}
            size={22}
            color={active ? Colors.black : colors.primary}
          />
        </View>

        <View style={rowStyles.body}>
          <View style={rowStyles.titleRow}>
            <Text style={[rowStyles.name, { color: colors.text }]} numberOfLines={1}>
              {product.name}
            </Text>
            {product.tag ? (
              <View style={[rowStyles.tag, { backgroundColor: colors.primary }]}>
                <Text style={rowStyles.tagText}>{product.tag}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[rowStyles.description, { color: colors.textSecondary }]} numberOfLines={1}>
            {product.description}
          </Text>
          <View style={rowStyles.metaRow}>
            {product.capacity ? (
              <View style={rowStyles.metaItem}>
                <FontAwesome name="user" size={11} color={colors.textSecondary} />
                <Text style={[rowStyles.metaText, { color: colors.textSecondary }]}>
                  {product.capacity}
                </Text>
              </View>
            ) : null}
            {etaMinutes != null ? (
              <View style={rowStyles.metaItem}>
                <FontAwesome name="clock-o" size={11} color={colors.textSecondary} />
                <Text style={[rowStyles.metaText, { color: colors.textSecondary }]}>
                  {etaMinutes} min
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={rowStyles.priceCol}>
          {fare != null ? (
            <Text style={[rowStyles.price, { color: colors.text }]} numberOfLines={1}>
              {formatMoney(fare, currency)}
            </Text>
          ) : (
            <Text style={[rowStyles.priceMuted, { color: colors.textSecondary }]}>—</Text>
          )}
          {active ? (
            <View style={[rowStyles.selectedBadge, { backgroundColor: colors.primary }]}>
              <FontAwesome name="check" size={10} color={Colors.black} />
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function VehicleProductsModal({
  visible,
  category,
  selectedProductId,
  onClose,
  onSelect,
  onConfirm,
  distanceKm,
  currency = 'USD',
  surgeMultiplier = 1,
}: VehicleProductsModalProps) {
  const { colors } = useTheme();
  const meta = getCategoryMeta(category);
  const products = getVehicleProducts(category);

  const sheetOffset = useSharedValue(40);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      sheetOffset.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
      overlayOpacity.value = withTiming(1, { duration: 240 });
    } else {
      sheetOffset.value = 40;
      overlayOpacity.value = 0;
    }
  }, [overlayOpacity, sheetOffset, visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetOffset.value }],
  }));

  const baseFare = distanceKm
    ? estimateFare(distanceKm, category, surgeMultiplier)
    : null;
  const baseEta = distanceKm ? estimateEtaMinutes(distanceKm) : null;

  const computedSelected = products.find((p) => p.id === selectedProductId) ?? products[0];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, borderColor: colors.border },
          sheetStyle,
        ]}>
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, { color: colors.primaryDark }]}>
                {meta.badge ?? meta.label.toUpperCase()}
              </Text>
              <Text style={[styles.title, { color: colors.text }]}>{meta.label} options</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {meta.description}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={12}
              style={[styles.closeBtn, { backgroundColor: colors.white, borderColor: colors.border }]}>
              <FontAwesome name="times" size={14} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}>
            {products.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>
                No vehicle products configured for this category yet.
              </Text>
            ) : (
              products.map((p, idx) => {
                const fare =
                  baseFare != null ? Math.round(baseFare * p.fareModifier * 100) / 100 : null;
                const eta = baseEta != null ? baseEta + (p.etaBiasMinutes ?? 0) : null;
                return (
                  <ProductRow
                    key={p.id}
                    product={p}
                    index={idx}
                    active={p.id === selectedProductId}
                    fare={fare}
                    etaMinutes={eta}
                    currency={currency}
                    onPress={() => onSelect(p)}
                  />
                );
              })
            )}
          </ScrollView>

          <View style={[styles.footer, { borderColor: colors.border }]}>
            <View style={styles.footerInfo}>
              <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Selected</Text>
              <Text style={[styles.footerSelected, { color: colors.text }]} numberOfLines={1}>
                {computedSelected ? computedSelected.name : meta.label}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (computedSelected && onConfirm) onConfirm(computedSelected);
                else onClose();
              }}
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.confirmText}>Confirm</Text>
              <FontAwesome name="arrow-right" size={14} color={Colors.black} />
            </Pressable>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: '15%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerInfo: {
    flex: 1,
    gap: 2,
  },
  footerLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  footerSelected: {
    fontSize: 15,
    fontWeight: '800',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.pill,
  },
  confirmText: {
    color: Colors.black,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
  },
  description: {
    fontSize: 12.5,
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
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.black,
    letterSpacing: 0.7,
  },
  priceCol: {
    alignItems: 'flex-end',
    gap: 6,
    minWidth: 72,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
  },
  priceMuted: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
