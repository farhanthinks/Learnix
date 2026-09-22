"use client";

import {
  Bell,
  ChevronDown,
  Download,
  FileText,
  HelpCircle,
  Info,
  Laptop,
  Lock,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Palette,
  Shield,
  ShieldQuestion,
  Sun,
  Trash2,
  User,
  UserCircle,
} from "lucide-react";
import { useActionState, useState, type FormEvent } from "react";

import { DeleteAccountModal } from "@/components/settings/delete-account-modal";
import {
  SettingsRow,
  SettingsSection,
  ToggleSwitch,
} from "@/components/settings/settings-primitives";
import { ProfileForm } from "@/components/profile/profile-form";
import { signOut } from "@/lib/actions/auth";
import {
  signOutEverywhere,
  updateEmail,
  updatePassword,
  type AccountState,
} from "@/lib/actions/account";
import type { ThemePreference } from "@/types/database";

const APP_VERSION = "0.1.0";
const SUPPORT_EMAIL = "support@learnix.app";

type ExpandableRow = "profile" | "email" | "password" | "sessions" | null;

const initialAccountState: AccountState = {};

function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, isPending] = useActionState(updateEmail, initialAccountState);
  return (
    <form action={formAction} className="flex flex-col gap-3 pb-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-email" className="text-text-secondary text-xs font-medium">
          New email address
        </label>
        <input
          id="new-email"
          name="email"
          type="email"
          defaultValue={currentEmail}
          disabled={isPending}
          className="border-border bg-surface text-text-primary focus:border-accent-primary focus:ring-accent-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-60"
        />
      </div>
      {state.error && <p className="text-accent-danger text-xs">{state.error}</p>}
      {state.success && <p className="text-accent-success text-xs">{state.success}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="bg-accent-primary inline-flex w-auto items-center justify-center self-start rounded-lg px-4 py-1.5 text-xs font-medium text-white transition-[filter] hover:brightness-110 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Update Email"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialAccountState);
  return (
    <form action={formAction} className="flex flex-col gap-3 pb-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-password" className="text-text-secondary text-xs font-medium">
          New password
        </label>
        <input
          id="new-password"
          name="newPassword"
          type="password"
          disabled={isPending}
          className="border-border bg-surface text-text-primary focus:border-accent-primary focus:ring-accent-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-60"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-password" className="text-text-secondary text-xs font-medium">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          disabled={isPending}
          className="border-border bg-surface text-text-primary focus:border-accent-primary focus:ring-accent-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-60"
        />
      </div>
      {state.error && <p className="text-accent-danger text-xs">{state.error}</p>}
      {state.success && <p className="text-accent-success text-xs">{state.success}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="bg-accent-primary inline-flex w-auto items-center justify-center self-start rounded-lg px-4 py-1.5 text-xs font-medium text-white transition-[filter] hover:brightness-110 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Update Password"}
      </button>
    </form>
  );
}

function ActiveSessionsPanel() {
  const [isPending, setIsPending] = useState(false);

  function handleSignOutEverywhere(event: FormEvent) {
    event.preventDefault();
    setIsPending(true);
    signOutEverywhere();
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      <p className="text-text-secondary text-xs">You&apos;re currently signed in on this device.</p>
      <form onSubmit={handleSignOutEverywhere}>
        <button
          type="submit"
          disabled={isPending}
          className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto items-center justify-center rounded-lg border px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? "Signing out..." : "Sign Out of All Devices"}
        </button>
      </form>
    </div>
  );
}

