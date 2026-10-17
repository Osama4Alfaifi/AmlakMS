import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";
import { tr } from "@/lib/i18n/translate";

// Elevation is a layered shadow (ring + soft drop), not a border: the border
// colour stays reserved for structure inside the card.
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-surface rounded-2xl shadow-card", className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 pb-0 lg:p-5 lg:pb-0", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-bold leading-snug text-foreground", className)} {...props}>
      {tr(props.children)}
    </h3>;
}

export function CardSubtitle({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs leading-relaxed text-muted mt-1 max-w-prose", className)} {...props}>
      {tr(props.children)}
    </p>;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 lg:p-5", className)} {...props} />;
}
