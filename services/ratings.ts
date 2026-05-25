import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { db } from '@/services/firebase';

export async function rateRide(
  rideId: string,
  role: 'rider' | 'driver',
  rating: number,
  review?: string,
): Promise<void> {
  const payload =
    role === 'rider'
      ? { riderRating: rating, riderReview: review ?? '' }
      : { driverRating: rating, driverReview: review ?? '' };
  await updateDoc(doc(db, 'rides', rideId), payload);
}

export async function updateDriverRating(driverId: string, newRating: number): Promise<void> {
  const ref = doc(db, 'drivers', driverId);
  const snap = await getDoc(ref);
  const count = Number(snap.data()?.ratingCount ?? 0);
  const current = Number(snap.data()?.rating ?? 5);
  const nextCount = count + 1;
  const nextRating = (current * count + newRating) / nextCount;
  await updateDoc(ref, { rating: Math.round(nextRating * 10) / 10, ratingCount: nextCount });
}
