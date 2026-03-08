"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MessageSquare, Trash2, FileText, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/src/infrastructure/firebase/client";
import { DocumentUpload } from "@/components/documents/document-upload";
import type { Conversation } from "@/src/domain/conversation/entity";

export function ChatSidebar() {
  const { user, getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/conversations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const createConversation = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/chat/${data.conversation.id}`);
      fetchConversations();
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = await getToken();
    if (!token) return;
    await fetch(`/api/conversations/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (params.conversationId === id) {
      router.push("/chat");
    }
    fetchConversations();
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/30">
      <div className="p-4">
        <Button
          onClick={createConversation}
          className="w-full"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))
          ) : conversations.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex cursor-pointer items-center rounded-md px-3 py-2 text-sm hover:bg-accent ${
                  params.conversationId === conv.id
                    ? "bg-accent"
                    : ""
                }`}
                onClick={() => router.push(`/chat/${conv.id}`)}
              >
                <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate flex-1">{conv.title}</span>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="ml-1 hidden rounded p-1 hover:bg-destructive/20 group-hover:block"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-2">
        <DocumentUpload onUpload={fetchConversations} />
      </div>

      <Separator />

      <div className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-sm"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
