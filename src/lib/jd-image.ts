// Client helpers for turning a job-description image (uploaded file or pasted
// from the clipboard) into text via the /api/jd-ocr vision endpoint. Shared by
// the CV Builder and CV Transform forms.

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.readAsDataURL(file);
  });
}

// OCR a JD image file into plain text. Throws with a user-facing message.
export async function ocrJdImage(file: File): Promise<string> {
  const image = await fileToDataUrl(file);
  const res = await fetch("/api/jd-ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  });
  const json = (await res.json()) as { text?: string; error?: string };
  if (!res.ok || !json.text) throw new Error(json.error ?? "Could not read the job description image.");
  return json.text;
}

// Pull the first image file out of a paste event's clipboard, or null if the
// paste contained no image (so normal text paste can proceed).
export function imageFromPaste(e: React.ClipboardEvent): File | null {
  const item = Array.from(e.clipboardData.items).find((it) => it.type.startsWith("image/"));
  return item ? item.getAsFile() : null;
}
