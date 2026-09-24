import { BookOpen } from "lucide-react";

export function ReferencesTab({ references }: { references: string[] }) {
  if (references.length === 0) {
    return <p className="text-text-secondary text-sm">No references generated.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {references.map((ref, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <BookOpen className="text-accent-primary mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="text-text-primary text-sm">{ref}</span>
        </li>
      ))}
    </ul>
  );
}
