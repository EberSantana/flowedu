import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";


const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    // Garante que apenas uma cópia do React seja usada em toda a aplicação
    dedupe: [
      'react', 
      'react-dom', 
      'react/jsx-runtime', 
      'react/jsx-dev-runtime',
      '@tanstack/react-query',
      '@trpc/react-query',
    ],
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
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@trpc/client', 
      '@trpc/react-query',
      '@tanstack/react-query',
    ],
    exclude: [],
    // Força a reconstrução do cache quando as dependências mudam
    force: false,
    // Configurações de esbuild para o pré-bundling
    esbuildOptions: {
      // Garante compatibilidade com JSX
      jsx: 'automatic',
      // Target moderno para melhor performance
      target: 'esnext',
    },
  },
  // Configuração do cache do Vite
  cacheDir: 'node_modules/.vite',
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
