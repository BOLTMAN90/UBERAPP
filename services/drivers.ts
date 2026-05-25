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
import { safeOnSnapshotDoc, safeOnSnapshotQuery } from '@/services/firestoreListen';
import type { DriverProfile, GeoPoint } from '@/types';

/** Create driver document if missing (fixes infinite load when role is driver but doc absent). */
export async function ensureDriverProfile(uid: string, displayName: string): Promise<DriverProfile> {
  const existing = await getDriverProfile(uid);
  if (existing) {
    return existing;
  }

  await setDoc(doc(db, 'drivers', uid), {
    uid,
    displayName,
    isOnline: false,
    autoAcceptRides: false,
    rating: 5,
    ratingCount: 0,
    totalTrips: 0,
    totalEarnings: 0,
    fuelCostTotal: 0,
    rideCategories: ['economy', 'comfort', 'xl'],
    subscriptionActive: false,
    kycStatus: 'pending',
    updatedAt: serverTimestamp(),
  });

  const created = await getDriverProfile(uid);
  if (!created) {
    throw new Error('Could not initialize driver profile.');
  }
  return created;
}

export async function getDriverProfile(uid: string): Promise<DriverProfile | null> {
  const snapshot = await getDoc(doc(db, 'drivers', uid));
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    uid,
    displayName: data.displayName,
    photoURL: data.photoURL,
    isOnline: data.isOnline ?? false,
    autoAcceptRides: data.autoAcceptRides ?? false,
    rating: data.rating ?? 5,
    ratingCount: data.ratingCount ?? 0,
    currentLocation: data.currentLocation,
    totalTrips: data.totalTrips ?? 0,
    totalEarnings: data.totalEarnings ?? 0,
    vehicleInfo: data.vehicleInfo,
    rideCategories: data.rideCategories,
    subscriptionActive: data.subscriptionActive,
    subscriptionExpiresAt: data.subscriptionExpiresAt?.toMillis?.(),
    fuelCostTotal: data.fuelCostTotal ?? 0,
    updatedAt: data.updatedAt?.toMillis?.() ?? Date.now(),
  };
}

export async function setDriverOnlineStatus(
  uid: string,
  isOnline: boolean,
  location?: GeoPoint,
): Promise<void> {
  await updateDoc(doc(db, 'drivers', uid), {
    isOnline,
    ...(location ? { currentLocation: location } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function updateDriverLocation(uid: string, location: GeoPoint): Promise<void> {
  await setDoc(
    doc(db, 'locations', uid),
    {
      driverId: uid,
      coordinates: location,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await updateDoc(doc(db, 'drivers', uid), {
    currentLocation: location,
    updatedAt: serverTimestamp(),
  });
}

export async function getOnlineDrivers(): Promise<DriverProfile[]> {
  const snapshot = await getDocs(query(collection(db, 'drivers'), where('isOnline', '==', true)));
  return snapshot.docs.map((driverDoc) => {
    const data = driverDoc.data();
    return {
      uid: driverDoc.id,
      displayName: data.displayName,
      isOnline: data.isOnline,
      autoAcceptRides: data.autoAcceptRides,
      rating: data.rating ?? 5,
      ratingCount: data.ratingCount ?? 0,
      currentLocation: data.currentLocation,
      totalTrips: data.totalTrips ?? 0,
      totalEarnings: data.totalEarnings ?? 0,
      vehicleInfo: data.vehicleInfo,
      rideCategories: data.rideCategories,
      updatedAt: data.updatedAt?.toMillis?.() ?? Date.now(),
    };
  });
}

export function subscribeToDriverLocation(
  driverId: string,
  callback: (location: GeoPoint | null) => void,
) {
  return safeOnSnapshotDoc(doc(db, 'locations', driverId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback(snapshot.data().coordinates as GeoPoint);
  }, `location:${driverId}`);
}

export function subscribeToRideRequests(
  driverId: string,
  callback: (rides: Array<{ id: string; [key: string]: unknown }>) => void,
) {
  const ridesQuery = query(
    collection(db, 'rides'),
    where('driverId', '==', driverId),
    where('status', '==', 'requested'),
  );

  return safeOnSnapshotQuery(ridesQuery, (snapshot) => {
    callback(
      snapshot.docs.map((rideDoc) => ({
        id: rideDoc.id,
        ...rideDoc.data(),
      })),
    );
  }, `ride-requests:${driverId}`);
}

export async function incrementDriverEarnings(uid: string, amount: number): Promise<void> {
  const snapshot = await getDoc(doc(db, 'drivers', uid));
  const current = snapshot.data();

  await updateDoc(doc(db, 'drivers', uid), {
    totalTrips: (current?.totalTrips ?? 0) + 1,
    totalEarnings: (current?.totalEarnings ?? 0) + amount,
    updatedAt: serverTimestamp(),
  });
}

export async function setDriverAutoAccept(uid: string, enabled: boolean): Promise<void> {
  await updateDoc(doc(db, 'drivers', uid), { autoAcceptRides: enabled, updatedAt: serverTimestamp() });
}

export async function logFuelCost(uid: string, amount: number): Promise<void> {
  const snap = await getDoc(doc(db, 'drivers', uid));
  const current = Number(snap.data()?.fuelCostTotal ?? 0);
  await updateDoc(doc(db, 'drivers', uid), {
    fuelCostTotal: current + amount,
    updatedAt: serverTimestamp(),
  });
}

export async function activateDriverSubscription(uid: string, weeklyFee: number): Promise<void> {
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
  await updateDoc(doc(db, 'drivers', uid), {
    subscriptionActive: true,
    subscriptionExpiresAt: expires,
    updatedAt: serverTimestamp(),
  });
}
