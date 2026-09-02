import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initial = "?";
  let name = "";
  const email = user?.email ?? "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    name = profile?.full_name ?? user.email ?? "";
    initial = (profile?.full_name ?? user.email ?? "?").charAt(0).toUpperCase();
  }

  return (
    <div className="flex min-h-full w-full flex-1">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar initial={initial} name={name} email={email} />
        <main className="bg-bg flex-1">{children}</main>
      </div>
    </div>
  );
}
