import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import uploadMaterialRouter from "../upload-material";
import extractPdfRouter from "../extract-pdf";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME, STUDENT_COOKIE_NAME } from "../../shared/const";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Configure body parser with larger size limit for file uploads
  // 100MB to accommodate base64 encoding overhead (~33% increase)
  const uploadLimit = "100mb";
  app.use(express.json({ limit: uploadLimit }));
  app.use(express.urlencoded({ limit: uploadLimit, extended: true }));
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Upload material endpoint
  app.use("/api", uploadMaterialRouter);
  // Extract PDF text endpoint
  app.use("/api", extractPdfRouter);
  // Rota de logout via GET (para links diretos)
  app.get("/api/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.clearCookie(STUDENT_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.redirect("/");
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // Error handling middleware for payload too large
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.type === 'entity.too.large') {
      console.error('[Upload] PayloadTooLargeError:', err.message);
      return res.status(413).json({
        error: 'Arquivo muito grande',
        message: 'O arquivo excede o limite máximo de 75MB. Por favor, reduza o tamanho do arquivo ou use um serviço de hospedagem externo.',
        maxSize: '75MB'
      });
    }
    next(err);
  });
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
