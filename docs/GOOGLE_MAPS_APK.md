# Google Maps blank on release APK

## Quick fix (no keystore change)

The **EAS keystore does not need to be fixed** — it already signs your APK correctly.

By default, release builds use **OpenStreetMap** (same as Expo Go) so the map is **not blank**. Rebuild the APK after pulling the latest code.

To switch to **native Google Maps** tiles, complete the SHA-1 steps below and set `EXPO_PUBLIC_USE_GOOGLE_MAPS_NATIVE=true` in `.env`, then `eas env:push` and rebuild.

---

A **beige/gray blank map** when using native Google Maps is almost always **Google Cloud API key restrictions**, not a broken keystore.

Your app package name: `com.student.rideyellow`

## 1. Enable the Android Maps SDK

1. Open [Google Cloud Console](https://console.cloud.google.com/) (same project as your Maps API key).
2. **APIs & Services** → **Library**.
3. Enable **Maps SDK for Android** (required for `react-native-maps` on APK).

## 2. Add your EAS release SHA-1 fingerprint

APK builds on EAS are signed with **Expo’s keystore**, not your PC’s debug keystore. If the key is restricted to “Android apps”, you must register **this** SHA-1.

### Get SHA-1 from Expo

```powershell
cd C:\Users\USER\UBERAPP
eas credentials -p android
```

Choose: **preview** (or the profile you used to build) → **Keystore** → copy **SHA-1 fingerprint**.

Or open: https://expo.dev/accounts/bolex/projects/uberapp/credentials → Android → Keystore.

### Add it in Google Cloud

1. **APIs & Services** → **Credentials** → your Maps API key.
2. **Application restrictions** → **Android apps**.
3. Add:
   - Package name: `com.student.rideyellow`
   - SHA-1: (from EAS, looks like `AA:BB:CC:...`)
4. **API restrictions** → restrict to **Maps SDK for Android** (recommended).
5. Save. Wait **5–15 minutes** for changes to apply.

## 3. Billing

Google Maps requires a billing account on the Cloud project (free tier still applies). Without billing, tiles may not load.

## 4. Rebuild only if the key was missing during build

If you built **before** `eas env:push`, rebuild:

```powershell
eas env:push --environment preview --path .env
eas build -p android --profile preview --clear-cache
```

Your preview environment already includes `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` on EAS.

## 5. Quick test (temporary)

To confirm restrictions are the issue, create a **second API key** with **no application restrictions**, enable Maps SDK for Android, push it to EAS, rebuild, and test. If the map works, re-apply Android + SHA-1 restrictions on the real key.

## 6. Device checks

- Location permission allowed for BoltRide.
- Google Play Services installed/updated (most phones).
- Internet connection active.
