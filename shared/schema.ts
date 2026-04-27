import { sql } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("developer"),
  avatar: text("avatar"),
  banner: text("banner"),
  bio: text("bio"),
  jobTitle: text("job_title"),
  status: text("status"),
  location: text("location"),
  portfolioLink: text("portfolio_link"),
  skills: text("skills").array().default([]),
  currentProject: text("current_project"),
  availability: text("availability").default("online"),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chats = pgTable("chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("group"),
  isMainChat: integer("is_main_chat").notNull().default(0),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatMembers = pgTable("chat_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"),
  editedAt: timestamp("edited_at"),
  replyToId: varchar("reply_to_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMemberSchema = createInsertSchema(chatMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
});

export type User = typeof users.$inferSelect;
export type PublicUser = Pick<User, "id" | "username" | "displayName" | "role" | "avatar" | "jobTitle" | "status">;
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type ChatMember = typeof chatMembers.$inferSelect;
export type InsertChatMember = z.infer<typeof insertChatMemberSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export function safePublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    avatar: user.avatar,
    jobTitle: user.jobTitle,
    status: user.status,
  };
}
