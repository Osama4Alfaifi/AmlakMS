import type { CapacitorConfig } from "@capacitor/cli";

// The app has Next.js server routes (PDF generation, tenant-payments
// settle) alongside Firestore, so the WebView loads the live dev server
// remotely rather than a bundled static export — same as opening the site
// in a mobile browser, just inside a native shell.
//
// Pointed at this machine's real Wi-Fi LAN IP for physical-device testing
// (phone and PC must be on the same Wi-Fi, and `npm run dev` must be
// running here). Confirmed via `ipconfig` — the "Home" Wi-Fi adapter's
// IPv4 address, NOT the 26.x.x.x one (that's a Radmin VPN virtual
// adapter, unreachable from a phone on the real network). This IP must
// also be listed in next.config.ts's allowedDevOrigins, or the dev server
// 403s the JS chunks and the app looks "loaded" but nothing is clickable
// (see the hydration-failure investigation from this session). For the
// Android emulator instead, swap back to Android's fixed host alias
// "10.0.2.2" (https://developer.android.com/studio/run/emulator-networking).
const config: CapacitorConfig = {
  appId: "com.amlakms.app",
  appName: "أملاك MS",
  webDir: "www",
  server: {
    url: "http://192.168.100.13:3000",
    cleartext: true,
  },
};

export default config;
