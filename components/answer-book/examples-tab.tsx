import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ExamplesTab({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-sm prose-headings:font-display prose-headings:font-semibold prose-strong:text-text-primary max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
