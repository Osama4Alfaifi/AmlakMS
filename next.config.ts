import type { NextConfig } from "next";

// `npm run build:demo` (scripts/build-demo.mjs) builds a fully static copy of
// the app for GitHub Pages: no Firebase, no server routes — the firebase/*
// imports are aliased to an in-browser backend (lib/demo) seeded from
// lib/mock-data.ts. Every other build/dev run is unaffected.
const isDemo = process.env.NEXT_PUBLIC_DEMO === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const demoConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  // Separate from `.next` so a demo build doesn't clobber a running dev server.
  distDir: ".next-demo",
  turbopack: {
    resolveAlias: {
      "firebase/app": "./lib/demo/app-shim.ts",
      "firebase/firestore": "./lib/demo/firestore-shim.ts",
      "firebase/auth": "./lib/demo/auth-shim.ts",
    },
  },
};

const nextConfig: NextConfig = isDemo
  ? demoConfig
  : {
      /* config options here */
      // 192.168.100.13 is this machine's real Wi-Fi LAN IP, for physical-device
      // testing (see capacitor.config.ts) — 26.165.100.0 looked like a LAN IP
      // but is actually a Radmin VPN virtual adapter address, unreachable from
      // a phone on the real home Wi-Fi. 10.0.2.2 is the Android emulator's
      // fixed alias for the host machine. Without the right IP here, the dev
      // server 403s asset requests from the Capacitor WebView, breaking
      // hydration entirely (looks "loaded" but nothing is clickable).
      allowedDevOrigins: ["192.168.100.13", "localhost", "127.0.0.1", "10.0.2.2"],
    };

export default nextConfig;
