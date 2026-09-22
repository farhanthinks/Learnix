"use client";

import { LogOut, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { signOut } from "@/lib/actions/auth";

export function AccountMenu({
  initial,
  name,
  email,
}: {
  initial: string;
  name: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="bg-accent-primary font-display focus-visible:outline-accent-primary flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white transition-[filter] duration-150 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="border-border bg-surface absolute top-11 right-0 z-20 w-56 overflow-hidden rounded-xl border shadow-lg"
        >
          <div className="border-border border-b px-4 py-3">
            <p className="text-text-primary truncate text-sm font-medium">{name}</p>
            <p className="text-text-secondary truncate text-xs">{email}</p>
          </div>
          <div className="flex flex-col gap-0.5 p-1.5">
            <Link
              href="/dashboard/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="text-text-secondary hover:bg-surface-raised hover:text-text-primary flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors"
            >
              <SettingsIcon className="h-[18px] w-[18px]" strokeWidth={2} />
              Settings
            </Link>
          </div>
          <div className="border-border border-t p-1.5">
            <form action={signOut}>
              <button
                type="submit"
                role="menuitem"
                className="text-text-secondary hover:bg-surface-raised hover:text-accent-danger flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
                Log out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
