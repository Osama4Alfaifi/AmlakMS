// Reads a deed (or similar) file the user attached, as a data URL small enough
// to live inside a Firestore document (hard limit 1 MiB per document). Images
// are downscaled and re-encoded; PDFs are stored as-is when small enough.
export const MAX_ATTACHMENT_BYTES = 650 * 1024;

export interface AttachedFile {
  name: string;
  dataUrl: string;
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function shrinkImage(file: File): Promise<string> {
  const src = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  for (const q of [0.8, 0.65, 0.5]) {
    const out = canvas.toDataURL("image/jpeg", q);
    if (out.length * 0.75 <= MAX_ATTACHMENT_BYTES) return out;
  }
  throw new Error("too-large");
}

// Photos attached to a maintenance request live inside the request document, so
// each one is shrunk hard: at most MAX_PHOTOS of ~PHOTO_BYTES keeps the document
// comfortably under Firestore's 1 MiB limit.
export const MAX_PHOTOS = 3;
export const PHOTO_BYTES = 200 * 1024;

export async function readPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("unsupported");
  const src = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  for (const [maxSide, quality] of [[1280, 0.7], [1100, 0.55], [900, 0.45], [720, 0.4]] as const) {
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = canvas.toDataURL("image/jpeg", quality);
    if (out.length * 0.75 <= PHOTO_BYTES) return out;
  }
  throw new Error("too-large");
}

// Throws Error("too-large") or Error("unsupported") for the caller to explain.
export async function readAttachment(file: File): Promise<AttachedFile> {
  if (file.type.startsWith("image/")) return { name: file.name, dataUrl: await shrinkImage(file) };
  if (file.type === "application/pdf") {
    if (file.size > MAX_ATTACHMENT_BYTES) throw new Error("too-large");
    return { name: file.name, dataUrl: await readAsDataUrl(file) };
  }
  throw new Error("unsupported");
}
