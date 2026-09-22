"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export interface ProfileState {
  error?: string;
  success?: boolean;
}

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const collegeName = String(formData.get("collegeName") ?? "").trim();

  if (!fullName) {
    return { error: "Please enter your name." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, full_name: fullName, college_name: collegeName || null },
      { onConflict: "id" },
    );

  if (error) {
    console.error("Failed to save profile:", error);
    return { error: "Could not save your profile. Please try again." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard", "layout");
  return { success: true };
}
