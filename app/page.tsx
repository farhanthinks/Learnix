import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="bg-bg flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-text-primary text-4xl font-bold tracking-tight">Learnix</h1>
      <p className="text-text-secondary max-w-md text-lg">
        AI-powered study planning that turns your syllabus into a schedule you&apos;ll actually
        follow.
      </p>
      <Link href="/signup" className="w-auto">
        <Button className="w-auto px-6 py-3">Get Started</Button>
      </Link>
    </div>
  );
}
