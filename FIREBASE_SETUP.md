# Firebase setup and how to run the app

## Commands (use lowercase `npm`)

PowerShell and npm expect lowercase: **`npm run dev`**, not `NPM RUN DEV` (that error means npm tried to run a command named `RUN`).

## Normal development: Expo Go + browser (no Firebase emulators)

1. Create a Firebase project and enable **Email/Password** auth and **Firestore** (see sections below).
2. Copy `.env.example` to `.env` and fill in your `EXPO_PUBLIC_FIREBASE_*` values from the Firebase console (Project settings → Your apps → Web app config).
3. From the project folder:

```bash
npm install
npm run dev
```

- **Expo Go on your phone:** scan the QR code in the terminal (same Wi‑Fi as your PC usually works). If it does not connect, try `npm run tunnel` and scan again.
- **Web in the browser:** with `npm run dev` running, press **`w`** in that terminal to open the web build, or run **`npm run web`** in a second terminal for a dedicated localhost URL (printed in the console).

You do **not** need Java or Firebase emulators for this workflow.

## Optional: local Firebase emulators (advanced / class labs)

Requires a **JDK** (Java 21+ recommended for future firebase-tools versions).

1. Add to `.env`: `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true`
2. Run:

```bash
npm run dev:emulators
```

3. Emulator UI: http://127.0.0.1:4000  
4. Demo accounts (after seed): see `constants/config.ts` → `demoAccounts`.

## 1. Create a Firebase project

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create a project (any name).
3. Analytics is optional for learning.

## 2. Register a Web app and env vars

1. Project settings → General → Your apps → Add app → **Web**.
2. Copy the config into `.env` as `EXPO_PUBLIC_FIREBASE_*` (see `.env.example`).

Alternatively you can paste values into `constants/config.ts` placeholders, but `.env` is preferred.

## 3. Enable Firebase Authentication

1. **Build → Authentication → Sign-in method**.
2. Enable **Email/Password**.

## 4. Create Firestore

1. **Build → Firestore Database** → Create database.
2. Use test rules only for local learning; tighten before any public release.

### Deploy security rules (required)

This repo’s rules live in `firestore.rules` and `storage.rules`. If you see **`Missing or insufficient permissions`** in Expo, the rules in Firebase Console are probably still the default “deny all” set.

```bash
npm run firebase:login
npm run firebase:deploy:rules
```

Project ID must match `.env` → `EXPO_PUBLIC_FIREBASE_PROJECT_ID` (default in `.firebaserc`: `bolexuber`).

## 5. Google Maps (native only)

For real maps on **Android/iOS**, enable Maps SDK in Google Cloud, create an API key, set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, and mirror the key in `app.json` under `ios.config.googleMapsApiKey` and `android.config.googleMaps.apiKey`. **Web** uses a map preview without this key.

## 6. Troubleshooting

- **Expo Go cannot connect:** same Wi‑Fi, or use `npm run tunnel`.
- **`npm run web` port in use:** the script picks 8081–8099; set `EXPO_DEV_PORT` / `EXPO_DEV_PORT_END` if needed.
- **Auth fails:** confirm `.env` matches your Firebase project and Email/Password is enabled.
- **`Missing or insufficient permissions`:** sign in first, then run `npm run firebase:deploy:rules` (see above).
