import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { db } from '@/services/firebase';
import type { FavoriteLocation, GeoPoint } from '@/types';
import { isFirebasePermissionError } from '@/utils/firebaseErrors';
import { runFirestoreWithRetry } from '@/utils/firestoreRetry';

export async function getFavoriteLocations(userId: string): Promise<FavoriteLocation[]> {
  try {
    const snap = await runFirestoreWithRetry(() => getDoc(doc(db, 'users', userId)));
    return (snap.data()?.favoriteLocations as FavoriteLocation[]) ?? [];
  } catch (error) {
    if (isFirebasePermissionError(error)) {
      return [];
    }
    throw error;
  }
}

export async function saveFavoriteLocation(
  userId: string,
  favorite: FavoriteLocation,
): Promise<void> {
  const snap = await getDoc(doc(db, 'users', userId));
  const existing = (snap.data()?.favoriteLocations as FavoriteLocation[]) ?? [];
  const next = existing.filter((f) => f.id !== favorite.id).concat(favorite);
  await updateDoc(doc(db, 'users', userId), { favoriteLocations: next });
}

export async function setHomeWorkFavorites(
  userId: string,
  home?: { address: string; coordinates: GeoPoint },
  work?: { address: string; coordinates: GeoPoint },
): Promise<void> {
  const favorites: FavoriteLocation[] = [];
  if (home) {
    favorites.push({ id: 'home', label: 'Home', address: home.address, coordinates: home.coordinates });
  }
  if (work) {
    favorites.push({ id: 'work', label: 'Work', address: work.address, coordinates: work.coordinates });
  }
  const existing = await getFavoriteLocations(userId);
  const other = existing.filter((f) => f.id !== 'home' && f.id !== 'work');
  await updateDoc(doc(db, 'users', userId), { favoriteLocations: [...other, ...favorites] });
}
