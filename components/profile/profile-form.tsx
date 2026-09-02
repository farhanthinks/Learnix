"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { updateProfile, type ProfileState } from "@/lib/actions/profile";

const initialState: ProfileState = {};

export function ProfileForm({ fullName, collegeName }: { fullName: string; collegeName: string }) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormError message={state.error} />
      {state.success && (
        <p
          role="status"
          className="bg-accent-success/10 text-accent-success rounded-lg px-3 py-2 text-sm"
        >
          Profile saved.
        </p>
      )}

      <Input id="fullName" name="fullName" label="Full name" defaultValue={fullName} required />
      <Input
        id="collegeName"
        name="collegeName"
        label="College / institution (optional)"
        defaultValue={collegeName}
      />

      <Button type="submit" disabled={isPending} className="w-auto px-6">
        {isPending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
