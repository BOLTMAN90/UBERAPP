import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/services/firebase';
import { safeOnSnapshotQuery } from '@/services/firestoreListen';
import type { AdminStats, AppUser, DriverProfile, KycStatus, PlatformSettings, Ride } from '@/types';

function mapRide(d: { id: string; data: () => Record<string, unknown> }): Ride {
  const data = d.data();
  return {
    id: d.id,
    userId: String(data.userId),
    driverId: data.driverId ? String(data.driverId) : undefined,
    pickup: data.pickup as Ride['pickup'],
    destination: data.destination as Ride['destination'],
    status: data.status as Ride['status'],
    category: (data.category as Ride['category']) ?? 'economy',
    paymentMethod: (data.paymentMethod as Ride['paymentMethod']) ?? 'cash',
    estimatedFare: Number(data.estimatedFare ?? 0),
    distanceKm: Number(data.distanceKm ?? 0),
    createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
    updatedAt: (data.updatedAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
    sosTriggered: Boolean(data.sosTriggered),
  };
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const snap = await getDoc(doc(db, 'settings', 'platform'));
  const data = snap.data();
  return {
    commissionPercent: Number(data?.commissionPercent ?? 15),
    surgeMultiplier: Number(data?.surgeMultiplier ?? 1),
    autoSurgeEnabled: Boolean(data?.autoSurgeEnabled ?? false),
    driverSubscriptionWeekly: Number(data?.driverSubscriptionWeekly ?? 2500),
  };
}

export async function updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<void> {
  await setDoc(doc(db, 'settings', 'platform'), settings, { merge: true });
}

export async function getAdminStats(): Promise<AdminStats> {
  const [ridesSnap, driversSnap, usersSnap] = await Promise.all([
    getDocs(collection(db, 'rides')),
    getDocs(query(collection(db, 'drivers'), where('isOnline', '==', true))),
    getDocs(query(collection(db, 'users'), where('role', '==', 'rider'))),
  ]);

  const rides = ridesSnap.docs.map((d) => d.data());
  const activeRides = rides.filter(
    (r) => !['completed', 'cancelled'].includes(String(r.status)),
  ).length;
  const completed = rides.filter((r) => r.status === 'completed');
  const totalRevenue = completed.reduce((sum, r) => sum + Number(r.estimatedFare ?? 0), 0);

  return {
    totalRides: rides.length,
    activeRides,
    totalRevenue,
    onlineDrivers: driversSnap.size,
    totalRiders: usersSnap.size,
  };
}

export async function getAllUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      email: data.email,
      displayName: data.displayName,
      phone: data.phone,
      role: data.role,
      kycStatus: data.kycStatus,
      walletBalance: data.walletBalance,
      createdAt: data.createdAt?.toMillis?.() ?? 0,
    };
  });
}

export async function getAllDrivers(): Promise<DriverProfile[]> {
  const snap = await getDocs(collection(db, 'drivers'));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      displayName: data.displayName,
      isOnline: data.isOnline,
      rating: data.rating,
      totalTrips: data.totalTrips ?? 0,
      totalEarnings: data.totalEarnings ?? 0,
      kycStatus: data.kycStatus,
      updatedAt: data.updatedAt?.toMillis?.() ?? 0,
    };
  });
}

export async function updateUserKyc(uid: string, status: KycStatus): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { kycStatus: status });
  const driverSnap = await getDoc(doc(db, 'drivers', uid));
  if (driverSnap.exists()) {
    await updateDoc(doc(db, 'drivers', uid), { kycStatus: status });
  }
}

export function subscribeToActiveRides(callback: (rides: Ride[]) => void) {
  return safeOnSnapshotQuery(collection(db, 'rides'), (snap) => {
    callback(
      snap.docs
        .map((d) => mapRide(d))
        .filter((r) => !['completed', 'cancelled'].includes(r.status)),
    );
  }, 'admin-active-rides');
}

export async function createPromoCode(
  code: string,
  discountPercent: number,
  maxUses: number,
): Promise<void> {
  await setDoc(doc(db, 'promoCodes', code.toUpperCase()), {
    code: code.toUpperCase(),
    discountPercent,
    maxUses,
    usedCount: 0,
    active: true,
    createdAt: serverTimestamp(),
  });
}
