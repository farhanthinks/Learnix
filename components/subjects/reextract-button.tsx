"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ReextractButton({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    try {
      await fetch(`/api/subjects/${subjectId}/reextract`, { method: "POST" });
    } finally {
      setIsPending(false);
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-auto px-4"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "Re-extracting..." : "Re-extract topics"}
    </Button>
  );
}
