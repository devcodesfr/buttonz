import { and, asc, desc, eq, or } from "drizzle-orm";
import { db } from "./db";
import {
  chatMembers,
  chats,
  messages,
  users,
  type Chat,
  type ChatMember,
  type InsertChat,
  type InsertChatMember,
  type InsertMessage,
  type Message,
  type User,
} from "@shared/schema";

export class ButtonzStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail)))
      .limit(1);
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(asc(users.displayName));
  }

  async ensureMainChat(userId: string): Promise<Chat> {
    const existing = await db.select().from(chats).where(eq(chats.isMainChat, 1)).limit(1);

    if (existing[0]) {
      await this.addChatMemberIfMissing({
        chatId: existing[0].id,
        userId,
        role: "member",
      });
      return existing[0];
    }

    const chat = await this.createChat({
      name: "GameForge General",
      description: "Main communication hub for GameForge Studio users",
      type: "main",
      isMainChat: 1,
      createdBy: userId,
    });

    await this.addChatMemberIfMissing({
      chatId: chat.id,
      userId,
      role: "admin",
    });

    return chat;
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    const result = await db
      .select({
        id: chats.id,
        name: chats.name,
        description: chats.description,
        type: chats.type,
        isMainChat: chats.isMainChat,
        createdBy: chats.createdBy,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
      })
      .from(chats)
      .innerJoin(chatMembers, eq(chats.id, chatMembers.chatId))
      .where(eq(chatMembers.userId, userId))
      .orderBy(desc(chats.updatedAt));

    return result;
  }

  async getChat(id: string): Promise<Chat | undefined> {
    const result = await db.select().from(chats).where(eq(chats.id, id)).limit(1);
    return result[0];
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const [chat] = await db
      .insert(chats)
      .values({
        ...insertChat,
        updatedAt: new Date(),
      })
      .returning();
    return chat;
  }

  async getChatMembers(chatId: string): Promise<ChatMember[]> {
    return db
      .select()
      .from(chatMembers)
      .where(eq(chatMembers.chatId, chatId))
      .orderBy(asc(chatMembers.joinedAt));
  }

  async isChatMember(chatId: string, userId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(chatMembers)
      .where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId)))
      .limit(1);
    return Boolean(result[0]);
  }

  async addChatMemberIfMissing(insertChatMember: InsertChatMember): Promise<ChatMember> {
    const existing = await db
      .select()
      .from(chatMembers)
      .where(and(
        eq(chatMembers.chatId, insertChatMember.chatId),
        eq(chatMembers.userId, insertChatMember.userId),
      ))
      .limit(1);

    if (existing[0]) {
      return existing[0];
    }

    const [member] = await db.insert(chatMembers).values(insertChatMember).returning();
    return member;
  }

  async getMessages(chatId: string, limit = 50, offset = 0): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, insertMessage.chatId));
    return message;
  }

  async updateMessage(id: string, userId: string, content: string): Promise<Message | undefined> {
    const [message] = await db
      .update(messages)
      .set({ content, editedAt: new Date() })
      .where(and(eq(messages.id, id), eq(messages.userId, userId)))
      .returning();
    return message;
  }

  async deleteMessage(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(messages)
      .where(and(eq(messages.id, id), eq(messages.userId, userId)))
      .returning({ id: messages.id });
    return result.length > 0;
  }
}

export const storage = new ButtonzStorage();
