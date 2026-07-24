import type { Request } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

export const BUTTONZ_SESSION_COOKIE = "buttonz.sid";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000;

function requireSessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is required and must contain at least 32 characters.",
    );
  }
  return secret;
}

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for persistent Buttonz sessions.");
  }
  return databaseUrl;
}

export function createSessionMiddleware() {
  const PostgresSessionStore = connectPgSimple(session);

  return session({
    name: BUTTONZ_SESSION_COOKIE,
    secret: requireSessionSecret(),
    store: new PostgresSessionStore({
      conString: requireDatabaseUrl(),
      tableName: "buttonz_sessions",
      createTableIfMissing: true,
    }),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_MS,
    },
  });
}

function regenerateSession(req: Request) {
  return new Promise<void>((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function saveSession(req: Request) {
  return new Promise<void>((resolve, reject) => {
    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

export async function establishButtonzSession(req: Request, userId: string) {
  await regenerateSession(req);
  req.session.userId = userId;
  await saveSession(req);
}
