import { cn } from "@/lib/cn";

// Authored mark: a tall block and a low block (a tower and its annex) on a
// petrol tile, with one brass window. Drawn once here so the login page,
// sidebar and any future surface share the same glyph.
export function LogoMark({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect width="36" height="36" rx="10" fill="#1a566a" />
      <path d="M9 28V12.5a1.5 1.5 0 0 1 1.5-1.5H18a1.5 1.5 0 0 1 1.5 1.5V28H9Z" fill="#fff" />
      <path d="M21.5 28V18.5a1.5 1.5 0 0 1 1.5-1.5h2.5a1.5 1.5 0 0 1 1.5 1.5V28h-5.5Z" fill="#fff" fillOpacity="0.62" />
      <rect x="12.25" y="14.5" width="3" height="3" rx="0.75" fill="#d6a84e" />
      <rect x="12.25" y="20.5" width="3" height="2.5" rx="0.75" fill="#86bccb" />
      <path d="M7 28.75h22" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
