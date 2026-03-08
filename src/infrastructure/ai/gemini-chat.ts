import { google } from "@ai-sdk/google";
import { streamText, type ModelMessage } from "ai";

export function createChatStream(
  messages: ModelMessage[],
  context: string[]
) {
  const systemPrompt =
    context.length > 0
      ? `You are a helpful assistant. Use the following context to answer questions accurately. If the context doesn't contain relevant information, say so and answer based on your general knowledge.

--- Retrieved Context ---
${context.join("\n\n---\n\n")}
--- End Context ---`
      : "You are a helpful assistant. Answer questions clearly and concisely.";

  return streamText({
    model: google("gemini-2.0-flash"),
    system: systemPrompt,
    messages,
  });
}
