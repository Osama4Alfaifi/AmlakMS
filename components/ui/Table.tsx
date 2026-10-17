import { cn } from "@/lib/cn";
import { tr } from "@/lib/i18n/translate";
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 lg:-mx-5 lg:px-5">
      <table className={cn("w-full text-sm border-collapse", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("text-xs text-muted border-b border-border-strong/70", className)} {...props} />;
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border", className)} {...props} />;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "transition-colors duration-[var(--duration-quick)] ease-[var(--ease-out)] hover:bg-surface-sunken/70",
        className
      )}
      {...props}
    />
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("text-start font-semibold py-3 px-3 whitespace-nowrap", className)} {...props}>
      {tr(props.children)}
    </th>;
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("py-3.5 px-3 align-middle whitespace-nowrap", className)} {...props} />;
}
