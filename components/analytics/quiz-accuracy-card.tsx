import { AccuracyGauge } from "@/components/analytics/accuracy-gauge";

export function QuizAccuracyCard({ accuracyPercent }: { accuracyPercent: number }) {
  return (
    <div className="border-border bg-surface flex flex-col gap-1 rounded-2xl border p-5">
      <h2 className="text-text-primary text-sm font-semibold">Accuracy (All Quizzes)</h2>
      <div className="flex flex-1 flex-col items-center justify-center py-2">
        <AccuracyGauge percent={accuracyPercent} />
        <p className="text-text-secondary mt-1 text-xs">Average Accuracy</p>
      </div>
    </div>
  );
}
