import fs from 'node:fs';

function parseEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i < 0) continue;
    env[trimmed.slice(0, i).trim()] = trimmed
      .slice(i + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = parseEnv('.env');
const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'bolexuber';
const buckets = [
  env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  `${projectId}.firebasestorage.app`,
  `${projectId}.appspot.com`,
].filter(Boolean);

const unique = [...new Set(buckets)];

console.log('Checking Firebase Storage buckets for project:', projectId);
for (const bucket of unique) {
  try {
    const response = await fetch(
      `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?maxResults=1`,
    );
    const label =
      response.status === 404
        ? 'NOT FOUND — enable Storage in Firebase Console'
        : response.status === 401 || response.status === 403
          ? 'EXISTS (auth required for uploads)'
          : `reachable (${response.status})`;
    console.log(`  ${bucket} -> ${label}`);
  } catch (error) {
    console.log(`  ${bucket} -> error: ${error instanceof Error ? error.message : error}`);
  }
}
