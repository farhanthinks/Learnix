"use client";

import { MessageSquare, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { ChatMessage, type AssistantMessage } from "@/components/assistant/chat-message";
import { SubjectDropdown } from "@/components/assistant/subject-dropdown";

export interface AssistantSubjectData {
  id: string;
  name: string;
  topicTitles: string[];
}

const GENERIC_SUGGESTIONS = [
  "Explain this in simple terms.",
  "Give me an exam-ready answer.",
  "Quiz me on this subject.",
];

function buildSuggestions(subject: AssistantSubjectData): string[] {
  const topicSuggestions = subject.topicTitles.slice(0, 2).map((title) => `Explain ${title}.`);
  return [...topicSuggestions, ...GENERIC_SUGGESTIONS];
}

export function AssistantShell({ subjects }: { subjects: AssistantSubjectData[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(subjects[0]?.id ?? null);
  const [conversations, setConversations] = useState<Record<string, AssistantMessage[]>>({});
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedSubject = subjects.find((s) => s.id === selectedId) ?? null;
  const messages = useMemo(
    () => (selectedId ? (conversations[selectedId] ?? []) : []),
    [conversations, selectedId],
  );
  const suggestions = useMemo(
    () => (selectedSubject ? buildSuggestions(selectedSubject) : []),
    [selectedSubject],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  async function sendMessage(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isSending || !selectedId) return;

    setError(null);
    const subjectId = selectedId;
    const priorMessages = conversations[subjectId] ?? [];
    const nextMessages: AssistantMessage[] = [...priorMessages, { role: "user", content: trimmed }];
    setConversations((prev) => ({ ...prev, [subjectId]: nextMessages }));
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, question: trimmed, history: priorMessages }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not get a response.");
        setConversations((prev) => ({ ...prev, [subjectId]: priorMessages }));
        return;
      }
      setConversations((prev) => ({
        ...prev,
        [subjectId]: [...nextMessages, { role: "assistant", content: json.answer }],
      }));
    } catch {
      setError("Network error. Please try again.");
      setConversations((prev) => ({ ...prev, [subjectId]: priorMessages }));
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  }

  if (subjects.length === 0) {
    return (
      <div className="bg-bg mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-3 px-8 py-8 text-center">
        <div className="bg-accent-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
          <MessageSquare className="text-accent-primary h-7 w-7" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-text-primary text-lg font-semibold">
          Add a subject to get started
        </h1>
        <p className="text-text-secondary max-w-sm text-sm">
          The AI Assistant answers questions grounded in a subject&apos;s syllabus and your study
          notes — add a subject first.
        </p>
        <Link
          href="/dashboard/subjects/new"
          className="bg-accent-primary mt-1 inline-flex w-auto items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white hover:brightness-110"
        >
          + Add Subject
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-bg mx-auto flex w-[85%] max-w-[1400px] flex-1 flex-col px-6 py-6 sm:px-8 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div>
          <h1 className="font-display text-text-primary text-xl font-semibold">AI Assistant</h1>
          <p className="text-text-secondary text-sm">Your subject-aware study chatbot.</p>
        </div>
        <SubjectDropdown
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setError(null);
          }}
        />
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 py-10 text-center">
            <div className="bg-accent-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
              <MessageSquare className="text-accent-primary h-6 w-6" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-text-primary text-lg font-semibold">
              What would you like to learn?
            </h2>
            <div className="flex max-w-md flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="border-border text-text-primary hover:border-accent-primary hover:bg-accent-primary/5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m, i) => (
              <ChatMessage key={i} message={m} />
            ))}
            {isSending && (
              <div className="flex items-center gap-2.5">
                <span className="bg-accent-primary/10 text-accent-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                  <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <div className="border-border bg-surface text-text-secondary rounded-2xl rounded-tl-sm border px-4 py-3 text-sm">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-accent-danger pb-2 text-sm">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="border-border bg-surface flex items-end gap-2 rounded-2xl border p-2"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedSubject
              ? `Ask anything about ${selectedSubject.name}...`
              : "Select a subject to start asking..."
          }
          disabled={isSending || !selectedSubject}
          rows={1}
          className="text-text-primary placeholder:text-text-secondary max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim() || !selectedSubject}
          aria-label="Send message"
          className="bg-accent-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-[filter] hover:brightness-110 disabled:opacity-50"
        >
          <Send className="h-4 w-4" strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}
