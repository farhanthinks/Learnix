"use client";

import {
  BarChart3,
  BookOpen,
  BookText,
  CalendarDays,
  Home,
  MessageSquare,
  Settings,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/dashboard/logout-button";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: Home, exact: true },
  { label: "Subjects", href: "/dashboard/subjects", icon: BookOpen },
  { label: "Study Plan", href: "/dashboard/study-plan", icon: CalendarDays },
  { label: "Progress", href: "/dashboard/analytics", icon: TrendingUp },
  { label: "AI Answer Book", href: "/dashboard/answer-book", icon: BookText },
  { label: "Quizzes", href: "/dashboard/quizzes", icon: Target },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "AI Assistant", href: "/dashboard/assistant", icon: MessageSquare },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-border bg-surface flex w-56 shrink-0 flex-col justify-between border-r px-4 py-6">
      <div className="flex flex-col gap-8">
        <Link href="/dashboard" className="flex items-center gap-2 px-2">
          <BookOpen className="text-accent-primary h-6 w-6" strokeWidth={2} />
          <span className="font-display text-accent-primary text-lg font-bold">Learnix</span>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent-primary/10 text-accent-primary"
                    : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <LogoutButton />
    </aside>
  );
}
