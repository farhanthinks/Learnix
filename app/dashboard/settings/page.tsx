import Link from "next/link";
import { redirect } from "next/navigation";

import { SettingsForm } from "@/components/settings/settings-form";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_study_minutes, study_days, preferred_study_time")
    .eq("id", user.id)
    .single();

  return (
    <div className="bg-bg mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-10">
      <Link href="/dashboard" className="text-accent-primary text-sm hover:underline">
        ← Dashboard
      </Link>
      <Card className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-text-primary text-xl font-semibold">
            Study preferences
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            Used to generate your study plans — how much time you have each day, and which days you
            actually study.
          </p>
        </div>
        <SettingsForm
          dailyStudyMinutes={profile?.daily_study_minutes ?? 90}
          studyDays={profile?.study_days ?? ["mon", "tue", "wed", "thu", "fri", "sat"]}
          preferredStudyTime={profile?.preferred_study_time ?? "18:00:00"}
        />
      </Card>
    </div>
  );
}
