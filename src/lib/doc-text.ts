import { extractTextFromPdf } from "@/lib/pdf-extract";

// A .docx is a ZIP whose body lives in word/document.xml. We read that one
// entry with the browser's native DecompressionStream rather than pulling in a
// ZIP/Word dependency — the file layout below is all we need for it.
const ZIP_EOCD_SIG = 0x06054b50;
const ZIP_CENTRAL_SIG = 0x02014b50;
const ZIP_LOCAL_SIG = 0x04034b50;

function findEocd(view: DataView): number {
  // The end-of-central-directory record sits in the last 22 bytes plus up to
  // 64KB of trailing comment, so scan backwards from the end.
  const start = Math.max(0, view.byteLength - 22 - 0xffff);
  for (let i = view.byteLength - 22; i >= start; i--) {
    if (view.getUint32(i, true) === ZIP_EOCD_SIG) return i;
  }
  return -1;
}

async function inflate(data: Uint8Array, method: number): Promise<Uint8Array> {
  if (method === 0) return data; // stored
  if (method !== 8) throw new Error("unsupported compression");
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Word wraps every run in markup; paragraphs, tabs and breaks are the only
// structure worth keeping for a CV or job post.
function docXmlToText(xml: string): string {
  return xml
    .replace(/<w:tab\b[^>]*\/>/g, "\t")
    .replace(/<w:br\b[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractTextFromDocx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  const eocd = findEocd(view);
  if (eocd === -1) throw new Error("not a zip");
  const entries = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);

  for (let i = 0; i < entries; i++) {
    if (offset + 46 > view.byteLength || view.getUint32(offset, true) !== ZIP_CENTRAL_SIG) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLength));

    if (name === "word/document.xml") {
      if (compressedSize === 0xffffffff) throw new Error("zip64 unsupported");
      if (view.getUint32(localOffset, true) !== ZIP_LOCAL_SIG) throw new Error("bad local header");
      // Local headers carry their own name/extra lengths, which can differ from
      // the central directory's — the data starts after those.
      const dataStart =
        localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
      const raw = await inflate(bytes.subarray(dataStart, dataStart + compressedSize), method);
      return docXmlToText(new TextDecoder().decode(raw));
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  throw new Error("no document.xml");
}

/**
 * Read a CV or job description the user uploaded. PDFs go through pdf.js, Word
 * files through the .docx reader above, everything else is read as plain text.
 * Failures are thrown with wording that tells the user what to do instead.
 */
export async function readDocumentText(file: File): Promise<string> {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";

  if (extension === "pdf") return extractTextFromPdf(file);

  if (extension === "docx") {
    try {
      return await extractTextFromDocx(file);
    } catch {
      throw new Error("Could not read this Word file. Please save it as PDF and upload that instead.");
    }
  }

  // The legacy binary .doc format is not readable in the browser — reading it
  // as text would hand the AI a page of noise, so say so plainly.
  if (extension === "doc") {
    throw new Error("Old .doc files can't be read. Please save it as .docx or PDF and upload that instead.");
  }

  return file.text();
}
