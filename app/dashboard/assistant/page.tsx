import { MessageSquare } from "lucide-react";

import { Card } from "@/components/ui/card";

export default function AssistantComingSoonPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-8 py-8">
      <div>
        <h1 className="font-display text-text-primary text-2xl font-bold">AI Assistant</h1>
        <p className="text-text-secondary text-sm">Your study chatbot.</p>
      </div>
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="bg-accent-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
          <MessageSquare className="text-accent-primary h-7 w-7" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-text-primary text-lg font-semibold">Coming soon</h2>
        <p className="text-text-secondary max-w-sm text-sm">
          The AI study assistant chatbot hasn&apos;t been built yet — it&apos;s next up.
        </p>
      </Card>
    </div>
  );
}
