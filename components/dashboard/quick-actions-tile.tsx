import { BarChart3, BookText, CalendarDays, MessageSquare } from "lucide-react";
import Link from "next/link";

import { Tile } from "@/components/dashboard/tile";

const ACTIONS = [
  { label: "Study Plan", href: "/dashboard/study-plan", icon: CalendarDays },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "AI Answer Book", href: "/dashboard/answer-book", icon: BookText },
  { label: "AI Assistant", href: "/dashboard/assistant", icon: MessageSquare },
];

export function QuickActionsTile({ className = "" }: { className?: string }) {
  return (
    <Tile className={className} padding="p-6">
      <h2 className="font-display text-text-primary text-base font-semibold">Quick Actions</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="border-border hover:border-accent-primary hover:bg-accent-primary/5 focus-visible:outline-accent-primary flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="bg-accent-primary/10 flex h-9 w-9 items-center justify-center rounded-full">
                <Icon className="text-accent-primary h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <span className="text-text-primary text-xs font-medium">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </Tile>
  );
}
