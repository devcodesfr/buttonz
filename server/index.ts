import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { log, serveStatic, setupVite } from "./vite";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required for Buttonz.");
}

const app = express();

app.use(session({
  name: "buttonz.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Buttonz server error:", error);

    if (res.headersSent) {
      return;
    }

    const message = error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ message });
  });

  if (process.env.USE_VITE_MIDDLEWARE === "true") {
    await setupVite(app, server);
  } else if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5001", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`Buttonz serving on port ${port}`);
  });
})();
