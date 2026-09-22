import { Flame } from "lucide-react";

import { Tile } from "@/components/dashboard/tile";

export function StudyStreakCard({
  currentStreak,
  bestStreak,
  className = "",
}: {
  currentStreak: number;
  bestStreak: number;
  className?: string;
}) {
  return (
    <Tile className={`flex flex-col items-center gap-2 text-center ${className}`} padding="p-6">
      <h3 className="text-text-secondary text-sm font-medium">Study Streak</h3>
      <span className="bg-accent-warning/10 flex h-9 w-9 items-center justify-center rounded-full">
        <Flame className="text-accent-warning h-5 w-5" strokeWidth={2} />
      </span>
      <p className="text-text-primary font-mono text-2xl font-bold">
        {currentStreak} {currentStreak === 1 ? "day" : "days"}
      </p>
      <p className="text-text-secondary text-xs">Best: {bestStreak} days</p>
    </Tile>
  );
}
