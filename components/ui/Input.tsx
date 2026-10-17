import { cn } from "@/lib/cn";
import { tr } from "@/lib/i18n/translate";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// Field chrome is shared so inputs, textareas and selects never drift apart.
// 44px tall on phones (16px text also stops iOS from zooming on focus).
const field =
  "w-full rounded-xl bg-surface px-3.5 text-base sm:text-sm text-foreground shadow-control outline-none " +
  "transition-[box-shadow,background-color] duration-[var(--duration-quick)] ease-[var(--ease-out)] " +
  "placeholder:text-muted/70 hover:shadow-[0_0_0_1px_var(--border-strong)] " +
  "focus:shadow-[0_0_0_1.5px_var(--brand-600),0_0_0_4px_rgb(31_106_128/0.14)] " +
  "disabled:bg-surface-sunken disabled:text-muted disabled:cursor-not-allowed";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, "min-h-11 sm:min-h-10 py-2", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, "py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(field, "min-h-11 sm:min-h-10 py-2", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-xs font-semibold text-foreground/70 mb-1.5", className)} {...props}>
      {tr(props.children)}
    </label>;
}
