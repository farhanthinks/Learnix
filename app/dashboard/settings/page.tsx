import { redirect } from "next/navigation";

import { SettingsShell } from "@/components/settings/settings-shell";
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
    .select(
      "full_name, college_name, study_reminders_enabled, exam_reminders_enabled, app_lock_enabled, theme_preference",
    )
    .eq("id", user.id)
    .single();

  return (
    <SettingsShell
      email={user.email ?? ""}
      fullName={profile?.full_name ?? ""}
      collegeName={profile?.college_name ?? ""}
      studyRemindersEnabled={profile?.study_reminders_enabled ?? true}
      examRemindersEnabled={profile?.exam_reminders_enabled ?? true}
      appLockEnabled={profile?.app_lock_enabled ?? false}
      themePreference={profile?.theme_preference ?? "light"}
    />
  );
}
