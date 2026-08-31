/**
 * The document page-layout standard: A4 portrait, 18 mm of margin on every
 * side, on every page.
 *
 * The margin belongs to the PDF, not to the HTML. html2pdf slices one tall
 * canvas into pages, so padding written into the markup only ever appears at
 * the top of the first page and the bottom of the last — page two would start
 * hard against the paper edge. Passing the margin to html2pdf instead insets
 * every page identically, which is what "consistent across all pages" needs.
 *
 * The consequence is that a template's own outer padding has to be cleared at
 * print time (see `clearPagePadding`), or the two stack into a ~30 mm margin.
 */

export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;
export const PAGE_MARGIN_MM = 18;

/** The printable box inside the margins: 174 × 261 mm. */
export const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - PAGE_MARGIN_MM * 2;
export const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - PAGE_MARGIN_MM * 2;

/**
 * Height-to-width ratio of the printable box. Rendered content is scaled to
 * the content width, so this — not the paper's own 297/210 — converts a
 * measured pixel width into the pixel height of one page.
 */
export const CONTENT_ASPECT = CONTENT_HEIGHT_MM / CONTENT_WIDTH_MM;

/** html2pdf settings implementing the standard. `extra` adds per-document options. */
export function pdfOptions(filename: string, extra: Record<string, unknown> = {}) {
  return {
    // html2pdf takes [top, left, bottom, right] and applies it to every page.
    margin: [PAGE_MARGIN_MM, PAGE_MARGIN_MM, PAGE_MARGIN_MM, PAGE_MARGIN_MM],
    filename: `${filename}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 3, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    ...extra,
  };
}

/**
 * Mount a print copy off-screen at a fixed width so it can be measured and
 * rendered without the on-screen layout shifting under the user.
 */
export function mountForPrint(source: HTMLElement, width: number): HTMLElement {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-100000px",
    top: "0",
    width: `${width}px`,
    pointerEvents: "none",
    zIndex: "-1",
  });
  source.style.width = `${width}px`;
  source.style.maxWidth = "none";
  host.appendChild(source);
  document.body.appendChild(host);
  return host;
}

/**
 * Drop the page padding a document draws for itself, now that the PDF supplies
 * the margin. `keep` leaves an edge in place where the padding does more than
 * space the page — the Executive CV's left padding, for one, clears a
 * decorative stripe rather than framing the page.
 */
export function clearPagePadding(el: HTMLElement | null, keep = "0") {
  if (el) el.style.padding = keep;
}
