import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="bg-bg mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <Link href="/dashboard/settings" className="text-accent-primary text-sm hover:underline">
        ← Settings
      </Link>
      <div className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-6">
        <div>
          <h1 className="font-display text-text-primary text-xl font-semibold">Terms of Service</h1>
          <p className="text-text-secondary mt-1 text-xs">
            Placeholder — replace with reviewed legal copy before launch.
          </p>
        </div>
        <div className="text-text-secondary flex flex-col gap-3 text-sm">
          <p>
            Learnix is a study-planning tool that uses AI to help you organize and revise syllabus
            content you upload. AI-generated notes, summaries, and quizzes may contain mistakes —
            always verify against your own course material before an exam.
          </p>
          <p>
            You&apos;re responsible for the content you upload. Don&apos;t upload material you
            don&apos;t have the right to use.
          </p>
          <p>
            You can stop using Learnix and delete your account at any time from Settings → Data
            &amp; Privacy.
          </p>
        </div>
      </div>
    </div>
  );
}
