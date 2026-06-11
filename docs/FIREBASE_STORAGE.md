# Profile photo uploads (Firebase Storage)

## App fix

Uploads use **Firebase Storage REST API** + `expo-file-system` `uploadAsync` (native file upload). The Firebase JS SDK `uploadBytes` / `Blob` path fails on React Native with ArrayBuffer errors.

## One-time Firebase Console setup

1. Open [Firebase Console](https://console.firebase.google.com/) → project **bolexuber** → **Storage** → **Get started** (if not enabled).
2. Copy the bucket name from the Storage page (new projects use **`bolexuber.firebasestorage.app`**, not `.appspot.com`).
3. Set `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` in root `.env` and EAS preview env to **exactly** that value (no `gs://` prefix):

```env
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=bolexuber.firebasestorage.app
```

4. Push env to Expo and restart the dev server:

```powershell
eas.cmd env:push --environment preview
```

If you skip step 3, the app tries both `firebasestorage.app` and `appspot.com` automatically. A **404** still means Storage is not enabled yet — complete step 1.

5. Deploy storage rules from this repo:

```powershell
npm.cmd run firebase:login
npm.cmd run firebase:deploy:rules
```

Rules allow each signed-in user to write only their own `avatars/{userId}/` folder (max 5 MB, images only).

## If upload still fails

- Sign out and sign in again (refreshes auth token).
- Confirm internet on the phone.
- In Firebase Console → Storage → Rules, verify the rules match `storage.rules` in this repo.
