import type { Express, NextFunction, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import {
  insertChatSchema,
  insertMessageSchema,
  loginSchema,
  safePublicUser,
} from "@shared/schema";
import { storage, type GameForgeUserPayload } from "./storage";
import {
  BUTTONZ_SESSION_COOKIE,
  establishButtonzSession,
} from "./session";

const GFS_EXCHANGE_TIMEOUT_MS = 8_000;

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Buttonz login required" });
  }

  next();
}

function getParam(req: Request, name: string) {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}

async function requireChatMember(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  const chatId = getParam(req, "chatId");

  if (!userId) {
    return res.status(401).json({ message: "Buttonz login required" });
  }

  const isMember = await storage.isChatMember(chatId, userId);
  if (!isMember) {
    return res.status(403).json({ message: "You are not a member of this chat" });
  }

  next();
}

function parseLimitOffset(query: Request["query"]) {
  return {
    limit: query.limit ? Math.min(Number(query.limit), 100) : 50,
    offset: query.offset ? Number(query.offset) : 0,
  };
}

async function createButtonzSession(req: Request, userId: string) {
  await establishButtonzSession(req, userId);
  await storage.ensureMainChat(userId);
}

function getGameForgeConfig() {
  const appId = process.env.GAMEFORGE_APP_ID;
  const apiUrl = process.env.GAMEFORGE_API_URL;
  const publicUrl = process.env.GAMEFORGE_PUBLIC_URL;

  if (!appId || !apiUrl || !publicUrl) {
    return undefined;
  }

  return { appId, apiUrl, publicUrl };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({
      app: "buttonz",
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/config", (_req, res) => {
    const config = getGameForgeConfig();
    if (!config) {
      return res.status(500).json({ message: "GameForgeStudio configuration is incomplete" });
    }

    return res.json({ gameforgePublicUrl: config.publicUrl });
  });

  app.post("/api/auth/lookup", async (req, res) => {
    const credentials = loginSchema.parse(req.body);
    const user = await storage.getUserByUsernameOrEmail(credentials.username);

    if (!user) {
      return res.status(404).json({
        message: "Use your existing GameForgeStudio account to access Buttonz.",
      });
    }

    return res.json({
      message: `Welcome, ${user.displayName}!`,
      user: safePublicUser(user),
    });
  });

  app.post("/api/auth/login", (_req, res) => {
    return res.status(403).json({
      message: "Direct Buttonz login is disabled. Sign in through GameForgeStudio to continue.",
    });
  });

  app.post("/api/auth/gfs-session", async (req, res) => {
    const code = typeof req.body?.code === "string" ? req.body.code : undefined;
    const config = getGameForgeConfig();

    if (!config) {
      return res.status(401).json({ message: "GameForgeStudio verification URL is not configured" });
    }

    if (!code) {
      return res.status(401).json({ message: "No GameForgeStudio auth code was provided" });
    }

    let exchangeResponse: globalThis.Response;
    try {
      exchangeResponse = await fetch(new URL("/api/external-apps/buttonz/exchange", config.apiUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, appId: config.appId }),
        signal: AbortSignal.timeout(GFS_EXCHANGE_TIMEOUT_MS),
      });
    } catch (error) {
      console.error("GameForgeStudio code exchange endpoint could not be reached:", error);
      return res.status(401).json({ message: "GameForgeStudio code exchange endpoint could not be reached" });
    }

    if (!exchangeResponse.ok) {
      const errorText = await exchangeResponse.text();
      console.error("GameForgeStudio code exchange failed:", {
        status: exchangeResponse.status,
        body: errorText,
      });
      return res.status(401).json({ message: "GameForgeStudio auth code was invalid or expired" });
    }

    const gameforgeUser = await exchangeResponse.json() as GameForgeUserPayload;

    if (!gameforgeUser.id) {
      return res.status(401).json({ message: "GameForgeStudio session did not include a user" });
    }

    const user = await storage.ensureUserFromGameForge(gameforgeUser);

    await createButtonzSession(req, user.id);

    return res.json({
      message: `Welcome, ${user.displayName}!`,
      user: safePublicUser(user),
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((error) => {
      if (error) {
        return res.status(500).json({ message: "Failed to logout" });
      }

      res.clearCookie(BUTTONZ_SESSION_COOKIE);
      return res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user/current", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      req.session.destroy(() => undefined);
      return res.status(401).json({ message: "GameForgeStudio account no longer exists" });
    }

    await storage.ensureMainChat(user.id);
    return res.json(safePublicUser(user));
  });

  app.get("/api/users", requireAuth, async (_req, res) => {
    const users = await storage.getAllUsers();
    return res.json(users.map(safePublicUser));
  });

  app.get("/api/chats", requireAuth, async (req, res) => {
    await storage.ensureMainChat(req.session.userId!);
    const chats = await storage.getUserChats(req.session.userId!);
    return res.json(chats);
  });

  app.post("/api/chats", requireAuth, async (req, res) => {
    const validatedChat = insertChatSchema.parse({
      ...req.body,
      createdBy: req.session.userId,
      isMainChat: 0,
    });

    const chat = await storage.createChat(validatedChat);
    await storage.addChatMemberIfMissing({
      chatId: chat.id,
      userId: req.session.userId!,
      role: "admin",
    });

    return res.status(201).json(chat);
  });

  app.get("/api/chats/:chatId/members", requireAuth, requireChatMember, async (req, res) => {
    const members = await storage.getChatMembers(getParam(req, "chatId"));
    return res.json(members);
  });

  app.get("/api/chats/:chatId/messages", requireAuth, requireChatMember, async (req, res) => {
    const { limit, offset } = parseLimitOffset(req.query);
    const messages = await storage.getMessages(getParam(req, "chatId"), limit, offset);
    return res.json(messages);
  });

  app.post("/api/chats/:chatId/messages", requireAuth, requireChatMember, async (req, res) => {
    const message = insertMessageSchema.parse({
      chatId: getParam(req, "chatId"),
      userId: req.session.userId,
      content: req.body.content,
      type: req.body.type || "text",
      replyToId: req.body.replyToId || null,
    });

    const created = await storage.createMessage(message);
    return res.status(201).json(created);
  });

  app.patch("/api/messages/:messageId", requireAuth, async (req, res) => {
    const body = z.object({ content: z.string().min(1) }).parse(req.body);
    const updated = await storage.updateMessage(getParam(req, "messageId"), req.session.userId!, body.content);

    if (!updated) {
      return res.status(404).json({ message: "Message not found" });
    }

    return res.json(updated);
  });

  app.delete("/api/messages/:messageId", requireAuth, async (req, res) => {
    const deleted = await storage.deleteMessage(getParam(req, "messageId"), req.session.userId!);

    if (!deleted) {
      return res.status(404).json({ message: "Message not found" });
    }

    return res.json({ message: "Message deleted" });
  });

  return createServer(app);
}
