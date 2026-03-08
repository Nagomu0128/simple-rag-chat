"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import type { Message } from "@/src/domain/message/entity";

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
    setLoading(false);
  }, [conversationId, getToken]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    fetchMessages();
  }, [conversationId, fetchMessages]);

  const handleSend = async (message: string) => {
    setSending(true);
    setStreamingContent("");

    // Optimistic UI update
    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: "user",
      content: message,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const token = await getToken();
    if (!token) return;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ conversationId, message }),
    });

    if (!res.ok || !res.body) {
      setSending(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullContent += chunk;
      setStreamingContent(fullContent);
    }

    // Replace streaming content with final message
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: "assistant",
      content: fullContent,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setStreamingContent("");
    setSending(false);
  };

  return (
    <>
      <ChatMessages
        messages={messages}
        streamingContent={streamingContent}
        loading={loading}
      />
      <ChatInput onSend={handleSend} disabled={sending} />
    </>
  );
}
