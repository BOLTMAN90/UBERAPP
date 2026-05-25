import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { getOnlineDrivers } from '@/services/drivers';
import { auth, db } from '@/services/firebase';
import { safeOnSnapshotDoc, safeOnSnapshotQuery } from '@/services/firestoreListen';
import { payFromWallet } from '@/services/wallet';
import { findBestDriver, getRouteDistanceKm, estimateFare } from '@/utils/geo';
import { generateRidePin, estimateEtaMinutes } from '@/utils/ride';
import type {
  CurrencyCode,
  GeoPoint,
  PaymentMethod,
  Ride,
  RideCategory,
  RideLocation,
  RideStatus,
} from '@/types';

function readFirestoreTime(value: unknown): number | undefined {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return undefined;
}

function mapRideDoc(rideDoc: { id: string; data: () => Record<string, unknown> }): Ride {
  const data = rideDoc.data();
  return {
    id: rideDoc.id,
    userId: String(data.userId),
    driverId: data.driverId ? String(data.driverId) : undefined,
    pickup: data.pickup as Ride['pickup'],
    destination: data.destination as Ride['destination'],
    stops: data.stops as Ride['stops'],
    status: data.status as RideStatus,
    category: (data.category as RideCategory) ?? 'economy',
    paymentMethod: (data.paymentMethod as PaymentMethod) ?? 'cash',
    estimatedFare: Number(data.estimatedFare ?? 0),
    currency: (data.currency as CurrencyCode) ?? 'USD',
    offeredFare: data.offeredFare != null ? Number(data.offeredFare) : undefined,
    counterFare: data.counterFare != null ? Number(data.counterFare) : undefined,
    surgeMultiplier: data.surgeMultiplier != null ? Number(data.surgeMultiplier) : 1,
    distanceKm: Number(data.distanceKm ?? 0),
    pinCode: data.pinCode as string | undefined,
    pinVerified: Boolean(data.pinVerified),
    scheduledAt: readFirestoreTime(data.scheduledAt),
    isNegotiable: Boolean(data.isNegotiable),
    driverEtaMinutes: data.driverEtaMinutes != null ? Number(data.driverEtaMinutes) : undefined,
    riderRating: data.riderRating != null ? Number(data.riderRating) : undefined,
    driverRating: data.driverRating != null ? Number(data.driverRating) : undefined,
    promoCode: data.promoCode as string | undefined,
    sosTriggered: Boolean(data.sosTriggered),
    declinedBy: Array.isArray(data.declinedBy) ? (data.declinedBy as string[]) : undefined,
    createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? Date.now(),
    updatedAt: (data.updatedAt as { toMillis?: () => number })?.toMillis?.() ?? Date.now(),
    completedAt: (data.completedAt as { toMillis?: () => number })?.toMillis?.(),
  };
}

export interface CreateRideOptions {
  category?: RideCategory;
  paymentMethod?: PaymentMethod;
  currency?: CurrencyCode;
  stops?: RideLocation[];
  scheduledAt?: number;
  isNegotiable?: boolean;
  offeredFare?: number;
  surgeMultiplier?: number;
  promoCode?: string;
}

