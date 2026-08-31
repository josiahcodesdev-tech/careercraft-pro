import type { Template } from "@/components/cv-builder-form";
import { clearPagePadding } from "@/lib/page-geometry";

/**
 * The padding each CV template uses as its own page margin, which the PDF's
 * 18 mm now replaces. Templates absent from this map already draw to the page
 * edge (the banner and sidebar designs), so they have nothing to clear.
 * Executive keeps a left edge: that padding clears its decorative stripe
 * rather than framing the page.
 */
const PRINT_PAGE_PADDING: Partial<Record<Template, string>> = {
  classic: "0",
  minimal: "0",
  corporate: "0",
  executive: "0 0 0 14px",
};

/**
 * A template's outermost element. Every preview sets `font-family` on its root
 * and nowhere above it, so the first match in document order is the root.
 */
export function templateRootOf(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>("[style*='font-family']");
}

/** Hand the page margin over to the PDF for a CV about to be printed. */
export function clearTemplatePagePadding(printSource: HTMLElement, template: Template): void {
  clearPagePadding(templateRootOf(printSource), PRINT_PAGE_PADDING[template]);
}
