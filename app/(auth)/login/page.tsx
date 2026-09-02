import Link from "next/link";

import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Card className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-text-primary text-xl font-semibold">Log in to Learnix</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Welcome back. Let&apos;s get you studying.
        </p>
      </div>
      <LoginForm oauthError={error} />
      <div className="text-text-secondary flex items-center gap-3 text-xs">
        <div className="bg-border h-px flex-1" />
        or
        <div className="bg-border h-px flex-1" />
      </div>
      <GoogleButton />
      <p className="text-text-secondary text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-accent-primary font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </Card>
  );
}
