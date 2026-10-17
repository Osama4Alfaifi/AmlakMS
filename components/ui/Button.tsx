import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-700 text-white shadow-control hover:bg-brand-800",
  secondary: "bg-brand-50 text-brand-800 hover:bg-brand-100",
  outline: "bg-surface text-foreground shadow-control hover:bg-surface-sunken",
  ghost: "text-foreground hover:bg-surface-sunken",
  danger: "bg-danger-600 text-white shadow-control hover:bg-danger-700",
};

// Radii are concentric with the cards they sit in (card 16px, control 12px).
// Touch targets reach 44px on phones, 40px on desktop.
const sizeClasses: Record<Size, string> = {
  sm: "min-h-9 text-xs px-3 gap-1.5 rounded-[10px] max-sm:min-h-10",
  md: "min-h-11 sm:min-h-10 text-sm px-4 gap-2 rounded-xl",
  lg: "min-h-12 text-base px-5 gap-2 rounded-xl",
};

const base =
  "pressable inline-flex items-center justify-center font-semibold select-none disabled:opacity-50 disabled:cursor-not-allowed";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={cn(base, variantClasses[variant], sizeClasses[size], className)} {...props} />;
}

interface LinkButtonProps {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

export function LinkButton({ href, variant = "primary", size = "md", className, children }: LinkButtonProps) {
  return (
    <Link href={href} className={cn(base, variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </Link>
  );
}
