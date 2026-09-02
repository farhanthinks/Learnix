import { Flame } from "lucide-react";

import { Tile } from "@/components/dashboard/tile";

// Streak tracking is explicitly out of scope until Part 8 (per the Part 5
// spec: "streak system is Part 8, don't build it now"). This card is a
// visual placeholder only — always 0, no streak computation wired up.
export function StudyStreakCard({ className = "" }: { className?: string }) {
  return (
    <Tile className={`flex flex-col items-center gap-2 text-center ${className}`} padding="p-6">
      <h3 className="text-text-secondary text-sm font-medium">Study Streak</h3>
      <Flame className="text-accent-warning h-6 w-6" strokeWidth={2} />
      <p className="text-text-primary font-mono text-3xl font-bold">0</p>
      <p className="text-text-secondary text-xs">days</p>
    </Tile>
  );
}
