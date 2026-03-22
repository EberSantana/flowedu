import { Button } from "@/components/ui/button";
import { Download, X, Smartphone, Zap, Share, MoreVertical } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Detecta se é iOS (iPhone/iPad)
function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// Detecta se é Android
function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

// Detecta se já está instalado como PWA
function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Não mostrar se já está instalado
    if (isStandalone()) return;

    // Não mostrar se o usuário já dispensou nas últimas 7 dias
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < sevenDays) return;
    }

    if (isIOS()) {
      // iOS: mostrar guia manual após 5 segundos
      const timer = setTimeout(() => {
        setShowBanner(true);
        setShowIOSGuide(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome: capturar evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostrar banner após 5 segundos
      setTimeout(() => setShowBanner(true), 5000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Instalação: ${outcome}`);
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showBanner) return null;

  // Banner para iOS — instruções manuais
  if (showIOSGuide) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom duration-500">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-5 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <img src="/icon-192.png" alt="FlowEdu" className="w-8 h-8 rounded-lg" />
            </div>
            <div>
              <h3 className="font-bold text-base">Instale o FlowEdu</h3>
              <p className="text-xs text-muted-foreground">Adicione à tela inicial do iPhone/iPad</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-3">
              <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
              <div className="text-sm">
                Toque no botão <strong className="inline-flex items-center gap-1">Compartilhar <Share className="h-3.5 w-3.5" /></strong> na barra inferior do Safari
              </div>
            </div>
            <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-3">
              <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
              <div className="text-sm">
                Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-3">
              <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
              <div className="text-sm">
                Toque em <strong>"Adicionar"</strong> no canto superior direito
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleDismiss}
          >
            Entendi
          </Button>
        </div>
      </div>
    );
  }

  // Banner para Android/Chrome — instalação automática
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom duration-500">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl shadow-2xl p-5 relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -mr-14 -mt-14 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-10 -mb-10 pointer-events-none" />

        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <img src="/icon-192.png" alt="FlowEdu" className="w-10 h-10 rounded-lg" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-0.5">📱 Instale o FlowEdu</h3>
            <p className="text-sm text-primary-foreground/80 mb-3">
              Acesse como um app — mais rápido e fácil!
            </p>

            <div className="flex items-center gap-3 mb-4 text-xs text-primary-foreground/80">
              <span className="flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" />
                Ícone na tela inicial
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Acesso rápido
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="flex-1 bg-white text-primary hover:bg-white/90 font-semibold shadow-md"
              >
                <Download className="h-4 w-4 mr-2" />
                Instalar
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-white/20"
              >
                Depois
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
