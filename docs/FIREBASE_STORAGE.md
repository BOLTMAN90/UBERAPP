# Profile photo uploads (Firebase Storage)

## Important: Storage is not enabled yet on bolexuber

Running `npm run storage:check` shows both bucket names return **404**:

- `bolexuber.firebasestorage.app` — NOT FOUND
- `bolexuber.appspot.com` — NOT FOUND

That means **Firebase Storage has not been created** in your Firebase project. No app code can fix this alone.

### Avatar uploads still work (Firestore fallback)

The app automatically saves your photo to **Firestore** when Storage is missing. Reload Expo Go and try uploading again — it should work.

---

## Enable Firebase Storage (recommended for production)

1. Open [Firebase Console → bolexuber → Storage](https://console.firebase.google.com/project/bolexuber/storage)
2. Click **Get started**
3. Choose a region (e.g. `europe-west1` or `us-central1`)
4. New projects may require the **Blaze (pay-as-you-go)** plan — Firebase Storage has a free tier
5. Copy the bucket name shown (usually `bolexuber.firebasestorage.app`)
6. Update `.env`:

```env
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=bolexuber.firebasestorage.app
```

7. Push env and deploy rules:

```powershell
eas.cmd env:push --environment preview
npm.cmd run firebase:login
npm.cmd run firebase:deploy:rules
npm.cmd run storage:check
```

When `storage:check` shows **EXISTS** instead of **NOT FOUND**, new uploads go to Cloud Storage automatically.

---

## How uploads work in the app

1. Try **Firebase Storage REST** upload (native file upload, no Blob)
2. If bucket is missing (404), save compressed image to **Firestore** `avatarDataUrl`
3. Profile screens show `avatarDataUrl` or `photoURL`

## If upload still fails

- Sign out and sign in again
- Confirm phone has internet
- Try a smaller / cropped photo
