"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

// The one authored entrance for every dashboard page: the page's top-level
// blocks rise into place in a short stagger. It runs once per page mount (the
// shell remounts per route), never on re-renders, and is skipped entirely
// when the visitor asks for reduced motion. Content is fully visible until
// GSAP takes over, and transform/opacity are cleared afterwards so nothing is
// left promoted to its own layer.
export function PageEnter({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let blocks = Array.from(root.children) as HTMLElement[];
        if (blocks.length === 1 && blocks[0].children.length > 1) {
          blocks = Array.from(blocks[0].children) as HTMLElement[];
        }
        if (!blocks.length) return;
        const visible = blocks.slice(0, 10);
        gsap.from(visible, {
          opacity: 0,
          y: 14,
          duration: 0.55,
          ease: "power3.out",
          stagger: 0.06,
          clearProps: "opacity,transform",
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}
