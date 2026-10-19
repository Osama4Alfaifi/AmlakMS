"use client";

// Opens a document link. Normal https links open in a new tab; files attached
// in-app are stored as data: URLs, which browsers refuse to open as top-level
// navigations, so those are turned into a temporary blob URL first.
function openDataUrl(url: string) {
  const [meta, payload = ""] = url.split(",");
  const mime = /data:([^;]+)/.exec(meta)?.[1] ?? "application/octet-stream";
  const bin = atob(payload);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  window.open(URL.createObjectURL(new Blob([bytes], { type: mime })), "_blank");
}

export function DocLink({ url, className, children }: { url: string; className?: string; children: React.ReactNode }) {
  if (!url.startsWith("data:")) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={() => openDataUrl(url)} className={className}>
      {children}
    </button>
  );
}
