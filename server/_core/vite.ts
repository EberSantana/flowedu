import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  const indexHtmlPath = path.resolve(distPath, "index.html");

  // Função para servir index.html sem ETag
  // Usa readFile + send em vez de sendFile para evitar que o módulo 'send' adicione ETag
  // O ETag causa 304 Not Modified no browser, servindo conteúdo antigo após deploy
  const serveIndexHtml = (_req: any, res: any) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.removeHeader('ETag');
    res.removeHeader('Last-Modified');
    // Usar readFile + send em vez de sendFile para evitar ETag gerado pelo módulo 'send'
    try {
      const content = fs.readFileSync(indexHtmlPath, 'utf-8');
      res.status(200).send(content);
    } catch (err) {
      res.status(500).send('Internal Server Error');
    }
  };

  // Servir index.html SEPARADAMENTE com no-cache absoluto (ANTES do static)
  // Isso garante que o browser sempre baixe o index.html mais recente após deploy
  app.get(["/", "/index.html"], serveIndexHtml);

  // Servir arquivos estáticos com cache longo (assets com hash são imutáveis)
  // Excluir index.html do static (já tratado acima)
  app.use(express.static(distPath, {
    index: false, // NÃO servir index.html automaticamente
    etag: false,  // Desabilitar ETag para todos os arquivos estáticos
    lastModified: false, // Desabilitar Last-Modified também
    setHeaders: (res, filePath) => {
      // Assets com hash do Vite: cache longo (1 ano)
      if (filePath.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // sw.js e manifest.json: nunca cachear
      else if (filePath.endsWith('sw.js') || filePath.endsWith('manifest.json') || filePath.endsWith('manifest.webmanifest')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

  // Assets com hash (JS/CSS do Vite) que não existem devem retornar 404
  // Isso evita o erro "Failed to fetch dynamically imported module" quando
  // o browser tenta carregar um asset de um build antigo
  app.use("/assets/*", (_req, res) => {
    res.status(404).send("Asset not found");
  });

  // fall through to index.html para SPA routing (todas as outras rotas)
  app.use("*", serveIndexHtml);
}
