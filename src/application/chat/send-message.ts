import { conversationRepository, messageRepository, documentChunkRepository } from "@/src/infrastructure/container";
import { retrieveRelevantChunks } from "@/src/infrastructure/ai/retriever";
import { createChatStream } from "@/src/infrastructure/ai/gemini-chat";
import type { ModelMessage } from "ai";

export async function sendMessage(
  conversationId: string,
  userId: string,
  userMessage: string
) {
  // Save user message
  await messageRepository.create({
    conversationId,
    role: "user",
    content: userMessage,
  });

  // Update conversation title on first message
  const conv = await conversationRepository.findById(conversationId);
  if (conv?.title === "New Chat") {
    const title =
      userMessage.length > 40
        ? userMessage.slice(0, 40) + "..."
        : userMessage;
    await conversationRepository.updateTitle(conversationId, title);
  }

  // Retrieve relevant context via RAG
  const context = await retrieveRelevantChunks(
    documentChunkRepository,
    userMessage,
    userId
  );

  // Build message history
  const history = await messageRepository.findByConversationId(conversationId);
  const messages: ModelMessage[] = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Stream response
  return createChatStream(messages, context);
}
