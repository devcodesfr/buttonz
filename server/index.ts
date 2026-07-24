import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import { registerRoutes } from "./routes";
import { createSessionMiddleware } from "./session";
import { log, serveStatic } from "./runtime";

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(createSessionMiddleware());

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

    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error instanceof Error
          ? error.message
          : "Internal Server Error";
    res.status(500).json({ message });
  });

  if (process.env.USE_VITE_MIDDLEWARE === "true") {
    const viteModulePath = "./vite";
    const { setupVite } = await import(viteModulePath);
    await setupVite(app, server);
  } else if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5001", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`Buttonz serving on port ${port}`);
  });
})();
