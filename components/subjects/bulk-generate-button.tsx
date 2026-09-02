"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";

export function BulkGenerateButton({
  label,
  icon,
  topicIds,
  endpointKind,
}: {
  label: string;
  icon?: ReactNode;
  topicIds: string[];
  endpointKind: "notes" | "quiz";
}) {
  const router = useRouter();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setProgress({ done: 0, total: topicIds.length });

    for (let i = 0; i < topicIds.length; i++) {
      try {
        const res = await fetch(`/api/topics/${topicIds[i]}/${endpointKind}`, { method: "POST" });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setError(
            `Stopped after ${i} of ${topicIds.length}: ${json.error ?? "generation failed."}`,
          );
          break;
        }
      } catch {
        setError(`Stopped after ${i} of ${topicIds.length}: network error.`);
        break;
      }
      setProgress({ done: i + 1, total: topicIds.length });
    }

    router.refresh();
  }

  if (topicIds.length === 0) return null;

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={progress !== null && progress.done < progress.total}
        className="w-auto gap-1.5 px-3 py-1.5 text-xs"
      >
        {icon}
        {progress && progress.done < progress.total
          ? `Generating ${progress.done + 1} of ${progress.total}...`
          : label}
      </Button>
      {error && <p className="text-accent-danger text-xs">{error}</p>}
    </div>
  );
}