export async function createRideRequest(
  userId: string,
  pickup: RideLocation,
  destination: RideLocation,
  estimatedFare: number,
  distanceKm: number,
  options: CreateRideOptions = {},
): Promise<string> {
  const rideRef = await addDoc(collection(db, 'rides'), {
    userId,
    pickup,
    destination,
    stops: options.stops ?? [],
    status: options.isNegotiable ? 'negotiating' : 'searching',
    category: options.category ?? 'economy',
    paymentMethod: options.paymentMethod ?? 'cash',
    currency: options.currency ?? 'USD',
    estimatedFare,
    offeredFare: options.offeredFare ?? estimatedFare,
    distanceKm,
    scheduledAt: options.scheduledAt ?? null,
    isNegotiable: Boolean(options.isNegotiable),
    surgeMultiplier: options.surgeMultiplier ?? 1,
    promoCode: options.promoCode ?? null,
    pinCode: generateRidePin(),
    pinVerified: false,
    sosTriggered: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (!options.isNegotiable) {
    void matchDriverToRide(rideRef.id, pickup.coordinates, options.category ?? 'economy').catch(
      (error) => {
        if (__DEV__) {
          console.warn('[Rides] Driver matching failed:', error);
        }
      },
    );
  }

  return rideRef.id;
}

async function matchDriverToRide(
  rideId: string,
  pickupCoordinates: GeoPoint,
  category: RideCategory,
) {
  if (!auth.currentUser) {
    return;
  }
  const onlineDrivers = await getOnlineDrivers();
  const bestDriver = findBestDriver(onlineDrivers, pickupCoordinates, category);

  if (!bestDriver) {
    return;
  }

  const distanceKm = bestDriver.currentLocation
    ? getRouteDistanceKm([bestDriver.currentLocation, pickupCoordinates])
    : 2;

  await updateDoc(doc(db, 'rides', rideId), {
    driverId: bestDriver.uid,
    status: 'requested',
    driverEtaMinutes: estimateEtaMinutes(distanceKm),
    updatedAt: serverTimestamp(),
  });
}

export async function acceptRide(rideId: string, driverId: string): Promise<void> {
  await updateDoc(doc(db, 'rides', rideId), {
    driverId,
    status: 'accepted',
    pinVerified: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Driver-side acceptance gated by the rider's PIN.
 * Returns `true` if the PIN matches and the ride was accepted, otherwise `false`.
 * Pre-existing PINs are generated at booking time and shared with the rider.
 */
export async function acceptRideWithPin(
  rideId: string,
  driverId: string,
  pin: string,
): Promise<boolean> {
  const trimmed = pin.trim();
  if (!trimmed) return false;
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'rides', rideId));
  if (!snap.exists()) return false;
  const data = snap.data();
  const stored = data?.pinCode as string | undefined;
  if (!stored || stored !== trimmed) {
    return false;
  }
  if (data.status && !['searching', 'requested', 'negotiating'].includes(String(data.status))) {
    return false;
  }
  await updateDoc(doc(db, 'rides', rideId), {
    driverId,
    status: 'accepted',
    pinVerified: true,
    updatedAt: serverTimestamp(),
  });
  return true;
}

export async function verifyRidePin(rideId: string, pin: string): Promise<boolean> {
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'rides', rideId));
  const stored = snap.data()?.pinCode;
  if (!stored || stored !== pin) {
    return false;
  }
  await updateDoc(doc(db, 'rides', rideId), {
    pinVerified: true,
    status: 'ongoing',
    updatedAt: serverTimestamp(),
  });
  return true;
}

export async function counterRideFare(rideId: string, counterFare: number): Promise<void> {
  await updateDoc(doc(db, 'rides', rideId), {
    counterFare,
    status: 'requested',
    updatedAt: serverTimestamp(),
  });
}

export async function acceptCounterFare(rideId: string): Promise<void> {
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'rides', rideId));
  const counter = Number(snap.data()?.counterFare ?? 0);
  await updateDoc(doc(db, 'rides', rideId), {
    estimatedFare: counter,
    offeredFare: counter,
    status: 'searching',
    updatedAt: serverTimestamp(),
  });
  const pickup = snap.data()?.pickup?.coordinates;
  if (pickup) {
    void matchDriverToRide(rideId, pickup, snap.data()?.category ?? 'economy').catch((error) => {
      if (__DEV__) {
        console.warn('[Rides] Driver matching failed:', error);
      }
    });
  }
}

/**
 * Driver declines a ride: unassigns and remembers the driver as a decliner,
 * so the trip still surfaces in their Trips tab under "Declined".
 */
export async function declineRide(rideId: string, driverId?: string): Promise<void> {
  const payload: Record<string, unknown> = {
    driverId: null,
    status: 'searching',
    updatedAt: serverTimestamp(),
  };
  if (driverId) {
    payload.declinedBy = arrayUnion(driverId);
  }
  await updateDoc(doc(db, 'rides', rideId), payload);
}

export async function triggerSos(rideId: string): Promise<void> {
  await updateDoc(doc(db, 'rides', rideId), {
    sosTriggered: true,
    updatedAt: serverTimestamp(),
  });
}

export async function updateRideStatus(rideId: string, status: RideStatus): Promise<void> {
  const payload: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === 'completed') {
    payload.completedAt = serverTimestamp();
  }

  await updateDoc(doc(db, 'rides', rideId), payload);
}

