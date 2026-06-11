import { isFirebaseOfflineError, isFirebasePermissionError } from '@/utils/firebaseErrors';

const MAX_ATTEMPTS = 6;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry transient Firestore reads/writes (React Native / Expo Go). */
export async function runFirestoreWithRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (isFirebasePermissionError(error)) {
        throw error;
      }
      const retryable = isFirebaseOfflineError(error) || isUnavailable(error);
      if (!retryable || attempt === MAX_ATTEMPTS - 1) {
        throw error;
      }
      await wait(1000 * (attempt + 1));
    }
  }

  throw lastError;
}

function isUnavailable(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : '';
  return code === 'unavailable';
}
