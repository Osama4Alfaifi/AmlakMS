import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
