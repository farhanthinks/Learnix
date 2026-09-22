import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-bg mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <Link href="/dashboard/settings" className="text-accent-primary text-sm hover:underline">
        ← Settings
      </Link>
      <div className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-6">
        <div>
          <h1 className="font-display text-text-primary text-xl font-semibold">Privacy Policy</h1>
          <p className="text-text-secondary mt-1 text-xs">
            Placeholder — replace with reviewed legal copy before launch.
          </p>
        </div>
        <div className="text-text-secondary flex flex-col gap-3 text-sm">
          <p>
            Learnix stores the study data you give it — subjects, syllabus content, generated notes
            and quizzes, and your study activity — to provide the study-planning and AI features of
            the app. We don&apos;t sell your data.
          </p>
          <p>
            You can export a copy of your data or permanently delete your account and all associated
            data at any time from Settings → Data &amp; Privacy.
          </p>
          <p>
            Questions about this policy can be sent to{" "}
            <a href="mailto:support@learnix.app" className="text-accent-primary hover:underline">
              support@learnix.app
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