export function SettingsShell({
  email,
  fullName,
  collegeName,
  studyRemindersEnabled,
  examRemindersEnabled,
  appLockEnabled,
  themePreference,
}: {
  email: string;
  fullName: string;
  collegeName: string;
  studyRemindersEnabled: boolean;
  examRemindersEnabled: boolean;
  appLockEnabled: boolean;
  themePreference: ThemePreference;
}) {
  const [expandedRow, setExpandedRow] = useState<ExpandableRow>(null);
  const [studyReminders, setStudyReminders] = useState(studyRemindersEnabled);
  const [examReminders, setExamReminders] = useState(examRemindersEnabled);
  const [appLock, setAppLock] = useState(appLockEnabled);
  const [theme, setTheme] = useState<ThemePreference>(themePreference);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  async function savePreference(field: string, value: boolean | string) {
    try {
      await fetch("/api/account/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value }),
      });
    } catch {
      // Optimistic UI already reflects the click; a transient network error
      // here just means the next toggle click will retry the save.
    }
  }

  function toggleRow(row: ExpandableRow) {
    setExpandedRow((prev) => (prev === row ? null : row));
  }

  return (
    <div className="bg-bg mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="font-display text-text-primary text-2xl font-semibold">Settings</h1>
        <p className="text-text-secondary text-sm">Manage your account, preferences, and data.</p>
      </div>

      {/* Account */}
      <SettingsSection icon={UserCircle} title="Account">
        <div>
          <SettingsRow
            icon={User}
            label="Profile"
            description={fullName || "Add your name and college"}
            onClick={() => toggleRow("profile")}
            control={
              <ChevronDown
                className={`text-text-secondary h-4 w-4 transition-transform ${expandedRow === "profile" ? "rotate-180" : ""}`}
                strokeWidth={2}
              />
            }
          />
          {expandedRow === "profile" && (
            <div className="pb-4">
              <ProfileForm fullName={fullName} collegeName={collegeName} />
            </div>
          )}
        </div>

        <div>
          <SettingsRow
            icon={Mail}
            label="Email"
            description={email}
            onClick={() => toggleRow("email")}
            control={
              <ChevronDown
                className={`text-text-secondary h-4 w-4 transition-transform ${expandedRow === "email" ? "rotate-180" : ""}`}
                strokeWidth={2}
              />
            }
          />
          {expandedRow === "email" && <EmailForm currentEmail={email} />}
        </div>

        <div>
          <SettingsRow
            icon={Lock}
            label="Password"
            description="Change your account password"
            onClick={() => toggleRow("password")}
            control={
              <ChevronDown
                className={`text-text-secondary h-4 w-4 transition-transform ${expandedRow === "password" ? "rotate-180" : ""}`}
                strokeWidth={2}
              />
            }
          />
          {expandedRow === "password" && <PasswordForm />}
        </div>

        <SettingsRow
          icon={LogOut}
          label="Logout"
          description="Sign out of this device"
          danger
          control={
            <form action={signOut}>
              <button
                type="submit"
                className="border-accent-danger text-accent-danger hover:bg-accent-danger/10 inline-flex w-auto items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
              >
                Logout
              </button>
            </form>
          }
        />
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection icon={Bell} title="Notifications">
        <SettingsRow
          icon={Bell}
          label="Study Reminders"
          description="Nudge me to study around my scheduled sessions"
          control={
            <ToggleSwitch
              checked={studyReminders}
              label="Study Reminders"
              onChange={(next) => {
                setStudyReminders(next);
                savePreference("study_reminders_enabled", next);
              }}
            />
          }
        />
        <SettingsRow
          icon={ShieldQuestion}
          label="Exam Reminders"
          description="Alert me as an exam date approaches"
          control={
            <ToggleSwitch
              checked={examReminders}
              label="Exam Reminders"
              onChange={(next) => {
                setExamReminders(next);
                savePreference("exam_reminders_enabled", next);
              }}
            />
          }
        />
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection icon={Palette} title="Appearance">
        <SettingsRow
          icon={Monitor}
          label="Theme"
          description="Learnix currently ships one light theme — Dark and System are saved for when that ships"
          control={
            <div className="border-border flex overflow-hidden rounded-lg border">
              {(
                [
                  { value: "light", icon: Sun },
                  { value: "dark", icon: Moon },
                  { value: "system", icon: Laptop },
                ] as const
              ).map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={theme === value}
                  aria-label={value}
                  onClick={() => {
                    setTheme(value);
                    savePreference("theme_preference", value);
                  }}
                  className={`flex h-8 w-9 items-center justify-center transition-colors ${
                    theme === value
                      ? "bg-accent-primary text-white"
                      : "text-text-secondary hover:bg-surface-raised"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              ))}
            </div>
          }
        />
      </SettingsSection>

      {/* Security */}
      <SettingsSection icon={Shield} title="Security">
        <SettingsRow
          icon={Lock}
          label="App Lock"
          description="Require authentication to open Learnix — saved for when this ships"
          control={
            <ToggleSwitch
              checked={appLock}
              label="App Lock"
              onChange={(next) => {
                setAppLock(next);
                savePreference("app_lock_enabled", next);
              }}
            />
          }
        />
        <div>
          <SettingsRow
            icon={Laptop}
            label="Active Sessions"
            description="Manage where you're signed in"
            onClick={() => toggleRow("sessions")}
            control={
              <ChevronDown
                className={`text-text-secondary h-4 w-4 transition-transform ${expandedRow === "sessions" ? "rotate-180" : ""}`}
                strokeWidth={2}
              />
            }
          />
          {expandedRow === "sessions" && <ActiveSessionsPanel />}
        </div>
      </SettingsSection>

      {/* Data & Privacy */}
      <SettingsSection icon={FileText} title="Data & Privacy">
        <SettingsRow
          icon={Download}
          label="Export Data"
          description="Download everything you've added to Learnix as a JSON file"
          control={
            <a
              href="/api/account/export"
              className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              Export
            </a>
          }
        />
        <SettingsRow
          icon={Trash2}
          label="Delete Account"
          description="Permanently delete your account and all your data"
          danger
          control={
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="border-accent-danger text-accent-danger hover:bg-accent-danger/10 inline-flex w-auto items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              Delete
            </button>
          }
        />
      </SettingsSection>

      {/* Help & About */}
      <SettingsSection icon={Info} title="Help & About">
        <SettingsRow
          icon={HelpCircle}
          label="Help & Support"
          description={SUPPORT_EMAIL}
          control={
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-accent-primary text-xs font-medium hover:underline"
            >
              Contact
            </a>
          }
        />
        <SettingsRow
          icon={FileText}
          label="Privacy Policy"
          control={
            <a href="/privacy" className="text-accent-primary text-xs font-medium hover:underline">
              View
            </a>
          }
        />
        <SettingsRow
          icon={FileText}
          label="Terms"
          control={
            <a href="/terms" className="text-accent-primary text-xs font-medium hover:underline">
              View
            </a>
          }
        />
        <SettingsRow
          icon={Info}
          label="App Version"
          control={<span className="text-text-secondary text-xs">{APP_VERSION}</span>}
        />
      </SettingsSection>

      {deleteModalOpen && <DeleteAccountModal onClose={() => setDeleteModalOpen(false)} />}
    </div>
  );
}
