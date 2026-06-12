/** Prefer Firestore-stored avatar, then Storage URL, then Auth photo. */
export function resolveProfilePhotoUri(
  profile?: { photoURL?: string | null; avatarDataUrl?: string | null } | null,
  authPhotoURL?: string | null,
): string | null {
  const uri = profile?.avatarDataUrl ?? profile?.photoURL ?? authPhotoURL ?? null;
  return uri && uri.trim() ? uri : null;
}
