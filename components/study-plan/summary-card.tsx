import type { LucideIcon } from "lucide-react";

export function SummaryCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="border-border bg-surface flex items-center gap-3 rounded-2xl border p-5">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-text-secondary text-xs font-medium">{label}</p>
        <p className="text-text-primary font-mono text-2xl font-bold">{value}</p>
        <p className="text-text-secondary text-xs">{hint}</p>
      </div>
    </div>
  );
}
