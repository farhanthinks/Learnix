import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { AnswerReferences } from "@/components/ui/answer-references";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
  references?: string[];
}

export function ChatMessage({ message }: { message: AssistantMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-accent-primary max-w-[70%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <span className="bg-accent-primary/10 text-accent-primary mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <div className="border-border bg-surface max-w-[92%] min-w-0 rounded-2xl rounded-tl-sm border px-5 py-3.5">
        <div className="prose prose-sm prose-headings:text-text-primary prose-headings:font-display prose-headings:font-semibold prose-p:text-text-primary prose-p:my-1.5 prose-strong:text-text-primary prose-li:text-text-primary prose-li:my-0.5 prose-code:text-accent-primary prose-code:before:content-none prose-code:after:content-none prose-pre:bg-surface-raised prose-pre:text-text-primary prose-table:text-sm prose-th:text-text-primary prose-td:text-text-secondary prose-a:text-accent-primary max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
        <AnswerReferences references={message.references ?? []} />
      </div>
    </div>
  );
}
