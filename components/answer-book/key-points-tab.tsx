import { CheckCircle2 } from "lucide-react";

export function KeyPointsTab({ points }: { points: string[] }) {
  if (points.length === 0) {
    return <p className="text-text-secondary text-sm">No key points generated.</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
      {points.map((point, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <CheckCircle2 className="text-accent-primary mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="text-text-primary text-sm">{point}</span>
        </li>
      ))}
    </ul>
  );
}
