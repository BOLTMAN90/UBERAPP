# Over-the-air (OTA) updates for BoltRide

BoltRide uses **EAS Update** (`expo-updates`) so JavaScript/UI changes can reach phones **without** rebuilding the APK every time.

## One-time requirement: install an OTA-enabled APK

Your **previous APK** was built **without** OTA. It cannot receive updates.

Build **one** new APK with the OTA channel baked in:

```powershell
cd c:\Users\USER\UBERAPP
eas.cmd build -p android --profile preview
```

Install that APK on your phone. After this, you only need full rebuilds when you change **native** code (new native modules, SDK upgrades, new Android permissions, etc.).

## Push code changes to phones (after OTA APK is installed)

1. Commit and push to GitHub (optional, for backup).
2. Publish the update to Expo:

```powershell
npm.cmd run update:preview
```

Or with a message:

```powershell
eas.cmd update --channel preview --environment preview --message "Fix status bar and GPS"
```

3. **Close and reopen** the app on your phone (or wait for the automatic check on launch). The app downloads the new bundle and reloads.

## Channels

| Profile      | Channel      | Use case              |
|-------------|--------------|------------------------|
| `preview`   | `preview`    | Internal APK testing   |
| `production`| `production` | Live / store builds    |

The APK must be built with the **same channel** you publish updates to.

## What OTA can update

- Screens, hooks, services (React Native JavaScript)
- Status bar layout, location logic, wallet flows, etc.
- Most UI and business logic

## What still needs a new APK build

- Adding `expo-updates` itself (already done in this repo)
- New native dependencies
- `app.json` permission changes
- Expo SDK upgrades

## Runtime version

`runtimeVersion` uses the `appVersion` policy (`1.0.0` in `app.json`). When you change native code, bump `version` in `app.json` and run a new `eas build` before publishing OTA to that version.

## Troubleshooting

- **No update on phone:** Confirm you installed an APK built **after** OTA was added, with profile `preview`.
- **Wrong channel:** `eas update --channel preview` must match `eas.json` → `build.preview.channel`.
- **Still on old UI:** Force-close the app and open again. Check [expo.dev](https://expo.dev) → project → Updates for the latest publish.
