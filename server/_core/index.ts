import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initMuralWebSocket } from "../mural-ws";
import uploadMaterialRouter from "../upload-material";
import extractPdfRouter from "../extract-pdf";
import parseStudentListRouter from "../parse-student-list";
import { backupDownloadRouter } from "../backup-download";
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
  // Em produção, confiar no primeiro proxy (Nginx/Cloudflare)
  app.set("trust proxy", 1);
  app.disable('etag'); // Desabilitar ETag para forçar reload após deploy
  
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
  // 150MB to accommodate base64 encoding overhead (~33% increase over 100MB file limit)
  const uploadLimit = "150mb";
  app.use(express.json({ limit: uploadLimit }));
  app.use(express.urlencoded({ limit: uploadLimit, extended: true }));
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Serve uploaded files from local storage (fallback when S3 is not available)
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '7d',
    immutable: true,
  }));
  // Upload material endpoint
  app.use("/api", uploadMaterialRouter);
  // Extract PDF text endpoint
  app.use("/api", extractPdfRouter);
  // Parse student list endpoint
  app.use("/api", parseStudentListRouter);
  // Backup download endpoint
  app.use("/api", backupDownloadRouter);
  
  // Rota de logout via GET (para links diretos)
  app.get("/api/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    // Limpar cookies com domínio definido
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.clearCookie(STUDENT_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    // Também limpar cookies sem domínio (fallback para cookies definidos de forma diferente)
    res.clearCookie(COOKIE_NAME, { path: "/", httpOnly: true, maxAge: -1 });
    res.clearCookie(STUDENT_COOKIE_NAME, { path: "/", httpOnly: true, maxAge: -1 });
    // Definir cookie de "logout explícito" para prevenir auto-login imediato
    res.cookie('EXPLICIT_LOGOUT', 'true', { ...cookieOptions, maxAge: 60 * 1000 });
    console.log('[Logout] User logged out via /api/logout, hostname:', req.hostname, 'cookieOptions:', JSON.stringify(cookieOptions));
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
        message: 'O arquivo excede o limite máximo de 100MB. Por favor, reduza o tamanho do arquivo ou use um serviço de hospedagem externo.',
        maxSize: '100MB'
      });
    }
    next(err);
  });
  
  // Inicializar WebSocket do Mural Colaborativo
  initMuralWebSocket(server);

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

  // Executar migrações automáticas antes de iniciar o servidor
  try {
    const { runAutoMigrations } = await import('../migrate');
    await runAutoMigrations();
  } catch (err) {
    console.warn('[Migrate] Falha ao executar migrações automáticas:', err);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Inicializar sistema de notificações push
    import('../push-notifications').then(({ initializeVapid, startReminderJob }) => {
      initializeVapid();
      startReminderJob();
    }).catch(error => {
      console.warn('[Push] Falha ao inicializar notificações push:', error);
    });
    
    // Inicializar agendamento de backups
    import('../backup-scheduler').then(({ initializeBackupScheduler }) => {
      initializeBackupScheduler();
    }).catch(error => {
      console.warn('[Scheduler] Falha ao inicializar agendamento de backups:', error);
    });

    // Inicializar relatório semanal automático
    import('../weekly-report').then(({ startWeeklyReportJob }) => {
      startWeeklyReportJob();
    }).catch(error => {
      console.warn('[WeeklyReport] Falha ao inicializar relatório semanal:', error);
    });

    // Inicializar verificador diário de chaves de API de IA
    import('../ai-key-checker').then(({ startApiKeyCheckerJob }) => {
      startApiKeyCheckerJob();
    }).catch(error => {
      console.warn('[AIKeyChecker] Falha ao inicializar verificador de chaves:', error);
    });
  });
}

startServer().catch(console.error);
