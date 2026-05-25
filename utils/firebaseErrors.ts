export function isFirebasePermissionError(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : '';
  return code === 'permission-denied';
}

export function isFirebaseOfflineError(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : '';

  if (code === 'unavailable' || code === 'failed-precondition') {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.toLowerCase().includes('offline');
}

export function getFirebaseErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : null;

  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Sign in instead.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/user-not-found':
      return 'No account found for this email.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'Firebase API key is invalid. Fix .env (no spaces or quotes around values) and restart npm run dev.';
    case 'permission-denied':
      return 'Firestore denied this action. Sign in again, or run: npm run firebase:deploy:rules';
    case 'unavailable':
      return 'Could not reach Firestore. Check phone internet/Wi‑Fi and that Firestore is enabled in Firebase Console.';
    default:
      break;
  }

  if (isFirebaseOfflineError(error)) {
    return 'Firestore is offline. Connect your phone to the internet (or same Wi‑Fi as your PC) and try again.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
