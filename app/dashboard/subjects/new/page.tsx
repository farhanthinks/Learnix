import Link from "next/link";

import { Card } from "@/components/ui/card";
import { SubjectForm } from "@/components/subjects/subject-form";

export default function NewSubjectPage() {
  return (
    <div className="bg-bg mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-10">
      <Link href="/dashboard" className="text-accent-primary text-sm hover:underline">
        ← Dashboard
      </Link>
      <Card className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-text-primary text-xl font-semibold">Add a subject</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Upload a syllabus PDF and Learnix will extract the topics for you.
          </p>
        </div>
        <SubjectForm />
      </Card>
    </div>
  );
}