export async function completeRideWithPayment(
  rideId: string,
  userId: string,
  fare: number,
  method: PaymentMethod,
  currency: CurrencyCode = 'USD',
): Promise<void> {
  if (method === 'wallet') {
    const paid = await payFromWallet(userId, fare, currency, rideId);
    if (!paid) {
      throw new Error('Insufficient wallet balance for this currency.');
    }
  }
  await updateRideStatus(rideId, 'completed');
}

export function subscribeToRide(rideId: string, callback: (ride: Ride | null) => void) {
  return safeOnSnapshotDoc(doc(db, 'rides', rideId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback(mapRideDoc(snapshot));
  }, `ride:${rideId}`);
}

export async function getRideById(rideId: string): Promise<Ride | null> {
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'rides', rideId));
  if (!snap.exists()) {
    return null;
  }
  return mapRideDoc(snap);
}

export async function getUserRideHistory(userId: string): Promise<Ride[]> {
  const ridesQuery = query(collection(db, 'rides'), where('userId', '==', userId));
  const snapshot = await getDocs(ridesQuery);
  return snapshot.docs.map((d) => mapRideDoc(d)).sort((a, b) => b.createdAt - a.createdAt);
}

/** Live subscription to all of a user's rides, ordered newest first. */
export function subscribeToUserRides(userId: string, callback: (rides: Ride[]) => void) {
  const ridesQuery = query(collection(db, 'rides'), where('userId', '==', userId));
  return safeOnSnapshotQuery(ridesQuery, (snapshot) => {
    callback(snapshot.docs.map((d) => mapRideDoc(d)).sort((a, b) => b.createdAt - a.createdAt));
  }, `user-rides:${userId}`);
}

/**
 * Live subscription that surfaces every ride the driver has interacted with —
 * currently assigned (any status) plus rides they previously declined.
 */
export function subscribeToDriverTrips(driverId: string, callback: (rides: Ride[]) => void) {
  let assigned: Ride[] = [];
  let declined: Ride[] = [];

  const emit = () => {
    const map = new Map<string, Ride>();
    for (const r of assigned) map.set(r.id, r);
    for (const r of declined) {
      if (!map.has(r.id)) map.set(r.id, r);
    }
    callback(Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt));
  };

  const assignedQuery = query(collection(db, 'rides'), where('driverId', '==', driverId));
  const declinedQuery = query(collection(db, 'rides'), where('declinedBy', 'array-contains', driverId));

  const unsubAssigned = safeOnSnapshotQuery(
    assignedQuery,
    (snap) => {
      assigned = snap.docs.map((d) => mapRideDoc(d));
      emit();
    },
    `driver-trips:assigned:${driverId}`,
  );
  const unsubDeclined = safeOnSnapshotQuery(
    declinedQuery,
    (snap) => {
      declined = snap.docs.map((d) => mapRideDoc(d));
      emit();
    },
    `driver-trips:declined:${driverId}`,
  );

  return () => {
    unsubAssigned();
    unsubDeclined();
  };
}

export function subscribeToDriverAssignedRides(
  driverId: string,
  callback: (rides: Ride[]) => void,
) {
  const ridesQuery = query(collection(db, 'rides'), where('driverId', '==', driverId));

  return safeOnSnapshotQuery(ridesQuery, (snapshot) => {
    callback(
      snapshot.docs
        .map((d) => mapRideDoc(d))
        .filter((ride) =>
          ['requested', 'negotiating', 'accepted', 'arriving', 'ongoing'].includes(ride.status),
        ),
    );
  }, `driver-rides:${driverId}`);
}

export function subscribeToNegotiatingRides(callback: (rides: Ride[]) => void) {
  const ridesQuery = query(collection(db, 'rides'), where('status', '==', 'negotiating'));
  return safeOnSnapshotQuery(ridesQuery, (snapshot) => {
    callback(snapshot.docs.map((d) => mapRideDoc(d)));
  }, 'negotiating-rides');
}

export function subscribeToAllActiveRides(callback: (rides: Ride[]) => void) {
  return safeOnSnapshotQuery(collection(db, 'rides'), (snapshot) => {
    callback(
      snapshot.docs
        .map((d) => mapRideDoc(d))
        .filter((r) => !['completed', 'cancelled'].includes(r.status))
        .sort((a, b) => b.createdAt - a.createdAt),
    );
  }, 'active-rides');
}

export { estimateFare, getRouteDistanceKm };
