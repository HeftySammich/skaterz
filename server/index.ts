import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { detectEnvironment, envLog } from "../shared/environment";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const env = detectEnvironment();
  const server = await registerRoutes(app);

  envLog(`Starting Zombie Skaterz on ${env.platform} platform`);
  envLog(`Environment: ${env.isDevelopment ? 'development' : 'production'}`);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup vite in development and after setting up all other routes
  // so the catch-all route doesn't interfere with the other routes
  if (env.isDevelopment) {
    await setupVite(app, server);
    envLog("Vite development server initialized");
  } else {
    serveStatic(app);
    envLog("Static file serving initialized");
  }

  // Use environment-specific port configuration
  // Default to 5000 for production, but use 3000 for local development if 5000 is busy
  const port = env.platform === 'local' ? (process.env.PORT || 3000) : 5000;
  // Use appropriate host for environment (avoid IPv6 issues on local)
  const host = env.platform === 'local' ? '127.0.0.1' : '0.0.0.0';

  // Configure listen options based on environment
  const listenOptions: any = { port, host };
  if (env.platform !== 'local') {
    listenOptions.reusePort = true; // Only use reusePort in production environments
  }

  server.listen(listenOptions, () => {
    envLog(`Server running on ${host}:${port}`);
    log(`serving on port ${port}`);
  });
})();
