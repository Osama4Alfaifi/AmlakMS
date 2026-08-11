"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

export async function downloadPdf(url: string, filename: string) {
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
