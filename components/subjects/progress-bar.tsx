export function ProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">
          {done} of {total} topics completed
        </span>
        <span className="text-text-primary font-mono font-medium">{percent}%</span>
      </div>
      <div className="bg-border h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-accent-primary h-full rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
