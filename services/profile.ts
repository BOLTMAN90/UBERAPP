import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { auth, db, storage } from '@/services/firebase';
import { base64ToUint8Array, guessImageContentType, readImageBase64 } from '@/utils/imageUpload';
import { runFirestoreWithRetry } from '@/utils/firestoreRetry';

function storagePathForUser(userId: string, contentType: string): string {
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  return `avatars/${userId}/profile.${ext}`;
}

function friendlyStorageError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: string }).code)
      : '';
  if (code === 'storage/unauthorized') {
    return 'You must be signed in to upload a photo. Sign out and sign in again, then retry.';
  }
  if (code === 'storage/unauthenticated') {
    return 'Session expired. Sign in again, then retry your upload.';
  }
  if (code === 'storage/quota-exceeded') {
    return 'Storage quota exceeded. Contact support or try a smaller image.';
  }
  if (code === 'storage/unknown') {
    return 'Upload failed. Check your internet connection and that Firebase Storage is enabled for this project.';
  }
  if (error instanceof Error && error.message.includes('ArrayBuffer')) {
    return 'Upload failed on this device. Try a smaller photo or choose from gallery again.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Could not upload photo. Please try again.';
}

/** Upload profile photo and save URL on Auth + Firestore user (and driver doc if present). */
export async function uploadProfilePhoto(
  userId: string,
  localUri: string,
  mimeType?: string | null,
): Promise<string> {
  if (!auth.currentUser) {
    throw new Error('You must be signed in to upload a photo.');
  }
  if (auth.currentUser.uid !== userId) {
    throw new Error('You can only update your own profile photo.');
  }

  const contentType = mimeType?.startsWith('image/') ? mimeType : guessImageContentType(localUri);
  const base64 = await readImageBase64(localUri);
  if (!base64) {
    throw new Error('Could not read the selected image.');
  }

  const storageRef = ref(storage, storagePathForUser(userId, contentType));

  try {
    const bytes = base64ToUint8Array(base64);
    await uploadBytes(storageRef, bytes, { contentType });
  } catch (error) {
    throw new Error(friendlyStorageError(error));
  }

  const downloadUrl = await getDownloadURL(storageRef);

  await updateProfile(auth.currentUser, { photoURL: downloadUrl });

  await runFirestoreWithRetry(async () => {
    await setDoc(
      doc(db, 'users', userId),
      { photoURL: downloadUrl },
      { merge: true },
    );
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (userSnap.data()?.role === 'driver') {
      await setDoc(doc(db, 'drivers', userId), { photoURL: downloadUrl }, { merge: true });
    }
  });

  return downloadUrl;
}
