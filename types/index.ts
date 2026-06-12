/** Shared TypeScript models for Firestore documents and UI state. */

export type UserRole = 'rider' | 'driver' | 'admin';

export type RideStatus =
  | 'requested'
  | 'searching'
  | 'negotiating'
  | 'accepted'
  | 'arriving'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export type RideCategory =
  | 'economy'
  | 'comfort'
  | 'xl'
  | 'premium'
  | 'vip'
  | 'bike'
  | 'female'
  | 'electric';

export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'transfer' | 'mobile_money';

export type CurrencyCode = 'USD' | 'NGN' | 'EUR' | 'GBP' | 'KES' | 'GHS' | 'ZAR';

export type WalletBalances = Record<CurrencyCode, number>;

export type KycStatus = 'pending' | 'approved' | 'rejected';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface RideLocation {
  address: string;
  coordinates: GeoPoint;
}

export interface FavoriteLocation {
  id: string;
  label: string;
  address: string;
  coordinates: GeoPoint;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  photoURL?: string;
  /** Used when Firebase Storage is not enabled; data:image/jpeg;base64,... */
  avatarDataUrl?: string;
  createdAt: number;
  walletBalance?: number;
  walletBalances?: WalletBalances;
  preferredCurrency?: CurrencyCode;
  favoriteLocations?: FavoriteLocation[];
  emergencyContacts?: string[];
  referralCode?: string;
  loyaltyPoints?: number;
  kycStatus?: KycStatus;
}

export interface DriverProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  avatarDataUrl?: string;
  isOnline: boolean;
  autoAcceptRides?: boolean;
  rating?: number;
  ratingCount?: number;
  currentLocation?: GeoPoint;
  totalTrips: number;
  totalEarnings: number;
  vehicleInfo?: string;
  rideCategories?: RideCategory[];
  subscriptionActive?: boolean;
  subscriptionExpiresAt?: number;
  fuelCostTotal?: number;
  kycStatus?: KycStatus;
  updatedAt: number;
}

export interface Ride {
  id: string;
  userId: string;
  driverId?: string;
  pickup: RideLocation;
  destination: RideLocation;
  stops?: RideLocation[];
  status: RideStatus;
  category: RideCategory;
  paymentMethod: PaymentMethod;
  estimatedFare: number;
  currency?: CurrencyCode;
  offeredFare?: number;
  counterFare?: number;
  surgeMultiplier?: number;
  distanceKm: number;
  pinCode?: string;
  pinVerified?: boolean;
  scheduledAt?: number;
  isNegotiable?: boolean;
  driverEtaMinutes?: number;
  riderRating?: number;
  driverRating?: number;
  promoCode?: string;
  sosTriggered?: boolean;
  /** Driver UIDs who declined this ride (used to show declined trips in the driver UI). */
  declinedBy?: string[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface DriverLocation {
  driverId: string;
  coordinates: GeoPoint;
  updatedAt: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'topup' | 'ride_payment' | 'ride_earning' | 'refund' | 'referral';
  amount: number;
  currency: CurrencyCode;
  method?: PaymentMethod;
  rideId?: string;
  createdAt: number;
}

export interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
}

export interface PlatformSettings {
  commissionPercent: number;
  surgeMultiplier: number;
  autoSurgeEnabled: boolean;
  driverSubscriptionWeekly: number;
}

export interface AdminStats {
  totalRides: number;
  activeRides: number;
  totalRevenue: number;
  onlineDrivers: number;
  totalRiders: number;
}
