import { Link } from "wouter";
import { ArrowLeft, Smartphone, Share, MoreVertical, Download, CheckCircle2, Apple, Chrome } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StudentLayout from "@/components/StudentLayout";
import { useEffect, useState } from "react";

function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppPage() {
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setAlreadyInstalled(isStandalone());
    if (isIOS()) setPlatform("ios");
    else if (isAndroid()) setPlatform("android");

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstalling(false);
    if (outcome === "accepted") {
      setAlreadyInstalled(true);
    }
  };

  return (
    <StudentLayout>
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        {/* Voltar */}
        <Link href="/student-dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Início
          </Button>
        </Link>

        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mr-4">
              <img src="/icon-192.png" alt="FlowEdu" className="w-10 h-10 rounded-xl" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold">Instalar o App</h1>
              <p className="text-muted-foreground">FlowEdu na sua tela inicial</p>
            </div>
          </div>
        </div>

        {/* Já instalado */}
        {alreadyInstalled && (
          <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200">App já instalado!</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    O FlowEdu já está na sua tela inicial. Você pode abrí-lo diretamente pelo ícone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefícios */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Por que instalar?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "⚡", title: "Acesso rápido", desc: "Abra direto da tela inicial, sem precisar abrir o navegador" },
                { icon: "🔔", title: "Notificações", desc: "Receba avisos do professor em tempo real" },
                { icon: "📱", title: "Tela cheia", desc: "Interface sem barras do navegador, igual a um app nativo" },
                { icon: "🔒", title: "Seguro", desc: "Seus dados ficam protegidos, sem instalar nada na loja" },
              ].map((item) => (
                <div key={item.title} className="bg-muted/50 rounded-xl p-3">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instruções Android */}
        {(platform === "android" || platform === "other") && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Chrome className="h-5 w-5 text-blue-500" />
                Android / Chrome
                {platform === "android" && <Badge className="ml-2 text-xs">Seu dispositivo</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deferredPrompt && !alreadyInstalled ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    Seu navegador está pronto para instalar o FlowEdu!
                  </p>
                  <Button
                    onClick={handleInstall}
                    disabled={installing}
                    size="lg"
                    className="w-full max-w-xs"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {installing ? "Instalando..." : "Instalar Agora"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    {
                      step: 1,
                      icon: <Chrome className="h-4 w-4" />,
                      text: <>Abra o FlowEdu no <strong>Google Chrome</strong> (flowedu.app)</>,
                    },
                    {
                      step: 2,
                      icon: <MoreVertical className="h-4 w-4" />,
                      text: <>Toque nos <strong>3 pontos (⋮)</strong> no canto superior direito</>,
                    },
                    {
                      step: 3,
                      icon: <Download className="h-4 w-4" />,
                      text: <>Toque em <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar app"</strong></>,
                    },
                    {
                      step: 4,
                      icon: <CheckCircle2 className="h-4 w-4" />,
                      text: <>Confirme tocando em <strong>"Instalar"</strong> ou <strong>"Adicionar"</strong></>,
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3 bg-muted/40 rounded-xl p-3">
                      <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {item.step}
                      </div>
                      <div className="text-sm leading-relaxed">{item.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instruções iOS */}
        {(platform === "ios" || platform === "other") && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5" />
                iPhone / iPad (Safari)
                {platform === "ios" && <Badge className="ml-2 text-xs">Seu dispositivo</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    step: 1,
                    text: <>Abra o FlowEdu no <strong>Safari</strong> — obrigatório, não funciona no Chrome no iOS</>,
                  },
                  {
                    step: 2,
                    text: (
                      <>
                        Toque no botão <strong className="inline-flex items-center gap-1">Compartilhar <Share className="h-3.5 w-3.5 inline" /></strong> na barra inferior (ícone de caixa com seta para cima)
                      </>
                    ),
                  },
                  {
                    step: 3,
                    text: <>Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></>,
                  },
                  {
                    step: 4,
                    text: <>Edite o nome se quiser e toque em <strong>"Adicionar"</strong> no canto superior direito</>,
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3 bg-muted/40 rounded-xl p-3">
                    <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <div className="text-sm leading-relaxed">{item.text}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>⚠️ Importante:</strong> No iPhone e iPad, a instalação só funciona pelo <strong>Safari</strong>. Se estiver usando outro navegador, copie o link e abra no Safari.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rodapé */}
        <p className="text-center text-sm text-muted-foreground">
          Dúvidas? Fale com seu professor ou acesse a{" "}
          <Link href="/student-help" className="text-primary hover:underline">
            Central de Ajuda
          </Link>
          .
        </p>
      </div>
    </StudentLayout>
  );
}
