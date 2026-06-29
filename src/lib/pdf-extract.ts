export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@6.1.200/legacy/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as Array<Record<string, unknown>>;

    // Group items by Y position (line), then sort left-to-right within each line
    const lineMap = new Map<number, { x: number; text: string }[]>();

    for (const item of items) {
      const str = typeof item.str === "string" ? item.str : "";
      if (!str) continue;
      const transform = item.transform as number[] | undefined;
      if (!transform) continue;

      const x = Math.round(transform[4]);
      const y = Math.round(transform[5]);

      // Bucket Y values — items within 4px are on the same line
      let bucketY = y;
      for (const existingY of lineMap.keys()) {
        if (Math.abs(existingY - y) <= 4) {
          bucketY = existingY;
          break;
        }
      }

      if (!lineMap.has(bucketY)) lineMap.set(bucketY, []);
      lineMap.get(bucketY)!.push({ x, text: str });
    }

    // Sort lines top-to-bottom (higher Y = higher on page in PDF coords)
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);

    const pageLines: string[] = [];
    for (const y of sortedYs) {
      const chunks = lineMap.get(y)!.sort((a, b) => a.x - b.x);

      // Join chunks — add space between unless they're touching
      let line = "";
      let lastEnd = 0;
      for (const chunk of chunks) {
        if (line && chunk.x > lastEnd + 5) {
          line += " ";
        }
        line += chunk.text;
        lastEnd = chunk.x + chunk.text.length * 5; // rough char width
      }

      const trimmed = line.trim();
      if (trimmed) pageLines.push(trimmed);
    }

    pages.push(pageLines.join("\n"));
  }

  return pages.join("\n\n");
}
