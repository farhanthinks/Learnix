import { Bell } from "lucide-react";

import { AccountMenu } from "@/components/dashboard/account-menu";

export function TopBar({ initial, name, email }: { initial: string; name: string; email: string }) {
  return (
    <header className="border-border bg-surface flex items-center justify-end gap-4 border-b px-8 py-4">
      <button
        type="button"
        aria-label="Notifications"
        title="Notifications (coming soon)"
        className="text-text-secondary hover:bg-surface-raised hover:text-text-primary focus-visible:outline-accent-primary relative flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        <span className="bg-accent-primary absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full" />
      </button>
      <AccountMenu initial={initial} name={name} email={email} />
    </header>
  );
}
