"use client";

import { resetDemo } from "@/lib/demo/store";

// Only rendered in the static GitHub Pages demo (NEXT_PUBLIC_DEMO=true — see
// app/layout.tsx). The demo's data lives in this browser's localStorage, so
// visitors need a way back to the pristine dataset.
export function DemoBadge() {
  return (
    <div className="no-print fixed bottom-3 start-3 z-[60] flex items-center gap-2 rounded-full border border-border bg-surface/95 px-3 py-1.5 text-xs shadow-md backdrop-blur">
      <span className="font-semibold text-brand-700">نسخة تجريبية</span>
      <span className="text-muted hidden sm:inline">· البيانات محفوظة في متصفحك فقط</span>
      <button
        type="button"
        className="font-semibold text-danger-700 hover:underline"
        onClick={() => {
          if (confirm("إعادة ضبط البيانات التجريبية إلى وضعها الأصلي؟")) {
            resetDemo();
            window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login/`;
          }
        }}
      >
        إعادة ضبط
      </button>
    </div>
  );
}
