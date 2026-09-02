import { slugify } from "@/lib/slug";

export interface MarkdownHeading {
  id: string;
  text: string;
  depth: 2 | 3;
  /** 1-indexed source line — lets the renderer look the id up via the AST
   * node's own position instead of a mutable render-order counter. */
  line: number;
}

/**
 * Pulls "##"/"###" headings out of AI-generated markdown to build a real
 * table of contents — reflects whatever the model actually wrote, instead
 * of a hardcoded list that drifts from the content. IDs are deduplicated so
 * repeated heading text still gets distinct anchors.
 */
export function extractHeadings(markdown: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const usedIds = new Set<string>();
  const lines = markdown.split("\n");

  lines.forEach((line, index) => {
    const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!match) return;

    const depth = match[1].length as 2 | 3;
    const text = match[2].replace(/[*_`]/g, "").trim();
    if (!text) return;

    const base = slugify(text);
    let id = base;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${base}-${suffix}`;
      suffix++;
    }
    usedIds.add(id);

    headings.push({ id, text, depth, line: index + 1 });
  });

  return headings;
}
