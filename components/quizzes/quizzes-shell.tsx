"use client";

import { Award, ListChecks, Sparkles, Target } from "lucide-react";
import { useMemo, useState } from "react";

import {
  ContinuePracticeRow,
  type ContinuePracticeItem,
} from "@/components/quizzes/continue-practice-row";
import { MockTestCard, type MockTestCardData } from "@/components/quizzes/mock-test-card";
import {
  PreviousAttemptsTable,
  type PreviousAttemptData,
} from "@/components/quizzes/previous-attempts-table";
import { RecommendedQuizCard } from "@/components/quizzes/recommended-quiz-card";
import {
  SubjectQuizCard,
  type SubjectQuizLibraryData,
} from "@/components/quizzes/subject-quiz-card";
import { SummaryCard } from "@/components/study-plan/summary-card";
import {
  emptyQuizFilters,
  QuizzesFilterMenu,
  type QuizFilters,
} from "@/components/quizzes/quizzes-filter-menu";
import type { RecommendedQuiz } from "@/lib/quizzes/recommend";
import type { TopicDifficulty } from "@/types/database";

export interface QuizzesSummary {
  available: number;
  completed: number;
  averagePercentage: number | null;
  bestPercentage: number | null;
}

function matchesSearch(fields: string[], query: string): boolean {
  if (!query) return true;
  return fields.some((f) => f.toLowerCase().includes(query));
}

function passesCommon(
  filters: QuizFilters,
  {
    subjectSlug,
    difficulty,
    topicId,
  }: { subjectSlug: string; difficulty: TopicDifficulty | null; topicId: string | null },
): boolean {
  if (filters.subjects.size > 0 && !filters.subjects.has(subjectSlug)) return false;
  if (filters.difficulties.size > 0 && (!difficulty || !filters.difficulties.has(difficulty)))
    return false;
  if (filters.topics.size > 0 && (!topicId || !filters.topics.has(topicId))) return false;
  return true;
}

