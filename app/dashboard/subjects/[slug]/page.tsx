import { BookOpen, FileText, Target } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BulkGenerateButton } from "@/components/subjects/bulk-generate-button";
import { DeleteSubjectButton } from "@/components/subjects/delete-subject-button";
import { ExportIcsButton } from "@/components/subjects/export-ics-button";
import { GeneratePlanButton } from "@/components/subjects/generate-plan-button";
import { ProgressBar } from "@/components/subjects/progress-bar";
import { ReextractButton } from "@/components/subjects/reextract-button";
import { SubjectSlotCard } from "@/components/subjects/subject-slot-card";
import { TopicsBoard } from "@/components/subjects/topics-board";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
export default async function SubjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: subject } = await supabase.from("subjects").select("*").eq("slug", slug).single();
  if (!subject) {
    notFound();
  }

  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .eq("subject_id", subject.id)
    .order("unit_no", { ascending: true })
    .order("created_at", { ascending: true });

  const { count: planCount } = await supabase
    .from("study_plans")
    .select("id", { count: "exact", head: true })
    .eq("subject_id", subject.id);

  const topicIds = (topics ?? []).map((t) => t.id);
  const [notesRes, quizzesRes] = await Promise.all([
    topicIds.length > 0
      ? supabase.from("topic_notes").select("topic_id").in("topic_id", topicIds)
      : Promise.resolve({ data: [] as { topic_id: string }[] }),
    topicIds.length > 0
      ? supabase.from("quizzes").select("topic_id").in("topic_id", topicIds)
      : Promise.resolve({ data: [] as { topic_id: string }[] }),
  ]);

  const topicIdsWithNotes = new Set((notesRes.data ?? []).map((n) => n.topic_id));
  const topicIdsWithQuizzes = new Set((quizzesRes.data ?? []).map((q) => q.topic_id));
  const topicIdsMissingNotes = topicIds.filter((tid) => !topicIdsWithNotes.has(tid));
  const topicIdsMissingQuizzes = topicIds.filter((tid) => !topicIdsWithQuizzes.has(tid));

  const topicCount = topics?.length ?? 0;
  const doneCount = topics?.filter((t) => t.status === "done").length ?? 0;
  const hasExistingPlan = (planCount ?? 0) > 0;

  let disabledReason: string | undefined;
  if (!subject.exam_date) {
    disabledReason = "Set an exam date to generate a plan.";
  } else if (topicCount === 0) {
    disabledReason = "Extract topics from a syllabus first.";
  } else if (!subject.slot_start_time || !subject.slot_end_time || !subject.slot_days?.length) {
    disabledReason = "Set a daily study time slot for this subject before generating a plan.";
  }

  return (
    <div className="bg-bg mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-8">
      <Link
        href="/dashboard/subjects"
        className="text-accent-primary inline-flex w-fit items-center gap-1 text-sm font-medium hover:underline"
      >
        ← Back to Subjects
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-accent-primary/10 text-accent-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
            <BookOpen className="h-6 w-6" strokeWidth={2} />
          </span>
          <div>
            <h1 className="font-display text-text-primary text-xl font-semibold">{subject.name}</h1>
            {subject.exam_date && (
              <p className="text-text-secondary text-sm">
                Exam date: {formatDate(subject.exam_date)}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <ReextractButton subjectId={subject.id} />
            <GeneratePlanButton
              subjectId={subject.id}
              hasExistingPlan={hasExistingPlan}
              disabledReason={disabledReason}
            />
            <ExportIcsButton
              href={`/api/export/ics?subject_id=${subject.id}`}
              label="Export to Calendar"
              disabledReason={hasExistingPlan ? undefined : "Generate a study plan first"}
            />
            <DeleteSubjectButton
              subjectId={subject.id}
              subjectName={subject.name}
              redirectTo="/dashboard/subjects"
              className="border-border border"
            />
          </div>
          {hasExistingPlan && (
            <Link
              href="/dashboard/study-plan"
              className="text-accent-primary text-sm font-medium hover:underline"
            >
              View study plan →
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <SubjectSlotCard
            subjectId={subject.id}
            slotStartTime={subject.slot_start_time}
            slotEndTime={subject.slot_end_time}
            slotDays={subject.slot_days}
          />
        </Card>

        {topicCount > 0 && (
          <Card className="flex flex-col justify-center gap-2">
            <h2 className="text-text-primary text-sm font-semibold">Overall Progress</h2>
            <ProgressBar done={doneCount} total={topicCount} />
          </Card>
        )}
      </div>

      {subject.extraction_status === "processing" && (
        <div className="bg-accent-primary/10 text-accent-primary rounded-lg px-4 py-3 text-sm">
          Processing your syllabus...
        </div>
      )}

      {subject.extraction_status === "failed" && subject.extraction_error && (
        <div
          role="alert"
          className="bg-accent-danger/10 text-accent-danger rounded-lg px-4 py-3 text-sm"
        >
          {subject.extraction_error}
        </div>
      )}

      {subject.extraction_warning && (
        <div className="bg-accent-warning/10 text-accent-warning rounded-lg px-4 py-3 text-sm">
          {subject.extraction_warning}
        </div>
      )}

      {topicCount === 0 && subject.extraction_status === "done" && (
        <Card className="text-text-secondary text-sm">
          No topics were extracted from this syllabus.
        </Card>
      )}

      {topicCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <BulkGenerateButton
            label="Generate All Notes"
            icon={<FileText className="h-3.5 w-3.5" strokeWidth={2} />}
            topicIds={topicIdsMissingNotes}
            endpointKind="notes"
          />
          <BulkGenerateButton
            label="Generate All Quizzes"
            icon={<Target className="h-3.5 w-3.5" strokeWidth={2} />}
            topicIds={topicIdsMissingQuizzes}
            endpointKind="quiz"
          />
        </div>
      )}

      <TopicsBoard subjectSlug={subject.slug} topics={topics ?? []} />
    </div>
  );
}
