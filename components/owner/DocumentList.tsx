"use client";

import { ExternalLink, FileText } from "lucide-react";
import { DocLink } from "@/components/ui/DocLink";
import { useT } from "@/lib/i18n";
import { Badge } from "@/components/ui/Badge";
import type { DocumentLink } from "@/lib/types";

// Read-only list of document links. Owners cannot upload: the management team
// attaches documents to a property, unit or contract (app/admin/documents).
export function DocumentList({ documents, empty }: { documents: DocumentLink[]; empty?: string }) {
  const t = useT();
  if (documents.length === 0) {
    return <p className="py-3 text-sm text-muted">{empty ?? t("لا توجد مستندات حاليًا")}</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {documents.map((d) => (
        <li key={d.id} className="flex items-center gap-3 py-3">
          <span className="h-9 w-9 shrink-0 rounded-xl bg-brand-100 text-brand-700 grid place-items-center">
            <FileText size={17} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug truncate">{d.title}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <Badge>{d.category}</Badge>
              <span className="num">{d.createdAt}</span>
            </p>
          </div>
          <DocLink url={d.url} className="pressable inline-flex items-center gap-1.5 min-h-10 px-3 rounded-xl text-sm font-semibold text-brand-700 hover:bg-brand-100">
            <ExternalLink size={15} /> {t("فتح")}
          </DocLink>
        </li>
      ))}
    </ul>
  );
}
