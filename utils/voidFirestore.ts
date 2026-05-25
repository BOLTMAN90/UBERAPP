import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

/** Run a Firestore promise without surfacing an uncaught rejection in React Native. */
export function voidFirestore<T>(promise: Promise<T>, source: string): void {
  void promise.catch((error) => {
    if (__DEV__) {
      console.warn(`[Firestore] ${source}:`, getFirebaseErrorMessage(error));
    }
  });
}
