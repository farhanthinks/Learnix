import type { ExtractionStatus } from "@/types/database";

const EXTRACTION_LABELS: Record<Exclude<ExtractionStatus, "done">, string> = {
  pending: "Pending",
  processing: "Processing",
  failed: "Extraction failed",
};

export function SubjectStatusPill({
  extractionStatus,
  topicsDone,
  topicsTotal,
  daysUntilExam,
}: {
  extractionStatus: ExtractionStatus;
  topicsDone: number;
  topicsTotal: number;
  daysUntilExam: number | null;
}) {
  let label: string;
  let colorClass: string;

  if (extractionStatus !== "done") {
    label = EXTRACTION_LABELS[extractionStatus];
    colorClass =
      extractionStatus === "failed"
        ? "bg-accent-danger/15 text-accent-danger"
        : "bg-text-secondary/15 text-text-secondary";
  } else if (topicsTotal === 0) {
    label = "No topics";
    colorClass = "bg-text-secondary/15 text-text-secondary";
  } else if (topicsDone === 0) {
    label = "Not started";
    colorClass = "bg-text-secondary/15 text-text-secondary";
  } else if (topicsDone === topicsTotal) {
    label = "Completed";
    colorClass = "bg-accent-success/15 text-accent-success";
  } else if (daysUntilExam !== null && daysUntilExam <= 7) {
    label = "Exam soon";
    colorClass = "bg-accent-warning/15 text-accent-warning";
  } else {
    label = "In progress";
    colorClass = "bg-accent-primary/15 text-accent-primary";
  }

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${colorClass}`}
    >
      {label}
    </span>
  );
}
