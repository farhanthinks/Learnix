"use client";

import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  LayoutGrid,
  List,
  MoreVertical,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { DifficultyBadge } from "@/components/subjects/difficulty-badge";
import { estimateTopicMinutes } from "@/lib/topics/estimate";
import type { Topic, TopicDifficulty, TopicStatus } from "@/types/database";

interface UnitGroup {
  unitNo: number;
  unitTitle: string;
  topics: Topic[];
}

const UNIT_BADGE_COLORS = [
  "bg-accent-primary",
  "bg-indigo-600",
  "bg-sky-600",
  "bg-accent-warning",
  "bg-accent-success",
];

const STATUS_FILTER_OPTIONS: { value: "all" | TopicStatus; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Completed" },
];

const DIFFICULTY_FILTER_OPTIONS: { value: "all" | TopicDifficulty; label: string }[] = [
  { value: "all", label: "All Difficulty" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const ROWS_BEFORE_COLLAPSE = 5;

function formatHours(totalMinutes: number): string {
  const hours = totalMinutes / 60;
  return `${hours % 1 === 0 ? hours : hours.toFixed(1)} Hours`;
}

function groupByUnit(topics: Topic[]): UnitGroup[] {
  const groups = new Map<number, UnitGroup>();
  for (const topic of topics) {
    const unitNo = topic.unit_no ?? 0;
    if (!groups.has(unitNo)) {
      groups.set(unitNo, {
        unitNo,
        unitTitle: topic.unit_title || `Unit ${unitNo}`,
        topics: [],
      });
    }
    groups.get(unitNo)!.topics.push(topic);
  }
  return Array.from(groups.values()).sort((a, b) => a.unitNo - b.unitNo);
}

const STATUS_META: Record<
  TopicStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  done: { label: "Completed", icon: CheckCircle2, className: "text-accent-success" },
  in_progress: { label: "In Progress", icon: Clock3, className: "text-accent-primary" },
  pending: { label: "Not Started", icon: Circle, className: "text-text-secondary" },
};

const ACTION_LABEL: Record<TopicStatus, string> = {
  pending: "Start",
  in_progress: "Continue",
  done: "Review",
};

function StatusBadge({ status }: { status: TopicStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${meta.className}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {meta.label}
    </span>
  );
}

function TopicActionButton({
  subjectSlug,
  topicId,
  topicSlug,
  status,
  onStart,
}: {
  subjectSlug: string;
  topicId: string;
  topicSlug: string;
  status: TopicStatus;
  onStart: () => void;
}) {
  const router = useRouter();
  const href = `/dashboard/answer-book/${subjectSlug}/${topicSlug}`;

  if (status === "pending") {
    return (
      <button
        type="button"
        onClick={async () => {
          onStart();
          try {
            await fetch(`/api/topics/${topicId}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "in_progress" }),
            });
          } finally {
            router.push(href);
          }
        }}
        className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
      >
        Start
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 inline-flex w-auto items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
    >
      {ACTION_LABEL[status]}
    </Link>
  );
}

function TopicRowMenu({
  topicId,
  status,
  isOpen,
  onToggle,
  onChangeStatus,
}: {
  topicId: string;
  status: TopicStatus;
  isOpen: boolean;
  onToggle: () => void;
  onChangeStatus: (status: TopicStatus) => void;
}) {
  const options: { value: TopicStatus; label: string }[] = [
    { value: "pending", label: "Mark as Not Started" },
    { value: "in_progress", label: "Mark as In Progress" },
    { value: "done", label: "Mark as Completed" },
  ];

  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-label="Topic actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="text-text-secondary hover:bg-surface-raised hover:text-text-primary flex h-7 w-7 items-center justify-center rounded-md transition-colors"
      >
        <MoreVertical className="h-4 w-4" strokeWidth={2} />
      </button>
      {isOpen && (
        <div
          role="menu"
          data-topic-menu={topicId}
          className="border-border bg-surface absolute top-8 right-0 z-20 w-44 overflow-hidden rounded-lg border py-1 shadow-lg"
        >
          {options
            .filter((o) => o.value !== status)
            .map((o) => (
              <button
                key={o.value}
                type="button"
                role="menuitem"
                onClick={() => onChangeStatus(o.value)}
                className="text-text-secondary hover:bg-surface-raised hover:text-text-primary block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
              >
                {o.label}
              </button>
            ))}
        </div>
      )}
    </span>
  );
}

export function TopicsBoard({ subjectSlug, topics }: { subjectSlug: string; topics: Topic[] }) {
  const [statusById, setStatusById] = useState<Record<string, TopicStatus>>(() =>
    Object.fromEntries(topics.map((t) => [t.id, t.status])),
  );
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TopicStatus>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | TopicDifficulty>("all");
  const [view, setView] = useState<"list" | "grid">("list");
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(() => {
    const groups = groupByUnit(topics);
    const partial = groups.find((g) => {
      const done = g.topics.filter((t) => t.status === "done").length;
      return done > 0 && done < g.topics.length;
    });
    return new Set(partial ? [partial.unitNo] : []);
  });
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuId) return;
    function handlePointerDown(event: MouseEvent) {
      if (boardRef.current && !boardRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
        return;
      }
      const target = event.target as HTMLElement;
      if (!target.closest("[data-topic-menu]") && !target.closest("[aria-haspopup='menu']")) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openMenuId]);

  const allUnits = useMemo(() => groupByUnit(topics), [topics]);
  const trimmedSearch = search.trim().toLowerCase();
  const filtersActive =
    trimmedSearch.length > 0 ||
    unitFilter !== "all" ||
    statusFilter !== "all" ||
    difficultyFilter !== "all";

  function matchesFilters(topic: Topic): boolean {
    if (unitFilter !== "all" && (topic.unit_no ?? 0) !== unitFilter) return false;
    if (statusFilter !== "all" && statusById[topic.id] !== statusFilter) return false;
    if (difficultyFilter !== "all" && topic.difficulty !== difficultyFilter) return false;
    if (trimmedSearch && !topic.title.toLowerCase().includes(trimmedSearch)) return false;
    return true;
  }

  function setTopicStatus(topicId: string, status: TopicStatus) {
    const previous = statusById[topicId];
    setStatusById((prev) => ({ ...prev, [topicId]: status }));
    setOpenMenuId(null);
    fetch(`/api/topics/${topicId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {
      setStatusById((prev) => ({ ...prev, [topicId]: previous }));
    });
  }

  function toggleUnit(unitNo: number) {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitNo)) next.delete(unitNo);
      else next.add(unitNo);
      return next;
    });
  }

  if (topics.length === 0) {
    return <p className="text-text-secondary text-sm">No topics yet.</p>;
  }

  return (
    <div ref={boardRef} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="border-border bg-surface text-text-primary focus:border-accent-primary focus:ring-accent-primary rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:outline-none"
        >
          <option value="all">All Units</option>
          {allUnits.map((u) => (
            <option key={u.unitNo} value={u.unitNo}>
              Unit {u.unitNo}: {u.unitTitle}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | TopicStatus)}
          className="border-border bg-surface text-text-primary focus:border-accent-primary focus:ring-accent-primary rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:outline-none"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as "all" | TopicDifficulty)}
          className="border-border bg-surface text-text-primary focus:border-accent-primary focus:ring-accent-primary rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:outline-none"
        >
          {DIFFICULTY_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="relative ml-auto min-w-[180px] flex-1 sm:flex-none">
          <Search className="text-text-secondary pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics..."
            className="border-border bg-surface text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:ring-accent-primary w-full rounded-lg border py-1.5 pr-2.5 pl-8 text-xs focus:ring-1 focus:outline-none sm:w-56"
          />
        </div>

        <div className="border-border flex overflow-hidden rounded-lg border">
          <button
            type="button"
            aria-label="List view"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            className={`flex h-7 w-7 items-center justify-center transition-colors ${
              view === "list"
                ? "bg-accent-primary/10 text-accent-primary"
                : "text-text-secondary hover:bg-surface-raised"
            }`}
          >
            <List className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
            className={`border-border flex h-7 w-7 items-center justify-center border-l transition-colors ${
              view === "grid"
                ? "bg-accent-primary/10 text-accent-primary"
                : "text-text-secondary hover:bg-surface-raised"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="border-border divide-border flex flex-col divide-y overflow-hidden rounded-xl border">
        {allUnits.map((unit, index) => {
          const unitFiltered = unit.topics.filter(matchesFilters);
          if (filtersActive && unitFiltered.length === 0) return null;

          const displayTopics = filtersActive ? unitFiltered : unit.topics;
          const doneCount = unit.topics.filter((t) => statusById[t.id] === "done").length;
          const percent =
            unit.topics.length === 0 ? 0 : Math.round((doneCount / unit.topics.length) * 100);
          const isExpanded = filtersActive || expandedUnits.has(unit.unitNo);
          const showAll = expandedRows.has(unit.unitNo);
          const visibleTopics =
            showAll || filtersActive ? displayTopics : displayTopics.slice(0, ROWS_BEFORE_COLLAPSE);
          const totalMinutes = unit.topics.reduce((sum, t) => sum + estimateTopicMinutes(t), 0);
          const badgeColor = UNIT_BADGE_COLORS[index % UNIT_BADGE_COLORS.length];

          return (
            <div key={unit.unitNo} className="bg-surface">
              <button
                type="button"
                onClick={() => toggleUnit(unit.unitNo)}
                className="hover:bg-surface-raised flex w-full items-center gap-4 px-4 py-3 text-left transition-colors"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${badgeColor}`}
                >
                  {unit.unitNo}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-text-primary block truncate text-sm font-semibold">
                    {unit.unitTitle}
                  </span>
                  <span className="text-text-secondary text-xs">
                    {unit.topics.length} Topics · {formatHours(totalMinutes)}
                  </span>
                </span>
                <span className="hidden items-center gap-2 sm:flex">
                  <span className="bg-border h-1.5 w-32 overflow-hidden rounded-full">
                    <span
                      className="bg-accent-primary block h-full rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="text-text-secondary w-28 text-right text-xs">
                    {doneCount} / {unit.topics.length} Completed
                  </span>
                  <span
                    className={`w-10 text-right text-xs font-semibold ${
                      percent === 100 ? "text-accent-success" : "text-text-primary"
                    }`}
                  >
                    {percent}%
                  </span>
                </span>
                <ChevronDown
                  className={`text-text-secondary h-4 w-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  strokeWidth={2}
                />
              </button>

              {isExpanded &&
                (view === "list" ? (
                  <div className="overflow-x-auto px-4 pb-4">
                    <table className="w-full min-w-[560px] border-collapse text-sm">
                      <thead>
                        <tr className="text-text-secondary border-border border-b text-left text-xs font-medium">
                          <th className="py-1.5 pr-2 font-medium">Topic</th>
                          <th className="px-2 py-1.5 font-medium">Difficulty</th>
                          <th className="px-2 py-1.5 font-medium">Est. Time</th>
                          <th className="px-2 py-1.5 font-medium">Status</th>
                          <th className="py-1.5 pl-2 text-right font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-border divide-y">
                        {visibleTopics.map((topic) => {
                          const status = statusById[topic.id];
                          return (
                            <tr key={topic.id} className="text-sm">
                              <td className="py-2 pr-2">
                                <Link
                                  href={`/dashboard/answer-book/${subjectSlug}/${topic.slug}`}
                                  className="text-text-primary hover:text-accent-primary font-medium"
                                >
                                  {topic.title}
                                </Link>
                              </td>
                              <td className="px-2 py-2">
                                <DifficultyBadge difficulty={topic.difficulty} />
                              </td>
                              <td className="text-text-secondary px-2 py-2 text-xs">
                                {estimateTopicMinutes(topic)} min
                              </td>
                              <td className="px-2 py-2">
                                <StatusBadge status={status} />
                              </td>
                              <td className="py-2 pl-2">
                                <div className="flex items-center justify-end gap-1">
                                  <TopicActionButton
                                    subjectSlug={subjectSlug}
                                    topicId={topic.id}
                                    topicSlug={topic.slug}
                                    status={status}
                                    onStart={() => setTopicStatus(topic.id, "in_progress")}
                                  />
                                  <TopicRowMenu
                                    topicId={topic.id}
                                    status={status}
                                    isOpen={openMenuId === topic.id}
                                    onToggle={() =>
                                      setOpenMenuId((cur) => (cur === topic.id ? null : topic.id))
                                    }
                                    onChangeStatus={(s) => setTopicStatus(topic.id, s)}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {!filtersActive && displayTopics.length > ROWS_BEFORE_COLLAPSE && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRows((prev) => {
                            const next = new Set(prev);
                            if (showAll) next.delete(unit.unitNo);
                            else next.add(unit.unitNo);
                            return next;
                          })
                        }
                        className="text-accent-primary mt-2 block w-full text-center text-xs font-medium hover:underline"
                      >
                        {showAll ? "Show less ↑" : `View all ${displayTopics.length} topics →`}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleTopics.map((topic) => {
                      const status = statusById[topic.id];
                      return (
                        <div
                          key={topic.id}
                          className="border-border flex flex-col gap-2 rounded-lg border p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/dashboard/answer-book/${subjectSlug}/${topic.slug}`}
                              className="text-text-primary hover:text-accent-primary text-sm font-medium"
                            >
                              {topic.title}
                            </Link>
                            <TopicRowMenu
                              topicId={topic.id}
                              status={status}
                              isOpen={openMenuId === topic.id}
                              onToggle={() =>
                                setOpenMenuId((cur) => (cur === topic.id ? null : topic.id))
                              }
                              onChangeStatus={(s) => setTopicStatus(topic.id, s)}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <DifficultyBadge difficulty={topic.difficulty} />
                            <span className="text-text-secondary text-xs">
                              {estimateTopicMinutes(topic)} min
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <StatusBadge status={status} />
                            <TopicActionButton
                              subjectSlug={subjectSlug}
                              topicId={topic.id}
                              topicSlug={topic.slug}
                              status={status}
                              onStart={() => setTopicStatus(topic.id, "in_progress")}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {!filtersActive && displayTopics.length > ROWS_BEFORE_COLLAPSE && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRows((prev) => {
                            const next = new Set(prev);
                            if (showAll) next.delete(unit.unitNo);
                            else next.add(unit.unitNo);
                            return next;
                          })
                        }
                        className="text-accent-primary col-span-full text-center text-xs font-medium hover:underline"
                      >
                        {showAll ? "Show less ↑" : `View all ${displayTopics.length} topics →`}
                      </button>
                    )}
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
