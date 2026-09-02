"use client";

import { useEffect, useRef, useState } from "react";

import { formatDateISO } from "@/lib/calendar/session";

export function ReschedulePopover({
  currentDate,
  onReschedule,
  onClose,
}: {
  currentDate: string;
  onReschedule: (newDate: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentDate);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Reschedule session"
      className="border-border bg-surface absolute top-8 right-0 z-30 flex w-56 flex-col gap-2 rounded-lg border p-3 shadow-lg"
    >
      <label htmlFor="reschedule-date" className="text-text-secondary text-xs font-medium">
        Move to
      </label>
      <input
        id="reschedule-date"
        type="date"
        value={value}
        min={formatDateISO(new Date())}
        onChange={(e) => setValue(e.target.value)}
        className="border-border bg-surface text-text-primary rounded-md border px-2 py-1.5 text-sm"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary px-2 py-1 text-xs font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!value}
          onClick={() => value && onReschedule(value)}
          className="bg-accent-primary rounded-md px-2.5 py-1 text-xs font-medium text-white hover:brightness-110 disabled:opacity-50"
        >
          Move
        </button>
      </div>
    </div>
  );
}
