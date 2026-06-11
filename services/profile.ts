import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/services/firebase';
import { uploadFileToFirebaseStorage } from '@/services/storageUpload';
import { prepareAvatarForUpload } from '@/utils/imageUpload';
import { runFirestoreWithRetry } from '@/utils/firestoreRetry';

function storagePathForUser(userId: string): string {
  return `avatars/${userId}/profile.jpg`;
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

  let fileUri: string;
  let contentType: string;
  try {
    const prepared = await prepareAvatarForUpload(localUri);
    fileUri = prepared.fileUri;
    contentType = mimeType?.startsWith('image/') ? mimeType : prepared.contentType;
  } catch {
    throw new Error('Could not prepare the selected image. Try another photo.');
  }

  const storagePath = storagePathForUser(userId);
  const idToken = await auth.currentUser.getIdToken();

  let downloadUrl: string;
  try {
    downloadUrl = await uploadFileToFirebaseStorage(fileUri, storagePath, contentType, idToken);
  } catch (error) {
    throw new Error(friendlyStorageError(error));
  }

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