export function QuizzesShell({
  summary,
  continuePractice,
  recommended,
  subjects,
  mockTests,
  previousAttempts,
  subjectOptions,
  topicOptions,
}: {
  summary: QuizzesSummary;
  continuePractice: ContinuePracticeItem[];
  recommended: RecommendedQuiz[];
  subjects: SubjectQuizLibraryData[];
  mockTests: MockTestCardData[];
  previousAttempts: PreviousAttemptData[];
  subjectOptions: { value: string; label: string }[];
  topicOptions: { value: string; label: string }[];
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<QuizFilters>(emptyQuizFilters());
  const query = search.trim().toLowerCase();

  const topicTypeVisible = filters.quizTypes.size === 0 || filters.quizTypes.has("topic");
  const mockTypeVisible = filters.quizTypes.size === 0 || filters.quizTypes.has("mock");

  const visibleRecommended = useMemo(() => {
    if (!topicTypeVisible) return [];
    return recommended.filter(
      (r) =>
        passesCommon(filters, {
          subjectSlug: r.subjectSlug,
          difficulty: r.difficulty,
          topicId: r.topicId,
        }) && matchesSearch([r.topicTitle, r.subjectName], query),
    );
  }, [recommended, filters, query, topicTypeVisible]);

  const visibleSubjects = useMemo(() => {
    if (!topicTypeVisible) return [];
    return subjects
      .map((s) => ({
        ...s,
        topicQuizzes: s.topicQuizzes.filter(
          (t) =>
            passesCommon(filters, {
              subjectSlug: s.slug,
              difficulty: t.difficulty,
              topicId: t.topicId,
            }) && matchesSearch([t.topicTitle, s.name], query),
        ),
      }))
      .filter((s) => s.topicQuizzes.length > 0);
  }, [subjects, filters, query, topicTypeVisible]);

  const visibleMockTests = useMemo(() => {
    if (!mockTypeVisible || filters.topics.size > 0 || filters.difficulties.size > 0) return [];
    return mockTests.filter(
      (m) =>
        (filters.subjects.size === 0 || filters.subjects.has(m.subjectSlug)) &&
        matchesSearch([m.subjectName], query),
    );
  }, [mockTests, filters, query, mockTypeVisible]);

  const visibleContinuePractice = useMemo(
    () => continuePractice.filter((c) => matchesSearch([c.quizTitle, c.subjectName], query)),
    [continuePractice, query],
  );

  const visiblePreviousAttempts = useMemo(
    () => previousAttempts.filter((a) => matchesSearch([a.quizTitle, a.subjectName], query)),
    [previousAttempts, query],
  );

  const hasAnyLibraryContent = subjects.length > 0 || mockTests.length > 0;
  const hasActiveNarrowing =
    query.length > 0 ||
    filters.subjects.size > 0 ||
    filters.difficulties.size > 0 ||
    filters.topics.size > 0 ||
    filters.quizTypes.size > 0;

  return (
    <div className="bg-bg mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-5 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-text-primary text-2xl font-semibold">Quizzes</h1>
          <p className="text-text-secondary text-sm">Practice smarter and test what you know.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes..."
            className="border-border bg-surface text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:ring-accent-primary w-64 rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
          />
          <QuizzesFilterMenu
            filters={filters}
            onChange={setFilters}
            subjectOptions={subjectOptions}
            topicOptions={topicOptions}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={ListChecks}
          iconClassName="bg-accent-primary/10 text-accent-primary"
          label="Quizzes Available"
          value={String(summary.available)}
          hint="Topic quizzes & mock tests"
        />
        <SummaryCard
          icon={Target}
          iconClassName="bg-accent-success/10 text-accent-success"
          label="Quizzes Completed"
          value={String(summary.completed)}
          hint="Attempts finished"
        />
        <SummaryCard
          icon={Sparkles}
          iconClassName="bg-accent-warning/10 text-accent-warning"
          label="Average Score"
          value={summary.averagePercentage !== null ? `${summary.averagePercentage}%` : "—"}
          hint="Across all attempts"
        />
        <SummaryCard
          icon={Award}
          iconClassName="bg-accent-primary/10 text-accent-primary"
          label="Best Score"
          value={summary.bestPercentage !== null ? `${summary.bestPercentage}%` : "—"}
          hint="Personal best"
        />
      </div>

      {visibleContinuePractice.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-text-primary text-sm font-semibold">Continue Practice</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleContinuePractice.map((item) => (
              <ContinuePracticeRow key={item.attemptId} item={item} />
            ))}
          </div>
        </section>
      )}

      {visibleRecommended.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-text-primary text-sm font-semibold">Recommended for You</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {visibleRecommended.map((r) => (
              <RecommendedQuizCard key={r.topicId} quiz={r} />
            ))}
          </div>
        </section>
      )}

      {!hasAnyLibraryContent ? (
        <div className="border-border bg-surface flex flex-col items-center gap-3 rounded-2xl border py-16 text-center">
          <Target className="text-text-secondary h-8 w-8" strokeWidth={1.5} />
          <div>
            <p className="text-text-primary text-sm font-semibold">No quizzes yet</p>
            <p className="text-text-secondary mt-1 text-sm">
              Add a subject and its syllabus to start generating practice quizzes.
            </p>
          </div>
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-text-primary text-sm font-semibold">Subject Quiz Library</h2>
            {visibleSubjects.length === 0 ? (
              <p className="text-text-secondary py-6 text-center text-sm">
                {hasActiveNarrowing
                  ? "No topic quizzes match your search or filters."
                  : "No topic quizzes yet."}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {visibleSubjects.map((s) => (
                  <SubjectQuizCard key={s.slug} subject={s} />
                ))}
              </div>
            )}
          </section>

          {mockTests.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-text-primary text-sm font-semibold">Mock Tests</h2>
              {visibleMockTests.length === 0 ? (
                <p className="text-text-secondary py-6 text-center text-sm">
                  No mock tests match your search or filters.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleMockTests.map((m) => (
                    <MockTestCard key={m.subjectId} test={m} />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-text-primary text-sm font-semibold">Previous Attempts</h2>
        <PreviousAttemptsTable attempts={visiblePreviousAttempts} />
      </section>
    </div>
  );
}
