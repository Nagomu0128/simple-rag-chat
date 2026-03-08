import { eq, asc } from "drizzle-orm";
import { db } from "../client";
import { messages } from "../schema";
import type { Message, MessageRole } from "@/src/domain/message/entity";
import type { MessageRepository } from "@/src/domain/message/repository";

export class DrizzleMessageRepository implements MessageRepository {
  async findByConversationId(conversationId: string): Promise<Message[]> {
    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
    return rows as Message[];
  }

  async create(data: {
    conversationId: string;
    role: MessageRole;
    content: string;
  }): Promise<Message> {
    const [msg] = await db
      .insert(messages)
      .values(data)
      .returning();
    return msg as Message;
  }
}
