"use client";

import { useActionState } from "react";

import { signUp, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";

const initialState: AuthState = {};

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state.error} />
      <Input
        id="fullName"
        name="fullName"
        type="text"
        label="Full name"
        placeholder="Jane Doe"
        required
      />
      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="you@college.edu"
        required
      />
      <Input
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="At least 6 characters"
        minLength={6}
        required
      />
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
