import fs from 'node:fs';
import path from 'node:path';

function sanitize(v) {
  return (v ?? '').trim().replace(/^['"]|['"]$/g, '');
}

function parseEnv(file) {
  const o = {};
  if (!fs.existsSync(file)) return o;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    o[t.slice(0, i).trim()] = sanitize(t.slice(i + 1));
  }
  return o;
}

const required = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];
const optional = ['EXPO_PUBLIC_GOOGLE_MAPS_API_KEY'];
const expectedProject = JSON.parse(fs.readFileSync('.firebaserc', 'utf8')).projects?.default;

function validate(label, file) {
  const env = parseEnv(file);
  const issues = [];
  if (!fs.existsSync(file)) {
    issues.push('file missing');
    return { issues, env };
  }
  for (const k of required) {
    const v = env[k];
    if (!v) issues.push(`missing: ${k}`);
    else if (v.includes('YOUR_')) issues.push(`placeholder: ${k}`);
  }
  const maps = env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!maps) issues.push('optional missing: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
  else if (maps.includes('YOUR_')) issues.push('placeholder: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
  if (
    env.EXPO_PUBLIC_FIREBASE_PROJECT_ID &&
    expectedProject &&
    env.EXPO_PUBLIC_FIREBASE_PROJECT_ID !== expectedProject
  ) {
    issues.push(
      `projectId mismatch (env=${env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}, .firebaserc=${expectedProject})`,
    );
  }
  if (env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
    issues.push('EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true (use only for npm run dev:emulators)');
  }
  return { issues, env };
}

const root = validate('root', '.env');
console.log('ROOT .env:', root.issues.length ? root.issues.join('; ') : 'OK');
for (const k of [...required, ...optional]) {
  const v = root.env[k];
  console.log(`  ${k}: ${v ? `set (${v.length} chars)` : 'EMPTY'}`);
}

const cursor = validate('cursor', 'cursor/.env');
if (fs.existsSync('cursor/.env')) {
  console.log('cursor/.env:', cursor.issues.length ? cursor.issues.join('; ') : 'OK (duplicate; Expo uses root .env)');
}

process.exit(root.issues.length ? 1 : 0);
