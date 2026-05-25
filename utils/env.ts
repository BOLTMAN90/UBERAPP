/** Trim whitespace and optional quotes from Expo env values. */
export function sanitizeEnvValue(value: string | undefined): string {
  if (!value) {
    return '';
  }
  return value.trim().replace(/^['"]|['"]$/g, '');
}
