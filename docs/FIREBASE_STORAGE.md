# Profile photo uploads (Firebase Storage)

## App fix

Uploads use `expo-file-system` + Firebase `uploadString` (base64). The old `fetch(uri).blob()` approach fails on Android and caused `storage/unknown`.

## One-time Firebase Console setup

1. Open [Firebase Console](https://console.firebase.google.com/) → project **bolexuber** → **Storage** → **Get started** (if not enabled).
2. Copy the bucket name (often `bolexuber.firebasestorage.app` or `bolexuber.appspot.com`).
3. Set `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` in root `.env` and EAS preview env to **exactly** that value:

```powershell
eas.cmd env:push --environment preview
```

4. Deploy storage rules from this repo:

```powershell
npm.cmd run firebase:login
npm.cmd run firebase:deploy:rules
```

Rules allow each signed-in user to write only their own `avatars/{userId}/` folder (max 5 MB, images only).

## If upload still fails

- Sign out and sign in again (refreshes auth token).
- Confirm internet on the phone.
- In Firebase Console → Storage → Rules, verify the rules match `storage.rules` in this repo.
