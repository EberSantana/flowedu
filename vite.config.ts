import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";

// Versão do package.json
let APP_VERSION = "2.5.0";
try {
  // Tenta ler do diretório atual, depois do diretório pai (para quando executado de dist/)
  const pkgPath = path.resolve(import.meta.dirname, "package.json");
  const pkgPathAlt = path.resolve(import.meta.dirname, "..", "package.json");
  const pkgFile = existsSync(pkgPath) ? pkgPath : pkgPathAlt;
  const pkg = JSON.parse(readFileSync(pkgFile, "utf-8"));
  APP_VERSION = pkg.version;
} catch { /* usa fallback */ }

// Data do build
const BUILD_DATE = new Date().toISOString();

// Hash curto do último commit git
let GIT_HASH = "dev";
try {
  GIT_HASH = execSync("git rev-parse --short HEAD").toString().trim();
} catch { /* fallback para dev */ }


const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
    __GIT_HASH__: JSON.stringify(GIT_HASH),
  },
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      // Força uso de uma única cópia do React em toda a aplicação
      "react": path.resolve(import.meta.dirname, "node_modules", "react"),
      "react-dom": path.resolve(import.meta.dirname, "node_modules", "react-dom"),
      "react/jsx-runtime": path.resolve(import.meta.dirname, "node_modules", "react", "jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(import.meta.dirname, "node_modules", "react", "jsx-dev-runtime"),
    },
    // Garante que apenas uma cópia do React seja usada em toda a aplicação
    dedupe: [
      'react', 
      'react-dom',
      'react-dom/client',
      'react-dom/server',
      'react/jsx-runtime', 
      'react/jsx-dev-runtime',
      '@tanstack/react-query',
      '@trpc/react-query',
    ],
    // Evita que symlinks do pnpm criem caminhos distintos no esbuild
    preserveSymlinks: false,
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          trpc: ['@trpc/client', '@trpc/react-query'],
          query: ['@tanstack/react-query'],
        },
      },
    },
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    // Pré-bundling de dependências críticas para evitar problemas de cache
    include: [
      'react', 
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@trpc/client', 
      '@trpc/react-query',
      '@tanstack/react-query',
    ],
    exclude: [],
    // Força a reconstrução do cache quando as dependências mudam
    force: true,
    // Configurações de esbuild para o pré-bundling
    esbuildOptions: {
      // Garante compatibilidade com JSX
      jsx: 'automatic',
      // Target moderno para melhor performance
      target: 'esnext',
      // Força todos os pacotes a resolver react do mesmo caminho
      plugins: [
        {
          name: 'force-single-react',
          setup(build: any) {
            const reactPath = path.resolve(import.meta.dirname, 'node_modules', 'react');
            const reactDomPath = path.resolve(import.meta.dirname, 'node_modules', 'react-dom');
            build.onResolve({ filter: /^react$/ }, () => ({ path: reactPath + '/index.js' }));
            build.onResolve({ filter: /^react-dom$/ }, () => ({ path: reactDomPath + '/index.js' }));
            build.onResolve({ filter: /^react-dom\/client$/ }, () => ({ path: reactDomPath + '/client.js' }));
            build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({ path: reactPath + '/jsx-runtime.js' }));
            build.onResolve({ filter: /^react\/jsx-dev-runtime$/ }, () => ({ path: reactPath + '/jsx-dev-runtime.js' }));
          },
        },
      ],
    },
  },
  // Configuração do cache do Vite - caminho absoluto para evitar criação em client/node_modules
  cacheDir: path.resolve(import.meta.dirname, 'node_modules/.vite'),
  server: {
    host: true,
    hmr: {
      overlay: true,
      protocol: 'wss',
      clientPort: 443,
      // Timeout maior para conexões HMR
      timeout: 30000,
    },
    // Configuração de watch para detectar mudanças corretamente
    watch: {
      // Usa polling em ambientes onde o watch nativo pode falhar
      usePolling: false,
      // Intervalo de polling (se habilitado)
      interval: 1000,
      // Ignora node_modules para melhor performance
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // Configuração de warmup para pré-carregar módulos frequentemente usados
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/lib/trpc.ts',
      ],
    },
  },
  // Configuração de preview (para produção local)
  preview: {
    host: true,
    port: 4173,
  },
  // Configuração de logging para debug
  logLevel: 'info',
  // Limpa a tela no início do build
  clearScreen: true,
});
