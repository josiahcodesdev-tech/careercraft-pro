import type { Template } from "@/components/cv-builder-form";
import { clearPagePadding } from "@/lib/page-geometry";

/**
 * Padding kept when a CV is printed.
 *
 * A template's root padding is its page margin, and the PDF supplies that now,
 * so the default is to clear it outright — which is what makes a newly added
 * template comply without anyone remembering to list it here. Only a root
 * whose padding does something *besides* frame the page belongs in this map:
 * Executive's left padding clears the decorative stripe drawn at its edge, so
 * zeroing it would run the text over the stripe.
 */
const KEEP_PRINT_PADDING: Partial<Record<Template, string>> = {
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
  const templateRoot = templateRootOf(printSource);
  if (!templateRoot) {
    // Not fatal — the PDF still gets its 18 mm — but the template's own padding
    // would sit on top of it, so say so rather than shipping a fat margin.
    console.warn(`[print] no template root found for "${template}"; page padding left in place`);
    return;
  }
  clearPagePadding(templateRoot, KEEP_PRINT_PADDING[template]);
}

/**
 * Keep a section heading with the block that follows it, so a heading cannot
 * be left stranded at the foot of a page with its content overleaf.
 */
export function groupSectionsForPrint(root: HTMLElement): void {
  const headings = Array.from(root.querySelectorAll("h2"));
  for (const heading of headings) {
    const parent = heading.parentElement;
    if (!parent) continue;
    const firstContent = heading.nextElementSibling;
    const group = document.createElement("div");
    group.style.breakInside = "avoid";
    group.style.pageBreakInside = "avoid";
    parent.insertBefore(group, heading);
    group.appendChild(heading);
    if (firstContent && firstContent.tagName !== "H2") group.appendChild(firstContent);
  }
}
