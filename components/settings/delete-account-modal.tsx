"use client";

import { useActionState, useState } from "react";

import { deleteAccount, type AccountState } from "@/lib/actions/account";

const CONFIRMATION_PHRASE = "DELETE";

const initialState: AccountState = {};

export function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(deleteAccount, initialState);
  const [confirmation, setConfirmation] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={() => !isPending && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Delete account"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full max-w-sm rounded-2xl p-6 shadow-xl"
      >
        <h2 className="font-display text-text-primary text-lg font-semibold">
          Delete your account?
        </h2>
        <p className="text-text-secondary mt-2 text-sm">
          This permanently deletes your account and everything in it — subjects, topics, study
          notes, quizzes, quiz history, and your study plan. This can&apos;t be undone.
        </p>

        <form action={formAction} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="delete-confirmation"
              className="text-text-secondary text-xs font-medium"
            >
              Type <span className="text-text-primary font-semibold">{CONFIRMATION_PHRASE}</span> to
              confirm
            </label>
            <input
              id="delete-confirmation"
              name="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={isPending}
              autoComplete="off"
              className="border-border bg-surface text-text-primary focus:border-accent-danger focus:ring-accent-danger w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-60"
            />
          </div>

          {state.error && <p className="text-accent-danger text-sm">{state.error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || confirmation !== CONFIRMATION_PHRASE}
              className="bg-accent-danger inline-flex w-auto items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
