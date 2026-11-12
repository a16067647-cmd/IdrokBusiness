# Android app

The Android app is a Capacitor shell around the live web app
(`https://idrok-business.onrender.com`, set in `capacitor.config.ts`).
It always shows the latest web version, so most updates need no new APK.
`capacitor-shell/offline.html` is shown when there is no internet.

## Build a signed APK

Requirements: Node 22, JDK 21, Android SDK (platform 36, build-tools 36).

```bash
npm ci
npx cap sync android
cd android
echo "sdk.dir=/path/to/android-sdk" > local.properties
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=/path/to/idrok-business-release.jks \
  -Pandroid.injected.signing.store.password=STORE_PASSWORD \
  -Pandroid.injected.signing.key.alias=idrok \
  -Pandroid.injected.signing.key.password=KEY_PASSWORD
```

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`.

The signing key (`idrok-business-release.jks`) is **not** in this repository.
Keep it and its password safe: every future update, including on Google Play,
must be signed with the same key. Bump `versionCode` and `versionName` in
`android/app/build.gradle` for each release.
