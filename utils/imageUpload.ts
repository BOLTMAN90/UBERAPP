import * as FileSystem from 'expo-file-system/legacy';

/** Read a local camera/gallery URI into base64 (works on Android content:// and file:// URIs). */
export async function readImageBase64(localUri: string): Promise<string> {
  const normalized = localUri.split('?')[0] ?? localUri;
  return FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  }).catch(async () => {
    // Some Android pickers return URIs that need copying to cache first.
    const ext = guessExtension(normalized);
    const cacheUri = `${FileSystem.cacheDirectory}upload-${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: localUri, to: cacheUri });
    return FileSystem.readAsStringAsync(cacheUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  });
}

export function guessImageContentType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.heic') || lower.includes('.heif')) return 'image/heic';
  return 'image/jpeg';
}

function guessExtension(uri: string): string {
  const type = guessImageContentType(uri);
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}
