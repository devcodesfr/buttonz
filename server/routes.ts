import type { Express, NextFunction, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import {
  insertChatSchema,
  insertMessageSchema,
  loginSchema,
  toPublicUser,
} from "@shared/schema";
import { storage } from "./storage";

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
  req.session.userId = userId;
  await storage.ensureMainChat(userId);
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/lookup", async (req, res) => {
    const credentials = loginSchema.parse(req.body);
    // #region agent log
    fetch('http://127.0.0.1:7855/ingest/e6e06c55-184c-447a-b3f0-43f18b3c62bc',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'59f846'},body:JSON.stringify({sessionId:'59f846',runId:'pre-fix-buttonz-auth',hypothesisId:'B,C',location:'buttonz/server/routes.ts:63',message:'Buttonz lookup route reached',data:{identifierLength:credentials.username.length,identifierHasAt:credentials.username.includes("@")},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const user = await storage.getUserByUsernameOrEmail(credentials.username);

    if (!user) {
      return res.status(404).json({
        message: "Use your existing GameForgeStudio account to access Buttonz.",
      });
    }

    return res.json({
      message: `Welcome, ${user.displayName}!`,
      user: toPublicUser(user),
    });
  });

  app.post("/api/auth/login", async (req, res) => {
    const credentials = loginSchema.parse(req.body);
    // #region agent log
    fetch('http://127.0.0.1:7855/ingest/e6e06c55-184c-447a-b3f0-43f18b3c62bc',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'59f846'},body:JSON.stringify({sessionId:'59f846',runId:'pre-fix-buttonz-auth',hypothesisId:'B,C',location:'buttonz/server/routes.ts:83',message:'Buttonz login route reached',data:{identifierLength:credentials.username.length,identifierHasAt:credentials.username.includes("@")},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const user = await storage.getUserByUsernameOrEmail(credentials.username);

    if (!user) {
      return res.status(401).json({
        message: "Use your existing GameForgeStudio account to log in.",
      });
    }

    await createButtonzSession(req, user.id);

    return res.json({
      message: `Welcome, ${user.displayName}!`,
      user: toPublicUser(user),
    });
  });

  app.post("/api/auth/gfs-session", async (req, res) => {
    const gameforgeUrl = process.env.GAMEFORGE_URL;
    const cookie = req.headers.cookie;
    // #region agent log
    fetch('http://127.0.0.1:7855/ingest/e6e06c55-184c-447a-b3f0-43f18b3c62bc',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'59f846'},body:JSON.stringify({sessionId:'59f846',runId:'pre-fix-buttonz-auth',hypothesisId:'A,D,E',location:'buttonz/server/routes.ts:105',message:'Buttonz GFS session route reached',data:{hasGameforgeUrl:Boolean(gameforgeUrl),gameforgeUrl,hasCookie:Boolean(cookie),cookieNameCount:cookie ? cookie.split(";").length : 0},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (!gameforgeUrl || !cookie) {
      return res.status(401).json({ message: "No GameForgeStudio session available" });
    }

    const response = await fetch(new URL("/api/user/current", gameforgeUrl), {
      headers: { cookie },
    });
    // #region agent log
    fetch('http://127.0.0.1:7855/ingest/e6e06c55-184c-447a-b3f0-43f18b3c62bc',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'59f846'},body:JSON.stringify({sessionId:'59f846',runId:'pre-fix-buttonz-auth',hypothesisId:'D,E',location:'buttonz/server/routes.ts:119',message:'Buttonz GFS current-user response',data:{status:response.status,ok:response.ok},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      return res.status(401).json({ message: "GameForgeStudio session was not authenticated" });
    }

    const gameforgeUser = await response.json() as { id?: string };
    if (!gameforgeUser.id) {
      return res.status(401).json({ message: "GameForgeStudio session did not include a user" });
    }

    const user = await storage.getUser(gameforgeUser.id);
    if (!user) {
      return res.status(401).json({ message: "GameForgeStudio account was not found" });
    }

    await createButtonzSession(req, user.id);

    return res.json({
      message: `Welcome, ${user.displayName}!`,
      user: toPublicUser(user),
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((error) => {
      if (error) {
        return res.status(500).json({ message: "Failed to logout" });
      }

      res.clearCookie("buttonz.sid");
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
    return res.json(toPublicUser(user));
  });

  app.get("/api/users", requireAuth, async (_req, res) => {
    const users = await storage.getAllUsers();
    return res.json(users.map(toPublicUser));
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
