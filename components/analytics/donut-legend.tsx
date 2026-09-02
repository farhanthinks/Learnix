export interface LegendItem {
  label: string;
  value: string;
  color: string;
}

export function DonutLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-text-secondary flex min-w-0 items-center gap-2 truncate">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: item.color }}
              aria-hidden
            />
            <span className="truncate">{item.label}</span>
          </span>
          <span className="text-text-primary shrink-0 font-mono text-xs font-medium">
            {item.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
