/**
 * PushActivationBanner
 * Modal exibido na primeira vez que o usuário faz login
 * pedindo para ativar as notificações push.
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, BellOff, X } from "lucide-react";

const STORAGE_KEY = "flowedu_push_banner_dismissed";

export default function PushActivationBanner() {
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  const { data: vapidKeyData } = trpc.pushNotifications.getVapidKey.useQuery(undefined, {
    enabled: visible,
  });

  const subscribeMutation = trpc.pushNotifications.subscribe.useMutation({
    onSuccess: () => {
      toast.success("✅ Notificações push ativadas! Você receberá avisos mesmo com o app fechado.");
      dismiss();
    },
    onError: (err) => {
      toast.error("Erro ao ativar notificações: " + err.message);
      setSubscribing(false);
    },
  });

  // Detectar iOS
  const isIOS = typeof window !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;

  useEffect(() => {
    // Só mostrar se:
    // 1. Notificações push são suportadas
    // 2. Permissão ainda não foi concedida nem negada
    // 3. Usuário não dispensou o banner antes
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // iOS Safari: PushManager pode existir mas não funciona via Web Push
      // Mostrar banner apenas se não for iOS, ou se for iOS com suporte real
      const hasPushSupport = "PushManager" in window && !isIOS;
      if (hasPushSupport) {
        setPushSupported(true);
        const perm = Notification.permission;
        if (perm === "default") {
          const timer = setTimeout(() => setVisible(true), 2500);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [isIOS]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const handleEnable = async () => {
    if (isIOS) {
      toast.error("Notificações push não são suportadas no iOS Safari. Use Android ou desktop.");
      dismiss();
      return;
    }
    if (!pushSupported || !vapidKeyData?.key) {
      toast.error("Notificações push não disponíveis neste navegador");
      return;
    }
    setSubscribing(true);
    try {
      // Timeout de 10s para evitar travamento
      const permissionPromise = Notification.requestPermission();
      const permission = await Promise.race([
        permissionPromise,
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("Tempo esgotado ao solicitar permissão")), 10000)
        ),
      ]) as NotificationPermission;

      if (permission !== "granted") {
        toast.error("Permissão negada. Você pode ativar depois em Comunicação → Notificações Push.");
        dismiss();
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await Promise.race([
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKeyData.key,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Tempo esgotado ao registrar push")), 15000)
        ),
      ]);
      const subJson = subscription.toJSON();
      await subscribeMutation.mutateAsync({
        endpoint: subJson.endpoint!,
        keys: {
          p256dh: subJson.keys!.p256dh!,
          auth: subJson.keys!.auth!,
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error("Erro ao ativar notificações: " + msg);
      setSubscribing(false);
    }
  };

  if (!visible || !pushSupported) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm mx-4 sm:mx-0">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-full p-2">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Ativar Notificações</p>
              <p className="text-xs text-muted-foreground">Receba avisos mesmo com o app fechado</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Descrição */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Seja notificado sobre <strong>novos avisos</strong>, <strong>atividades</strong>,{" "}
          <strong>notas lançadas</strong> e <strong>lembretes de aula</strong> diretamente no seu celular ou computador.
        </p>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={handleEnable}
            disabled={subscribing}
          >
            {subscribing ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Ativando...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5" />
                Ativar agora
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={dismiss}
            className="flex items-center gap-1.5 text-muted-foreground"
          >
            <BellOff className="h-3.5 w-3.5" />
            Agora não
          </Button>
        </div>
      </div>
    </div>
  );
}
