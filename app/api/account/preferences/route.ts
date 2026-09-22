import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { ThemePreference } from "@/types/database";

const THEME_VALUES = new Set<ThemePreference>(["light", "dark", "system"]);

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const field = String(body?.field ?? "");
  const value = body?.value;

  let error: { message: string } | null = null;

  if (field === "study_reminders_enabled") {
    if (typeof value !== "boolean") {
      return NextResponse.json({ error: "Invalid value." }, { status: 400 });
    }
    ({ error } = await supabase
      .from("profiles")
      .update({ study_reminders_enabled: value })
      .eq("id", user.id));
  } else if (field === "exam_reminders_enabled") {
    if (typeof value !== "boolean") {
      return NextResponse.json({ error: "Invalid value." }, { status: 400 });
    }
    ({ error } = await supabase
      .from("profiles")
      .update({ exam_reminders_enabled: value })
      .eq("id", user.id));
  } else if (field === "app_lock_enabled") {
    if (typeof value !== "boolean") {
      return NextResponse.json({ error: "Invalid value." }, { status: 400 });
    }
    ({ error } = await supabase
      .from("profiles")
      .update({ app_lock_enabled: value })
      .eq("id", user.id));
  } else if (field === "theme_preference") {
    if (typeof value !== "string" || !THEME_VALUES.has(value as ThemePreference)) {
      return NextResponse.json({ error: "Invalid value." }, { status: 400 });
    }
    ({ error } = await supabase
      .from("profiles")
      .update({ theme_preference: value as ThemePreference })
      .eq("id", user.id));
  } else {
    return NextResponse.json({ error: "Unknown preference." }, { status: 400 });
  }

  if (error) {
    return NextResponse.json({ error: "Could not save your preference." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
