import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { auth, db, storage } from '@/services/firebase';
import { runFirestoreWithRetry } from '@/utils/firestoreRetry';

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

/** Upload profile photo and save URL on Auth + Firestore user (and driver doc if present). */
export async function uploadProfilePhoto(userId: string, localUri: string): Promise<string> {
  const blob = await uriToBlob(localUri);
  const storageRef = ref(storage, `avatars/${userId}/profile.jpg`);

  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  const downloadUrl = await getDownloadURL(storageRef);

  if (auth.currentUser?.uid === userId) {
    await updateProfile(auth.currentUser, { photoURL: downloadUrl });
  }

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
