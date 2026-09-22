import { Clock } from "lucide-react";

import { Tile } from "@/components/dashboard/tile";

function formatHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export function StudyTimeWeekCard({
  minutes,
  className = "",
}: {
  minutes: number;
  className?: string;
}) {
  const avgPerDay = Math.round(minutes / 7);

  return (
    <Tile className={`flex flex-col items-center gap-2 text-center ${className}`} padding="p-6">
      <h3 className="text-text-secondary text-sm font-medium">Study Time (This Week)</h3>
      <div className="bg-accent-primary/10 flex h-9 w-9 items-center justify-center rounded-full">
        <Clock className="text-accent-primary h-5 w-5" strokeWidth={2} />
      </div>
      <p className="text-text-primary font-mono text-2xl font-bold">
        {formatHoursMinutes(minutes)}
      </p>
      <p className="text-text-secondary text-xs">Avg. {formatHoursMinutes(avgPerDay)}/day</p>
    </Tile>
  );
}
