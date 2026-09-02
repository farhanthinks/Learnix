"use client";

import { useMemo } from "react";
import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { extractHeadings } from "@/lib/answer-book/headings";

interface NodeWithPosition {
  position?: { start?: { line?: number } };
}

export function StudyNotesTab({ markdown }: { markdown: string }) {
  // Pure lookup from source line -> heading id, built once per markdown
  // change. react-markdown hands each element renderer the underlying AST
  // node (with its source position), so the id can be read off that instead
  // of a mutable "which heading am I" counter threaded through renders.
  const idByLine = useMemo(() => {
    const map = new Map<number, string>();
    for (const h of extractHeadings(markdown)) map.set(h.line, h.id);
    return map;
  }, [markdown]);

  function headingId(props: { node?: NodeWithPosition }): string | undefined {
    const line = props.node?.position?.start?.line;
    return line !== undefined ? idByLine.get(line) : undefined;
  }

  return (
    <div className="prose prose-sm prose-headings:font-display prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h2:mt-6 prose-h3:text-sm prose-strong:text-text-primary max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ node, ...rest }: ComponentPropsWithoutRef<"h2"> & { node?: NodeWithPosition }) => (
            <h2 id={headingId({ node })} {...rest} />
          ),
          h3: ({ node, ...rest }: ComponentPropsWithoutRef<"h3"> & { node?: NodeWithPosition }) => (
            <h3 id={headingId({ node })} {...rest} />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
