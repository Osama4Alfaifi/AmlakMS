"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const TRIGGER_DISTANCE = 70;
const MAX_PULL = 110;

// Pull-down-to-refresh for touch devices. The Android app is a plain WebView
// wrapper around this same site (see capacitor.config.ts), so this single
// implementation covers both the mobile browser and the app — no native
// plugin needed. Only engages when the page is already scrolled to the very
// top (checked continuously during the drag, not just at touchstart, so it
// bails cleanly if content scrolls under the finger mid-gesture); a normal
// downward scroll from anywhere else is untouched. No-op on desktop, since
// touch events never fire there. Registers listeners once (empty deps) and
// tracks the live drag distance in refs so the touchmove handler always
// sees the current value without needing to re-bind on every frame.
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (refreshingRef.current || window.scrollY > 0) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
    }
    function onTouchMove(e: TouchEvent) {
      if (startY.current == null || refreshingRef.current) return;
      if (window.scrollY > 0) {
        startY.current = null;
        pullRef.current = 0;
        setPull(0);
        return;
      }
      const delta = e.touches[0].clientY - startY.current;
      const next = delta > 0 ? Math.min(delta * 0.5, MAX_PULL) : 0;
      pullRef.current = next;
      setPull(next);
    }
    function onTouchEnd() {
      if (startY.current == null) return;
      startY.current = null;
      if (pullRef.current >= TRIGGER_DISTANCE) {
        refreshingRef.current = true;
        setRefreshing(true);
        window.location.reload();
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    }
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <>
      <div
        className="flex items-center justify-center overflow-hidden text-muted transition-[height] duration-150"
        style={{ height: pull }}
      >
        <RefreshCw size={20} className={refreshing || pull >= TRIGGER_DISTANCE ? "animate-spin" : ""} />
      </div>
      {children}
    </>
  );
}
