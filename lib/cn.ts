import { twMerge } from "tailwind-merge";

// Resolves conflicting Tailwind utilities (e.g. a caller passing "w-36" to
// override a component's own "w-full") by cascade-safe last-one-wins
// precedence instead of leaving it to CSS source order — see the properties
// page header bug where an overridden Select width silently lost to the
// component's base w-full and pushed the CSV/Excel buttons off-screen.
export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(" "));
}
