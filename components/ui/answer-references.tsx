import { BookOpen } from "lucide-react";

export function AnswerReferences({ references }: { references: string[] }) {
  if (references.length === 0) return null;

  return (
    <div className="border-border/70 mt-3 border-t pt-2.5">
      <p className="text-text-secondary text-[11px] font-semibold tracking-wide uppercase">
        References
      </p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {references.map((ref, i) => (
          <li
            key={i}
            className="text-text-secondary inline-flex items-center gap-1.5 text-xs font-medium"
          >
            <BookOpen className="h-3 w-3 shrink-0" strokeWidth={2} />
            {ref}
          </li>
        ))}
      </ul>
    </div>
  );
}
