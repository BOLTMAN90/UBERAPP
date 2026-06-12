import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

import { auth, db } from '@/services/firebase';
import { uploadFileToFirebaseStorage } from '@/services/storageUpload';
import { ensureLocalFileUri } from '@/utils/imageUpload';
import { runFirestoreWithRetry } from '@/utils/firestoreRetry';

const MAX_FIRESTORE_AVATAR_CHARS = 750_000;

function storagePathForUser(userId: string): string {
  return `avatars/${userId}/profile.jpg`;
}

function isStorageUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('404') ||
    message.includes('bucket not found') ||
    message.includes('storage bucket') ||
    message.includes('not found')
  );
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

async function prepareAvatarFile(localUri: string): Promise<{ fileUri: string; contentType: string }> {
  const manipulated = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 800 } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
  );
  const fileUri = await ensureLocalFileUri(manipulated.uri);
  return { fileUri, contentType: 'image/jpeg' };
}

async function prepareSmallAvatarFile(localUri: string): Promise<{ fileUri: string; contentType: string }> {
  const manipulated = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 400 } }],
    { compress: 0.68, format: ImageManipulator.SaveFormat.JPEG },
  );
  const fileUri = await ensureLocalFileUri(manipulated.uri);
  return { fileUri, contentType: 'image/jpeg' };
}

/** Save avatar in Firestore when Firebase Storage bucket is not set up yet. */
async function saveAvatarToFirestore(
  userId: string,
  localUri: string,
  contentType: string,
): Promise<string> {
  const { fileUri, contentType: smallType } = await prepareSmallAvatarFile(localUri);
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const dataUrl = `data:${contentType || smallType};base64,${base64}`;

  if (dataUrl.length > MAX_FIRESTORE_AVATAR_CHARS) {
    throw new Error('Image is too large. Try a smaller photo or crop tighter.');
  }

  await runFirestoreWithRetry(async () => {
    await setDoc(
      doc(db, 'users', userId),
      { avatarDataUrl: dataUrl, photoURL: null },
      { merge: true },
    );
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (userSnap.data()?.role === 'driver') {
      await setDoc(doc(db, 'drivers', userId), { avatarDataUrl: dataUrl, photoURL: null }, { merge: true });
    }
  });

  return dataUrl;
}

async function saveAvatarReference(
  userId: string,
  photoRef: string,
  useCloudStorage: boolean,
): Promise<void> {
  if (useCloudStorage && photoRef.startsWith('http')) {
    await updateProfile(auth.currentUser!, { photoURL: photoRef });
  }

  await runFirestoreWithRetry(async () => {
    const userPatch = useCloudStorage
      ? { photoURL: photoRef, avatarDataUrl: null }
      : { avatarDataUrl: photoRef, photoURL: null };

    await setDoc(doc(db, 'users', userId), userPatch, { merge: true });

    const userSnap = await getDoc(doc(db, 'users', userId));
    if (userSnap.data()?.role === 'driver') {
      await setDoc(doc(db, 'drivers', userId), userPatch, { merge: true });
    }
  });
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
    const prepared = await prepareAvatarFile(localUri);
    fileUri = prepared.fileUri;
    contentType = mimeType?.startsWith('image/') ? mimeType : prepared.contentType;
  } catch {
    throw new Error('Could not prepare the selected image. Try another photo.');
  }

  const storagePath = storagePathForUser(userId);
  const idToken = await auth.currentUser.getIdToken();

  let photoRef: string;
  let usedCloudStorage = true;

  try {
    photoRef = await uploadFileToFirebaseStorage(fileUri, storagePath, contentType, idToken);
  } catch (error) {
    if (!isStorageUnavailableError(error)) {
      throw new Error(friendlyStorageError(error));
    }
    photoRef = await saveAvatarToFirestore(userId, localUri, contentType);
    usedCloudStorage = false;
  }

  if (usedCloudStorage) {
    await saveAvatarReference(userId, photoRef, true);
  }

  return photoRef;
}
