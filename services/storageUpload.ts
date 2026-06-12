import * as FileSystem from 'expo-file-system/legacy';

import { useFirebaseEmulators } from '@/constants/config';
import { getEmulatorHost } from '@/utils/emulatorHost';
import { getStorageBucketCandidates } from '@/utils/storageBucket';

type StorageObjectMetadata = {
  name: string;
  bucket: string;
  downloadTokens?: string;
};

type UploadAttempt = {
  status: number;
  body: string;
  metadata?: StorageObjectMetadata;
};

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

async function attemptUpload(
  bucket: string,
  localFileUri: string,
  storagePath: string,
  contentType: string,
  authorization: string,
): Promise<UploadAttempt> {
  const uploadUrl = buildUploadUrl(bucket, storagePath);

  const result = await FileSystem.uploadAsync(uploadUrl, localFileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: authorization,
      'Content-Type': contentType,
    },
  });

  if (result.status >= 200 && result.status < 300) {
    try {
      const metadata = JSON.parse(result.body) as StorageObjectMetadata;
      return { status: result.status, body: result.body, metadata };
    } catch {
      return { status: result.status, body: result.body };
    }
  }

  return { status: result.status, body: result.body ?? '' };
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
  const buckets = getStorageBucketCandidates();
  if (!buckets.length) {
    throw new Error('Firebase Storage bucket is not configured.');
  }

  let lastBody = '';
  let lastStatus = 0;
  const authHeaders = [`Firebase ${idToken}`, `Bearer ${idToken}`];

  for (const authorization of authHeaders) {
    for (const bucket of buckets) {
      const attempt = await attemptUpload(
        bucket,
        localFileUri,
        storagePath,
        contentType,
        authorization,
      );

      if (attempt.metadata) {
        return buildDownloadUrl(attempt.metadata);
      }

      lastStatus = attempt.status;
      lastBody = attempt.body;

      if (attempt.status === 401 || attempt.status === 403) {
        throw new Error('Storage denied the upload. Sign in again or deploy storage rules.');
      }

      if (attempt.status !== 404) {
        break;
      }
    }

    if (lastStatus !== 404) {
      break;
    }
  }

  if (lastStatus === 404) {
    throw new Error(
      'Firebase Storage bucket not found. Open Firebase Console → Storage → Get started, then set EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET to the bucket name shown there (often projectid.firebasestorage.app).',
    );
  }

  const snippet = lastBody.slice(0, 240) || 'No response body';
  throw new Error(`Storage upload failed (${lastStatus}): ${snippet}`);
}
