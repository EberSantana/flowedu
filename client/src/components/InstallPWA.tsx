import { Button } from "@/components/ui/button";
import { Download, X, Smartphone, Zap, Share } from "lucide-react";
import { useEffect, useState } from "react";
import { useInstallPWA, isIOS } from "@/hooks/useInstallPWA";

const DISMISSED_KEY = "pwa-install-dismissed";
const DISMISSED_DAYS = 7;

function isDismissedRecently(): boolean {
  const v = localStorage.getItem(DISMISSED_KEY);
  if (!v) return false;
  return Date.now() - parseInt(v, 10) < DISMISSED_DAYS * 24 * 60 * 60 * 1000;
}

export function InstallPWA() {
  const { canInstall, installed, triggerInstall } = useInstallPWA();
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (installed || dismissed || isDismissedRecently()) return;
    if (!canInstall) return;
    const timer = setTimeout(() => {
      setShowBanner(true);
      if (isIOS()) setShowIOSGuide(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [canInstall, installed, dismissed]);

  function handleDismiss() {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  }

  async function handleInstall() {
    const result = await triggerInstall();
    if (result === "ios") setShowIOSGuide(true);
    else if (result === "accepted") setShowBanner(false);
  }

  if (!showBanner || installed) return null;

  if (showIOSGuide) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom duration-500">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-5 relative">
          <button onClick={handleDismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors" aria-label="Fechar">
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
              <div className="text-sm">Toque no botão <strong className="inline-flex items-center gap-1">Compartilhar <Share className="h-3.5 w-3.5" /></strong> na barra inferior do Safari</div>
            </div>
            <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-3">
              <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
              <div className="text-sm">Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></div>
            </div>
            <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-3">
              <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
              <div className="text-sm">Toque em <strong>"Adicionar"</strong> no canto superior direito</div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleDismiss}>Entendi</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom duration-500">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl shadow-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -mr-14 -mt-14 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-10 -mb-10 pointer-events-none" />
        <button onClick={handleDismiss} className="absolute top-3 right-3 text-primary-foreground/70 hover:text-primary-foreground transition-colors" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <img src="/icon-192.png" alt="FlowEdu" className="w-10 h-10 rounded-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-0.5">📱 Instale o FlowEdu</h3>
            <p className="text-sm text-primary-foreground/80 mb-3">Acesse como um app — mais rápido e fácil!</p>
            <div className="flex items-center gap-3 mb-4 text-xs text-primary-foreground/80">
              <span className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" />Ícone na tela inicial</span>
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" />Acesso rápido</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInstall} size="sm" className="flex-1 bg-white text-primary hover:bg-white/90 font-semibold shadow-md">
                <Download className="h-4 w-4 mr-2" />Instalar
              </Button>
              <Button onClick={handleDismiss} variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/20">Depois</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Botão compacto para menus e sidebars
// Aparece sempre (mesmo sem beforeinstallprompt), exceto quando já instalado como PWA
export function InstallPWAButton({ className }: { className?: string }) {
  const { installPrompt, installed, triggerInstall } = useInstallPWA();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Não mostrar se já está instalado como PWA (modo standalone)
  if (installed) return null;

  async function handleClick() {
    if (installPrompt) {
      // Android/Chrome: usa o prompt nativo
      const result = await triggerInstall();
      if (result === "ios") setShowIOSGuide(true);
    } else {
      // iOS ou browser sem suporte nativo: mostra guia manual
      setShowIOSGuide(true);
    }
  }

  return (
    <>
      <button onClick={handleClick} className={className}>
        <Download className="mr-2 h-4 w-4" />
        <span>Instalar App</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50" onClick={() => setShowIOSGuide(false)}>
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Instalar o FlowEdu</h3>
              <button onClick={() => setShowIOSGuide(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            {isIOS() ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <p className="text-sm">Toque no botão <strong>Compartilhar <Share className="inline h-3.5 w-3.5" /></strong> na barra inferior do Safari</p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <p className="text-sm">Role e toque em <strong>"Adicionar à Tela de Início"</strong></p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                  <p className="text-sm">Toque em <strong>"Adicionar"</strong> no canto superior direito</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Para instalar o FlowEdu como app no seu dispositivo:</p>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <p className="text-sm">No Chrome, toque no menu <strong>⋮</strong> (três pontos) no canto superior direito</p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <p className="text-sm">Toque em <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar app"</strong></p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                  <p className="text-sm">Confirme tocando em <strong>"Instalar"</strong></p>
                </div>
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => setShowIOSGuide(false)}>Entendido</Button>
          </div>
        </div>
      )}
    </>
  );
}
