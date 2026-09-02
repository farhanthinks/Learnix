"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { StudyDay } from "@/types/database";

export interface SettingsState {
  error?: string;
  success?: boolean;
}

const VALID_DAYS: StudyDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function saveStudyPreferences(
  _prevState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const dailyStudyMinutesRaw = String(formData.get("dailyStudyMinutes") ?? "");
  const dailyStudyMinutes = Number(dailyStudyMinutesRaw);
  const studyDays = formData
    .getAll("studyDays")
    .map(String)
    .filter((d): d is StudyDay => VALID_DAYS.includes(d as StudyDay));
  const preferredStudyTime = String(formData.get("preferredStudyTime") ?? "");

  if (!Number.isFinite(dailyStudyMinutes) || dailyStudyMinutes < 15 || dailyStudyMinutes > 600) {
    return { error: "Daily study minutes must be between 15 and 600." };
  }
  if (studyDays.length === 0) {
    return { error: "Please select at least one study day." };
  }
  if (!TIME_RE.test(preferredStudyTime)) {
    return { error: "Please enter a valid start time." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      daily_study_minutes: dailyStudyMinutes,
      study_days: studyDays,
      preferred_study_time: preferredStudyTime,
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("Failed to save study preferences:", error);
    return { error: "Could not save your preferences. Please try again." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
