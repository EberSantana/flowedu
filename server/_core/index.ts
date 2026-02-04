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
import helmet from "helmet";
import rateLimit from "express-rate-limit";

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
  
  // ============================================
  // SEGURANÇA - Trust Proxy (apenas Nginx)
  // ============================================
  // Configurar trust proxy apenas para Nginx local (127.0.0.1)
  // Isso permite rate limiting correto sem permitir falsificação de IPs
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", "loopback"); // Apenas localhost/127.0.0.1
  }
  
  // ============================================
  // SEGURANÇA - Proteção contra Path Traversal
  // ============================================
  app.use((req, res, next) => {
    // Bloquear tentativas de path traversal
    const suspiciousPatterns = [
      /\.\.[\/\\]/,  // ../ ou ..\\
      /%2e%2e/i,      // URL encoded ..
      /%252e/i,       // Double URL encoded .
      /\/proc\//i,    // Acesso a /proc/
      /\/etc\//i,     // Acesso a /etc/
      /\/sys\//i,     // Acesso a /sys/
    ];
    
    const path = decodeURIComponent(req.url);
    if (suspiciousPatterns.some(pattern => pattern.test(path))) {
      console.warn(`[Security] Blocked path traversal attempt: ${req.ip} -> ${req.url}`);
      return res.status(403).json({ error: "Forbidden" });
    }
    
    next();
  });
  
  // ============================================
  // SEGURANÇA - Headers HTTP (Helmet)
  // ============================================
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://analytics.manus.im", "https://cloud.umami.is"],
        scriptSrcAttr: ["'unsafe-inline'"],
        connectSrc: ["'self'", "https://api.manus.im", "https://analytics.manus.im", "https://cloud.umami.is", "https://api-gateway.umami.dev", "wss:"],
        mediaSrc: ["'self'", "data:", "blob:"],
      },
    } : false, // Desabilitado em desenvolvimento para HMR funcionar
    crossOriginEmbedderPolicy: false, // Permite embeds de terceiros
  }));
  
  // ============================================
  // SEGURANÇA - Rate Limiting
  // ============================================
  
  // Rate limiter geral - 100 requisições por minuto por IP
  const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // máximo 100 requisições por minuto
    message: { error: "Muitas requisições. Tente novamente em 1 minuto." },
    standardHeaders: true,
    legacyHeaders: false,
    // Usar IP real do usuário via X-Forwarded-For (apenas do Nginx)
    skip: (req) => {
      // Em desenvolvimento, não aplicar rate limiting
      return process.env.NODE_ENV !== "production";
    },
  });
  
  // Rate limiter para rotas de autenticação - 10 tentativas por 15 minutos
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // máximo 10 tentativas
    message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Não conta requisições bem-sucedidas
  });
  
  // Rate limiter para APIs de IA - 20 requisições por minuto
  const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 20, // máximo 20 requisições por minuto
    message: { error: "Limite de requisições de IA atingido. Aguarde 1 minuto." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  // Aplicar rate limiter geral em produção
  if (process.env.NODE_ENV === "production") {
    app.use(generalLimiter);
  }
  
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
  
  // ============================================
  // Rate limiting específico para rotas de auth
  // ============================================
  // Aplicar rate limiter de auth em rotas específicas
  app.use("/api/trpc/auth.loginStudent", authLimiter);
  app.use("/api/trpc/auth.loginTeacher", authLimiter);
  app.use("/api/trpc/auth.register", authLimiter);
  app.use("/api/trpc/auth.requestPasswordReset", authLimiter);
  
  // Rate limiter para rotas de IA
  app.use("/api/trpc/learningPath.generateWithAI", aiLimiter);
  app.use("/api/trpc/learningPath.generateModulesFromEmenta", aiLimiter);
  app.use("/api/trpc/studentReview.generateStudyMaterial", aiLimiter);
  
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
