import { LogOut } from "lucide-react";

import { signOut } from "@/lib/actions/auth";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-text-secondary hover:bg-surface-raised hover:text-accent-danger focus-visible:outline-accent-primary flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
        Logout
      </button>
    </form>
  );
}
