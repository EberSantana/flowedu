import { Button } from "@/components/ui/button";
import { Download, X, Smartphone, Zap, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Verificar se já foi instalado
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) {
      return;
    }

    // Verificar se o usuário já dispensou o prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      return;
    }

    const handler = (e: Event) => {
      // Prevenir o prompt automático do navegador
      e.preventDefault();
      
      // Armazenar o evento para usar depois
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar nosso prompt customizado após 10 segundos
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 10000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Mostrar o prompt de instalação
    await deferredPrompt.prompt();

    // Aguardar a escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`[PWA] Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);

    // Limpar o prompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom duration-500">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-2xl p-5 relative overflow-hidden">
        {/* Padrão de fundo decorativo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
        
        <div className="relative">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Download className="h-7 w-7 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-1">
                📱 Instale o FlowEdu
              </h3>
              <p className="text-sm text-blue-50 mb-3">
                Acesse mais rápido e use offline!
              </p>
              
              {/* Benefícios */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-blue-50">
                  <Smartphone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Ícone na tela inicial</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-blue-50">
                  <Zap className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Carregamento instantâneo</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-blue-50">
                  <Wifi className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Funciona sem internet</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="flex-1 bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-md"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Instalar Agora
                </Button>
                
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  Depois
                </Button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-white/70 hover:text-white transition-colors -mt-1 -mr-1"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
