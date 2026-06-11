import * as FileSystem from 'expo-file-system/legacy';

import { firebaseConfig, useFirebaseEmulators } from '@/constants/config';
import { getEmulatorHost } from '@/utils/emulatorHost';

type StorageObjectMetadata = {
  name: string;
  bucket: string;
  downloadTokens?: string;
};

function getStorageBucket(): string {
  const bucket = firebaseConfig.storageBucket?.replace(/^gs:\/\//, '').trim();
  if (!bucket) {
    throw new Error('Firebase Storage bucket is not configured.');
  }
  return bucket;
}

function buildUploadUrl(bucket: string, storagePath: string): string {
  const encodedName = encodeURIComponent(storagePath);
  if (useFirebaseEmulators) {
    const host = getEmulatorHost();
    return `http://${host}:9199/v0/b/${bucket}/o?uploadType=media&name=${encodedName}`;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodedName}`;
}

function buildDownloadUrl(metadata: StorageObjectMetadata): string {
  const objectPath = encodeURIComponent(metadata.name);
  const token = metadata.downloadTokens;
  if (useFirebaseEmulators) {
    const host = getEmulatorHost();
    return `http://${host}:9199/v0/b/${metadata.bucket}/o/${objectPath}?alt=media${token ? `&token=${token}` : ''}`;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${metadata.bucket}/o/${objectPath}?alt=media&token=${token}`;
}

/**
 * Upload a local file to Firebase Storage via REST (no Blob — works in React Native).
 */
export async function uploadFileToFirebaseStorage(
  localFileUri: string,
  storagePath: string,
  contentType: string,
  idToken: string,
): Promise<string> {
  const bucket = getStorageBucket();
  const uploadUrl = buildUploadUrl(bucket, storagePath);

  const result = await FileSystem.uploadAsync(uploadUrl, localFileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Firebase ${idToken}`,
      'Content-Type': contentType,
    },
  });

  if (result.status < 200 || result.status >= 300) {
    const snippet = result.body?.slice(0, 240) ?? 'No response body';
    if (result.status === 401 || result.status === 403) {
      throw new Error('Storage denied the upload. Sign in again or deploy storage rules.');
    }
    throw new Error(`Storage upload failed (${result.status}): ${snippet}`);
  }

  const metadata = JSON.parse(result.body) as StorageObjectMetadata;
  return buildDownloadUrl(metadata);
}
