import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { DEFAULT_CURRENCY } from '@/constants/currencies';
import { db } from '@/services/firebase';
import type { CurrencyCode, PaymentMethod, WalletBalances, WalletTransaction } from '@/types';
import { createEmptyBalances, normalizeBalances } from '@/utils/currency';
import { isFirebasePermissionError } from '@/utils/firebaseErrors';
import { runFirestoreWithRetry } from '@/utils/firestoreRetry';

async function readUserWallet(userId: string) {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) {
    const balances = createEmptyBalances();
    return { preferredCurrency: DEFAULT_CURRENCY, balances };
  }
  const data = snap.data();
  const preferredCurrency = (data.preferredCurrency as CurrencyCode) ?? DEFAULT_CURRENCY;
  const balances = normalizeBalances(
    data.walletBalances as Partial<WalletBalances>,
    data.walletBalance as number | undefined,
  );
  return { preferredCurrency, balances };
}

export async function getPreferredCurrency(userId: string): Promise<CurrencyCode> {
  const { preferredCurrency } = await runFirestoreWithRetry(() => readUserWallet(userId));
  return preferredCurrency;
}

export async function setPreferredCurrency(userId: string, currency: CurrencyCode): Promise<void> {
  await runFirestoreWithRetry(() =>
    setDoc(doc(db, 'users', userId), { preferredCurrency: currency }, { merge: true }),
  );
}

export async function getWalletBalances(userId: string): Promise<{
  balances: WalletBalances;
  preferredCurrency: CurrencyCode;
}> {
  try {
    return await runFirestoreWithRetry(() => readUserWallet(userId));
  } catch (error) {
    if (isFirebasePermissionError(error)) {
      return { balances: createEmptyBalances(), preferredCurrency: DEFAULT_CURRENCY };
    }
    throw error;
  }
}

export async function getWalletBalance(userId: string, currency?: CurrencyCode): Promise<number> {
  const { balances, preferredCurrency } = await runFirestoreWithRetry(() => readUserWallet(userId));
  const code = currency ?? preferredCurrency;
  return balances[code] ?? 0;
}

export async function topUpWallet(
  userId: string,
  amount: number,
  currency: CurrencyCode,
  method: PaymentMethod,
): Promise<void> {
  if (amount <= 0) {
    throw new Error('Enter an amount greater than zero.');
  }

  await runFirestoreWithRetry(async () => {
    const { balances } = await readUserWallet(userId);
    const next = { ...balances, [currency]: (balances[currency] ?? 0) + amount };
    const userRef = doc(db, 'users', userId);
    const txnRef = doc(collection(db, 'walletTransactions'));

    const batch = writeBatch(db);
    batch.set(
      userRef,
      {
        walletBalances: next,
        walletBalance: next.NGN,
        preferredCurrency: currency,
      },
      { merge: true },
    );
    batch.set(txnRef, {
      userId,
      type: 'topup',
      amount,
      currency,
      method,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  });
}

export async function payFromWallet(
  userId: string,
  amount: number,
  currency: CurrencyCode,
  rideId: string,
): Promise<boolean> {
  return runFirestoreWithRetry(async () => {
    const { balances } = await readUserWallet(userId);
    const balance = balances[currency] ?? 0;

    if (balance < amount) {
      return false;
    }

    const next = { ...balances, [currency]: balance - amount };
    const userRef = doc(db, 'users', userId);
    const txnRef = doc(collection(db, 'walletTransactions'));

    const batch = writeBatch(db);
    batch.set(
      userRef,
      {
        walletBalances: next,
        walletBalance: next.NGN,
      },
      { merge: true },
    );
    batch.set(txnRef, {
      userId,
      type: 'ride_payment',
      amount: -amount,
      currency,
      rideId,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    return true;
  });
}

export async function getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
  return runFirestoreWithRetry(async () => {
    const q = query(collection(db, 'walletTransactions'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          type: data.type,
          amount: data.amount,
          currency: (data.currency as CurrencyCode) ?? DEFAULT_CURRENCY,
          method: data.method,
          rideId: data.rideId,
          createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  });
}
