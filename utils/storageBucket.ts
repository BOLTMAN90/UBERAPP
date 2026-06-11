import { firebaseConfig } from '@/constants/config';

function normalizeBucket(value?: string | null): string | null {
  const bucket = value?.replace(/^gs:\/\//, '').trim();
  if (!bucket || bucket.includes('YOUR_')) {
    return null;
  }
  return bucket;
}

/** Ordered bucket names to try (env first, then modern + legacy Firebase defaults). */
export function getStorageBucketCandidates(): string[] {
  const projectId = firebaseConfig.projectId?.trim();
  const configured = normalizeBucket(firebaseConfig.storageBucket);
  const defaults: string[] = [];

  if (projectId && !projectId.includes('YOUR_')) {
    defaults.push(`${projectId}.firebasestorage.app`, `${projectId}.appspot.com`);
  }

  const ordered = [configured, ...defaults].filter(Boolean) as string[];
  return [...new Set(ordered)];
}

export function getPrimaryStorageBucket(): string {
  const candidates = getStorageBucketCandidates();
  if (!candidates.length) {
    throw new Error('Firebase Storage bucket is not configured.');
  }
  return candidates[0];
}
