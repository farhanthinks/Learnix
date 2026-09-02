"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SUGGESTIONS = [
  "Explain this topic simply",
  "Give me an example",
  "Explain like I'm a beginner",
  "What is important for the exam?",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AskAiPanel({
  topicId,
  topicTitle,
  onClose,
}: {
  topicId: string;
  topicTitle: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isSending) return;

    setError(null);
    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch(`/api/topics/${topicId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, history: messages }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not get a response.");
        setMessages(messages);
        return;
      }
      setMessages([...nextMessages, { role: "assistant", content: json.answer }]);
    } catch {
      setError("Network error. Please try again.");
      setMessages(messages);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ask AI"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface flex h-[min(640px,85vh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-xl"
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-accent-primary h-4 w-4" strokeWidth={2} />
            <div>
              <p className="text-text-primary text-sm font-semibold">Ask AI</p>
              <p className="text-text-secondary text-xs">About: {topicTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-secondary hover:bg-surface-raised hover:text-text-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-text-secondary text-sm">Try asking:</p>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="border-border text-text-primary hover:bg-surface-raised w-fit rounded-lg border px-3 py-1.5 text-left text-xs font-medium transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-accent-primary ml-auto text-white"
                      : "bg-surface-raised text-text-primary"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm prose-p:my-1 prose-strong:text-text-primary max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              ))}
              {isSending && (
                <div className="bg-surface-raised text-text-secondary w-fit rounded-xl px-3.5 py-2.5 text-sm">
                  Thinking...
                </div>
              )}
            </div>
          )}
          {error && <p className="text-accent-danger mt-2 text-xs">{error}</p>}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-border flex items-center gap-2 border-t px-4 py-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this topic..."
            disabled={isSending}
            className="border-border bg-surface text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:ring-accent-primary flex-1 rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="bg-accent-primary inline-flex w-auto items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
