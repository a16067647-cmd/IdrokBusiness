import type { CapacitorConfig } from "@capacitor/cli";

// The Android app is a native shell around the live web app, so it always
// shows the latest version without publishing a new APK.
const config: CapacitorConfig = {
  appId: "uz.idrok.business",
  appName: "Idrok Business",
  webDir: "capacitor-shell",
  backgroundColor: "#0B1022",
  server: {
    url: "https://idrok-business.onrender.com",
    cleartext: false,
    errorPath: "offline.html",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
