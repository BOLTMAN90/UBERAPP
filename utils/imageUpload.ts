import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

/** Resize/compress avatar and return a stable file:// URI for upload. */
export async function prepareAvatarForUpload(localUri: string): Promise<{
  fileUri: string;
  contentType: string;
}> {
  const manipulated = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 800 } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
  );

  const fileUri = await ensureLocalFileUri(manipulated.uri);
  return { fileUri, contentType: 'image/jpeg' };
}

/** Copy content:// or other URIs to a cache file:// path the uploader can read. */
export async function ensureLocalFileUri(localUri: string): Promise<string> {
  if (localUri.startsWith('file://')) {
    return localUri;
  }

  const cacheUri = `${FileSystem.cacheDirectory}avatar-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: localUri, to: cacheUri });
  return cacheUri;
}

export function guessImageContentType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.heic') || lower.includes('.heif')) return 'image/heic';
  return 'image/jpeg';
}
