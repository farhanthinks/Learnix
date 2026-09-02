import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, college_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="bg-bg mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-10">
      <Link href="/dashboard" className="text-accent-primary text-sm hover:underline">
        ← Dashboard
      </Link>
      <Card className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-text-primary text-xl font-semibold">Profile settings</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Your name and college, shown across Learnix.
          </p>
        </div>
        <div className="border-border bg-surface-raised rounded-lg border px-4 py-3">
          <p className="text-text-secondary text-xs">Email</p>
          <p className="text-text-primary text-sm font-medium">{user.email}</p>
        </div>
        <ProfileForm
          fullName={profile?.full_name ?? ""}
          collegeName={profile?.college_name ?? ""}
        />
      </Card>
    </div>
  );
}
