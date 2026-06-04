# Opens Expo credentials + prints Google Maps / SHA-1 setup steps.
$package = 'com.student.rideyellow'
$credentialsUrl = 'https://expo.dev/accounts/bolex/projects/uberapp/credentials'
$googleCredsUrl = 'https://console.cloud.google.com/apis/credentials'

Write-Host ''
Write-Host '=== BoltRide: Google Maps on APK ===' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Your EAS keystore is already fine (used to sign the APK).'
Write-Host 'You only need to register its SHA-1 with Google Cloud.'
Write-Host ''
Write-Host "Package name: $package"
Write-Host ''
Write-Host '1) Get SHA-1 from Expo (Android -> Keystore -> SHA-1 fingerprint):'
Write-Host "   $credentialsUrl"
Write-Host ''
Write-Host '2) In Google Cloud -> Credentials -> your Maps API key:'
Write-Host '   Application restrictions -> Android apps -> Add'
Write-Host "   Package: $package"
Write-Host '   SHA-1: (paste from Expo)'
Write-Host '   Enable API: Maps SDK for Android'
Write-Host ''
Write-Host "3) Then in .env set: EXPO_PUBLIC_USE_GOOGLE_MAPS_NATIVE=true"
Write-Host '   eas env:push --environment preview --path .env'
Write-Host '   eas build -p android --profile preview'
Write-Host ''
Write-Host 'Until then, the APK uses OpenStreetMap (no SHA-1 needed).'
Write-Host ''

Start-Process $credentialsUrl
Start-Process $googleCredsUrl
