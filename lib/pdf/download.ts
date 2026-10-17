"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

export async function downloadPdf(url: string, filename: string) {
  // PDFs are rendered by server Route Handlers, which a static GitHub Pages
  // demo doesn't have — the printable page's browser print/"save as PDF"
  // button still works.
  if (process.env.NEXT_PUBLIC_DEMO === "true") {
    alert("تحميل ملف PDF غير متاح في النسخة التجريبية — استخدم زر «طباعة / تصدير PDF» بدلًا منه.");
    return;
  }
  const idToken = await getFirebaseAuth().currentUser?.getIdToken();
  if (!idToken) throw new Error("Not signed in");

  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
  if (!res.ok) throw new Error(`PDF request failed (${res.status})`);

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}
