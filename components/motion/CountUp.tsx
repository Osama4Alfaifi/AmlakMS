"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const NUMBER_RE = /[\d٠-٩][\d٠-٩٬,٫.]*/;

function toNumber(raw: string): number {
  const latin = raw
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/[٬,]/g, "")
    .replace(/٫/g, ".");
  return Number(latin);
}

// Counts the first number inside an already-formatted string up from zero,
// keeping its prefix/suffix (currency sign, minus, units) and digit style
// (Arabic-Indic or Latin, grouped or not). The final text is always the
// original string, so server render, reduced motion and print are exact.
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      const match = NUMBER_RE.exec(value);
      if (!el || !match) return;
      const target = toNumber(match[0]);
      if (!Number.isFinite(target) || target <= 0 || Number.isInteger(target) === false) return;

      const prefix = value.slice(0, match.index);
      const suffix = value.slice(match.index + match[0].length);
      const arabic = /[٠-٩]/.test(match[0]);
      const grouped = /[٬,]/.test(match[0]);
      const fmt = new Intl.NumberFormat(arabic ? "ar-SA" : "en-US", {
        maximumFractionDigits: 0,
        useGrouping: grouped,
      });

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const state = { n: 0 };
        el.textContent = prefix + fmt.format(0) + suffix;
        gsap.to(state, {
          n: target,
          duration: 1.1,
          ease: "power3.out",
          delay: 0.15,
          onUpdate: () => {
            el.textContent = prefix + fmt.format(Math.round(state.n)) + suffix;
          },
          onComplete: () => {
            el.textContent = value;
          },
        });
      });
      return () => {
        mm.revert();
        el.textContent = value;
      };
    },
    { dependencies: [value], scope: ref }
  );

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
