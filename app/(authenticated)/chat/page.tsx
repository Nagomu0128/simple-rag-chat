import { Bot } from "lucide-react";

export default function ChatIndexPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <Bot className="mx-auto h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-4 text-xl font-medium">RAG Chat</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a new chat or select an existing one
        </p>
      </div>
    </div>
  );
}
