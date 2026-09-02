import { ArrowRight, Download, Layers, ListChecks, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function ActionRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-surface-raised flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors"
    >
      <Icon className="text-accent-primary h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="text-text-primary flex-1 text-sm font-medium">{label}</span>
      <ArrowRight className="text-text-secondary h-3.5 w-3.5 shrink-0" strokeWidth={2} />
    </button>
  );
}

export function QuickActionsCard({
  onGenerateQuiz,
  onCreateFlashcards,
  onAddToStudyPlan,
  onDownloadNotes,
}: {
  onGenerateQuiz: () => void;
  onCreateFlashcards: () => void;
  onAddToStudyPlan: () => void;
  onDownloadNotes: () => void;
}) {
  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <h2 className="text-text-primary text-sm font-semibold">Quick Actions</h2>
      <div className="mt-2 flex flex-col gap-0.5">
        <ActionRow icon={Target} label="Generate Quiz" onClick={onGenerateQuiz} />
        <ActionRow icon={Layers} label="Create Flashcards" onClick={onCreateFlashcards} />
        <ActionRow icon={ListChecks} label="Add to Study Plan" onClick={onAddToStudyPlan} />
        <ActionRow icon={Download} label="Download Notes" onClick={onDownloadNotes} />
      </div>
    </div>
  );
}
