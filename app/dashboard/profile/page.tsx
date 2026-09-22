import { redirect } from "next/navigation";

// Profile editing now lives inline on the Settings page (Account → Profile)
// instead of its own route — this shim keeps any old links working.
export default function ProfilePage() {
  redirect("/dashboard/settings");
}
