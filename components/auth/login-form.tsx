"use client";

import { useActionState } from "react";

import { signIn, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";

const initialState: AuthState = {};

export function LoginForm({ oauthError }: { oauthError?: string }) {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state.error ?? oauthError} />
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
        placeholder="••••••••"
        required
      />
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Logging in..." : "Log in"}
      </Button>
    </form>
  );
}
