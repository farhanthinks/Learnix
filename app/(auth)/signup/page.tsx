import Link from "next/link";

import { Card } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";
import { GoogleButton } from "@/components/auth/google-button";

export default function SignupPage() {
  return (
    <Card className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-text-primary text-xl font-semibold">
          Create your account
        </h1>
        <p className="text-text-secondary mt-1 text-sm">Start planning your study schedule.</p>
      </div>
      <SignupForm />
      <div className="text-text-secondary flex items-center gap-3 text-xs">
        <div className="bg-border h-px flex-1" />
        or
        <div className="bg-border h-px flex-1" />
      </div>
      <GoogleButton />
      <p className="text-text-secondary text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-primary font-medium hover:underline">
          Log in
        </Link>
      </p>
    </Card>
  );
}
