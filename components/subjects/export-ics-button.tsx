"use client";

import { useState } from "react";

export function ExportIcsButton({
  href,
  label,
  disabledReason,
}: {
  href: string;
  label: string;
  disabledReason?: string;
}) {
  const [exported, setExported] = useState(false);

  if (disabledReason) {
    return (
      <span
        title={disabledReason}
        className="border-border text-text-secondary inline-flex w-auto cursor-not-allowed items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
      >
        {label}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <a
        href={href}
        onClick={() => setExported(true)}
        className="border-border text-text-primary hover:bg-surface-raised focus-visible:outline-accent-primary inline-flex w-auto items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {label}
      </a>
      {exported && (
        <p className="text-text-secondary max-w-xs text-right text-xs">
          In Google Calendar: Settings → Import & Export → Import → select this file.
        </p>
      )}
    </div>
  );
}
