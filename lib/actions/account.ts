"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface AccountState {
  error?: string;
  success?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DELETE_CONFIRMATION_PHRASE = "DELETE";

export async function updateEmail(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!EMAIL_REGEX.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email });

  if (error) {
    return { error: error.message };
  }

  return {
    success: "Check your new email inbox to confirm the change — it won't take effect until then.",
  };
}

export async function updatePassword(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password updated." };
}

export async function signOutEverywhere() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}

export async function deleteAccount(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (confirmation !== DELETE_CONFIRMATION_PHRASE) {
    return { error: `Type "${DELETE_CONFIRMATION_PHRASE}" to confirm.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  // Subjects cascade to everything derived from them (topics, study plans,
  // notes, quizzes, quiz attempts, study sessions); profiles and
  // calendar_events cascade directly from auth.users. Clearing subjects
  // first means the account delete below won't hit a foreign-key block.
  const { error: subjectsError } = await supabase.from("subjects").delete().eq("user_id", user.id);
  if (subjectsError) {
    return { error: "Could not delete your data. Please try again." };
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return { error: "Could not delete your account. Please try again." };
  }

  await supabase.auth.signOut();
  redirect("/login");
}
