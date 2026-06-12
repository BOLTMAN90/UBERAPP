import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '@/services/firebase';
import { DEFAULT_CURRENCY } from '@/constants/currencies';
import type { AppUser, UserRole } from '@/types';
import { createEmptyBalances } from '@/utils/currency';
import { withTimeout } from '@/utils/async';
import { isFirebaseOfflineError, isFirebasePermissionError } from '@/utils/firebaseErrors';
import { stripUndefined } from '@/utils/firestoreData';
import { runFirestoreWithRetry } from '@/utils/firestoreRetry';

const AUTH_TIMEOUT_MS = 25_000;
const AUTH_TIMEOUT_MESSAGE =
  'Request timed out. Check your internet, Firebase .env values (no spaces or quotes), and that Email/Password sign-in is enabled in Firebase Console.';

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  role: UserRole,
  phone?: string,
): Promise<AppUser> {
  const credential = await withTimeout(
    createUserWithEmailAndPassword(auth, email, password),
    AUTH_TIMEOUT_MS,
    AUTH_TIMEOUT_MESSAGE,
  );
  await updateProfile(credential.user, { displayName });

  const trimmedPhone = phone?.trim();
  const profile: AppUser = {
    uid: credential.user.uid,
    email,
    displayName,
    ...(trimmedPhone ? { phone: trimmedPhone } : {}),
    role,
    createdAt: Date.now(),
    walletBalance: 0,
    walletBalances: createEmptyBalances(),
    preferredCurrency: DEFAULT_CURRENCY,
    loyaltyPoints: 0,
    favoriteLocations: [],
    emergencyContacts: [],
    referralCode: `RY${credential.user.uid.slice(0, 6).toUpperCase()}`,
    kycStatus: 'pending',
  };

  await withTimeout(
    setDoc(
      doc(db, 'users', credential.user.uid),
      stripUndefined({
        ...profile,
        createdAt: serverTimestamp(),
      }),
    ),
    AUTH_TIMEOUT_MS,
    AUTH_TIMEOUT_MESSAGE,
  );

  if (role === 'driver') {
    await withTimeout(
      setDoc(doc(db, 'drivers', credential.user.uid), {
        uid: credential.user.uid,
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
      }),
      AUTH_TIMEOUT_MS,
      AUTH_TIMEOUT_MESSAGE,
    );
  }

  return profile;
}

export async function signIn(email: string, password: string): Promise<User> {
  const credential = await withTimeout(
    signInWithEmailAndPassword(auth, email, password),
    AUTH_TIMEOUT_MS,
    AUTH_TIMEOUT_MESSAGE,
  );
  return credential.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

async function readUserProfile(uid: string): Promise<AppUser | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    uid,
    email: data.email,
    displayName: data.displayName,
    phone: data.phone,
    role: data.role,
    photoURL: data.avatarDataUrl ?? data.photoURL,
    avatarDataUrl: data.avatarDataUrl,
    walletBalance: data.walletBalance,
    walletBalances: data.walletBalances,
    preferredCurrency: data.preferredCurrency,
    favoriteLocations: data.favoriteLocations,
    emergencyContacts: data.emergencyContacts,
    loyaltyPoints: data.loyaltyPoints,
    referralCode: data.referralCode,
    kycStatus: data.kycStatus,
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
  };
}

/** Load Firestore profile; retries while the client is still coming online on mobile. */
export async function getUserProfile(uid: string): Promise<AppUser | null> {
  try {
    return await runFirestoreWithRetry(() => readUserProfile(uid));
  } catch (error) {
    if (isFirebasePermissionError(error) || isFirebaseOfflineError(error)) {
      if (__DEV__ && isFirebasePermissionError(error)) {
        console.warn('[Auth] getUserProfile permission-denied — deploy rules: npm run firebase:deploy:rules');
      }
      return null;
    }
    throw error;
  }
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await setDoc(doc(db, 'users', uid), { role }, { merge: true });

  if (role === 'driver') {
    const existing = await getDoc(doc(db, 'drivers', uid));
    if (!existing.exists()) {
      const user = await getDoc(doc(db, 'users', uid));
      await setDoc(doc(db, 'drivers', uid), {
        uid,
        displayName: user.data()?.displayName ?? 'Driver',
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
    }
  }
}
