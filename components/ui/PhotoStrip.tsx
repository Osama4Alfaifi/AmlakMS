"use client";

// Small thumbnails for photos stored as data URLs. A click opens the full image
// in a new tab through a blob URL, because browsers refuse to open data: URLs
// as top-level navigations.
function openPhoto(url: string) {
  const [meta, payload = ""] = url.split(",");
  const mime = /data:([^;]+)/.exec(meta)?.[1] ?? "image/jpeg";
  const bin = atob(payload);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  window.open(URL.createObjectURL(new Blob([bytes], { type: mime })), "_blank");
}

export function PhotoStrip({ photos, label = "صورة" }: { photos?: string[]; label?: string }) {
  if (!photos?.length) return null;
  return (
    <span className="mt-1.5 flex flex-wrap gap-1.5">
      {photos.map((p, i) => (
        <button
          key={i}
          type="button"
          onClick={() => openPhoto(p)}
          aria-label={`${label} ${i + 1}`}
          className="pressable h-11 w-11 overflow-hidden rounded-lg shadow-control"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p} alt="" className="h-full w-full object-cover" />
        </button>
      ))}
    </span>
  );
}
