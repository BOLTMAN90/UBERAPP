import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';

import { connectAuthEmulator, getAuth } from 'firebase/auth';

import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore';
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage';

import { Platform } from 'react-native';



import { firebaseConfig, useFirebaseEmulators } from '@/constants/config';

import { getEmulatorHost } from '@/utils/emulatorHost';



const FIRESTORE_GLOBAL_KEY = '__boltride_firestore__';
const AUTH_GLOBAL_KEY = '__boltride_auth__';
const STORAGE_GLOBAL_KEY = '__boltride_storage__';



const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);



function getOrCreateAuth() {

  const globalRef = globalThis as typeof globalThis & {

    [AUTH_GLOBAL_KEY]?: ReturnType<typeof getAuth>;

  };



  if (globalRef[AUTH_GLOBAL_KEY]) {

    return globalRef[AUTH_GLOBAL_KEY];

  }



  globalRef[AUTH_GLOBAL_KEY] = getAuth(app);
  return globalRef[AUTH_GLOBAL_KEY];

}



function getOrCreateFirestore(): Firestore {

  const globalRef = globalThis as typeof globalThis & {

    [FIRESTORE_GLOBAL_KEY]?: Firestore;

  };



  if (globalRef[FIRESTORE_GLOBAL_KEY]) {

    return globalRef[FIRESTORE_GLOBAL_KEY];

  }



  if (Platform.OS === 'web') {

    globalRef[FIRESTORE_GLOBAL_KEY] = getFirestore(app);

    return globalRef[FIRESTORE_GLOBAL_KEY];

  }



  try {

    globalRef[FIRESTORE_GLOBAL_KEY] = initializeFirestore(app, {

      localCache: memoryLocalCache(),

      experimentalForceLongPolling: true,

    });

  } catch {

    globalRef[FIRESTORE_GLOBAL_KEY] = getFirestore(app);

  }



  return globalRef[FIRESTORE_GLOBAL_KEY];

}



function getOrCreateStorage(): FirebaseStorage {
  const globalRef = globalThis as typeof globalThis & {
    [STORAGE_GLOBAL_KEY]?: FirebaseStorage;
  };

  if (globalRef[STORAGE_GLOBAL_KEY]) {
    return globalRef[STORAGE_GLOBAL_KEY];
  }

  globalRef[STORAGE_GLOBAL_KEY] = getStorage(app);
  return globalRef[STORAGE_GLOBAL_KEY];
}

export const auth = getOrCreateAuth();
export const db = getOrCreateFirestore();
export const storage = getOrCreateStorage();

let emulatorsConnected = false;

if (useFirebaseEmulators && !emulatorsConnected) {
  const host = getEmulatorHost();
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
  emulatorsConnected = true;
}



/**

 * Kept for API compatibility. Do not call enableNetwork() here — it corrupts

 * active watch streams on React Native (Firestore internal assertion ca9).

 */

export async function ensureFirestoreOnline(): Promise<void> {

  return;

}


