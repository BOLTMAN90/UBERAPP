import type { PaymentMethod, RideCategory } from '@/types';

export interface RideCategoryMeta {
  id: RideCategory;
  label: string;
  icon: string;
  multiplier: number;
  description: string;
  capacity: number;
  /** Display badge for tier (Premium / VIP, etc.). */
  badge?: string;
  /** Extra ETA bias in minutes — premium tiers may take a bit longer to dispatch. */
  etaBiasMinutes?: number;
}

export const RIDE_CATEGORIES: RideCategoryMeta[] = [
  {
    id: 'economy',
    label: 'Economy',
    icon: 'car',
    multiplier: 1,
    description: 'Affordable everyday rides',
    capacity: 3,
  },
  {
    id: 'comfort',
    label: 'Comfort',
    icon: 'star',
    multiplier: 1.25,
    description: 'Newer cars, extra legroom',
    capacity: 4,
  },
  {
    id: 'xl',
    label: 'XL',
    icon: 'users',
    multiplier: 1.4,
    description: 'Groups up to 6',
    capacity: 6,
  },
  {
    id: 'premium',
    label: 'Premium',
    icon: 'diamond',
    multiplier: 1.65,
    description: 'High-end cars, top-rated drivers',
    capacity: 4,
    badge: 'PREMIUM',
    etaBiasMinutes: 1,
  },
  {
    id: 'vip',
    label: 'VIP',
    icon: 'trophy',
    multiplier: 2.1,
    description: 'Luxury chauffeur-style service',
    capacity: 4,
    badge: 'VIP',
    etaBiasMinutes: 2,
  },
  {
    id: 'bike',
    label: 'Bike',
    icon: 'bicycle',
    multiplier: 0.7,
    description: 'Fastest in traffic',
    capacity: 1,
  },
  {
    id: 'female',
    label: 'Women+',
    icon: 'female',
    multiplier: 1.1,
    description: 'Female drivers & riders',
    capacity: 3,
  },
  {
    id: 'electric',
    label: 'Electric',
    icon: 'leaf',
    multiplier: 1.15,
    description: 'Eco-friendly EVs',
    capacity: 4,
  },
];

export const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  icon: string;
}[] = [
  { id: 'cash', label: 'Cash', icon: 'money' },
  { id: 'card', label: 'Card', icon: 'credit-card' },
  { id: 'wallet', label: 'Wallet', icon: 'google-wallet' },
  { id: 'transfer', label: 'Bank Transfer', icon: 'bank' },
  { id: 'mobile_money', label: 'Mobile Money', icon: 'mobile' },
];

export function getCategoryMeta(category: RideCategory): RideCategoryMeta {
  return RIDE_CATEGORIES.find((c) => c.id === category) ?? RIDE_CATEGORIES[0];
}

export function getCategoryMultiplier(category: RideCategory): number {
  return getCategoryMeta(category).multiplier;
}

export function getCategoryCapacity(category: RideCategory): number {
  return getCategoryMeta(category).capacity;
}

export function getCategoryEtaBias(category: RideCategory): number {
  return getCategoryMeta(category).etaBiasMinutes ?? 0;
}
