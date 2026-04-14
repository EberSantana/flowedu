import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Bell, BellRing, BellOff, Smartphone, BarChart3, BookOpen, 
  CalendarDays, ListTodo, Sunrise, Send, Loader2
} from "lucide-react";

export default function NotificationSettings() {
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const { data: vapidKeyData } = trpc.pushNotifications.getVapidKey.useQuery();
  const vapidKey = vapidKeyData?.key;
  const { data: prefs, refetch: refetchPrefs } = trpc.pushNotifications.getPreferences.useQuery();
  const { data: stats, refetch: refetchStats } = trpc.pushNotifications.getStats.useQuery();

  const subscribeMutation = trpc.pushNotifications.subscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(true);
      refetchStats();
      toast.success("Notificações push ativadas!");
    },
    onError: (err) => {
      toast.error("Erro ao ativar notificações: " + err.message);
    },
  });

  const unsubscribeMutation = trpc.pushNotifications.unsubscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(false);
      refetchStats();
      toast.success("Notificações push desativadas!");
    },
    onError: (err) => {
      toast.error("Erro ao desativar notificações: " + err.message);
    },
  });

  const savePrefsMutation = trpc.pushNotifications.savePreferences.useMutation({
    onSuccess: () => {
      refetchPrefs();
      toast.success("Preferências salvas!");
    },
    onError: (err) => {
      toast.error("Erro ao salvar preferências: " + err.message);
    },
  });

  const sendTestMutation = trpc.pushNotifications.sendTest.useMutation({
    onSuccess: (result) => {
      if (result.sent > 0) {
        toast.success(`Notificação de teste enviada para ${result.sent} dispositivo(s)!`);
      } else {
        toast.error("Nenhum dispositivo ativo encontrado");
      }
    },
    onError: (err) => {
      toast.error("Erro ao enviar teste: " + err.message);
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
      
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  const handleEnablePush = async () => {
    if (!pushSupported || !vapidKeyData) {
      toast.error("Notificações push não são suportadas neste navegador");
      return;
    }

    if (pushPermission === "denied") {
      toast.error("Permissão de notificações negada. Habilite nas configurações do navegador.");
      return;
    }

    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission !== "granted") {
        toast.error("Permissão de notificações negada");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      const subJson = subscription.toJSON();
      await subscribeMutation.mutateAsync({
        endpoint: subJson.endpoint!,
        keys: {
          p256dh: subJson.keys!.p256dh!,
          auth: subJson.keys!.auth!,
        },
      });
    } catch (error: any) {
      toast.error("Erro ao ativar notificações: " + error.message);
    } finally {
      setSubscribing(false);
    }
  };

  const handleDisablePush = async () => {
    setSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }
      
      const endpoint = subscription?.endpoint || '';
      await unsubscribeMutation.mutateAsync({ endpoint });
    } catch (error: any) {
      toast.error("Erro ao desativar notificações: " + error.message);
    } finally {
      setSubscribing(false);
    }
  };

  const handleSendTest = async () => {
    if (!isSubscribed) {
      toast.error("Ative as notificações primeiro");
      return;
    }

    try {
      await sendTestMutation.mutateAsync();
    } catch (error: any) {
      toast.error("Erro ao enviar teste: " + error.message);
    }
  };

  const togglePreference = async (key: string, value: boolean) => {
    if (!isSubscribed) {
      toast.error("Ative as notificações primeiro para configurar preferências");
      return;
    }

    try {
      // Enviar apenas os campos aceitos pelo schema, sem campos extras (id, userId, etc.)
      const cleanPrefs = {
        classReminders: prefs?.classReminders ?? true,
        eventReminders: prefs?.eventReminders ?? true,
        taskReminders: prefs?.taskReminders ?? true,
        dailySummary: prefs?.dailySummary ?? false,
        classReminderMinutes: prefs?.classReminderMinutes ?? 15,
        eventReminderMinutes: prefs?.eventReminderMinutes ?? 60,
        dailySummaryTime: prefs?.dailySummaryTime ?? '07:00',
        activeDays: Array.isArray(prefs?.activeDays) ? prefs.activeDays : [1, 2, 3, 4, 5],
        quietHoursStart: prefs?.quietHoursStart ?? '22:00',
        quietHoursEnd: prefs?.quietHoursEnd ?? '06:00',
        [key]: value,
      };
      await savePrefsMutation.mutateAsync(cleanPrefs);
    } catch (error: any) {
      toast.error("Erro ao salvar preferência: " + error.message);
    }
  };

  const notificationTypes = [
    {
      id: "classReminders",
      icon: BookOpen,
      title: "Lembretes de Aula",
      description: "Receba um lembrete antes de cada aula",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      id: "eventReminders",
      icon: CalendarDays,
      title: "Lembretes de Eventos",
      description: "Feriados, eventos escolares e datas comemorativas",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      id: "taskReminders",
      icon: ListTodo,
      title: "Lembretes de Tarefas",
      description: "Tarefas com prazo para hoje ou amanhã",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      id: "dailySummary",
      icon: Sunrise,
      title: "Resumo Diário",
      description: "Resumo das aulas e eventos do dia pela manhã",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <PageWrapper className="flex-1">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Notificações Push
              </h1>
              <p className="text-muted-foreground mt-1">
                Configure lembretes automáticos para aulas, eventos e tarefas
              </p>
            </div>
            <Button 
              onClick={isSubscribed ? handleDisablePush : handleEnablePush}
              disabled={!pushSupported || pushPermission === "denied" || subscribing}
              className={isSubscribed ? "bg-red-600 hover:bg-red-700 text-white" : "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"}
            >
              {subscribing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isSubscribed ? (
                <BellOff className="h-4 w-4 mr-2" />
              ) : (
                <BellRing className="h-4 w-4 mr-2" />
              )}
              {isSubscribed ? "Desativar Notificações" : "Ativar Notificações"}
            </Button>
          </div>

          {/* Status Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Status das Notificações</h3>
                  <p className="text-sm text-muted-foreground">
                    {isSubscribed 
                      ? "Notificações ativadas. Você receberá lembretes sobre aulas e eventos." 
                      : "Ative as notificações para receber lembretes automáticos"}
                  </p>
                </div>
              </div>
              {stats && (
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="flex items-center gap-2 py-2 px-3">
                    <Smartphone className="h-4 w-4" />
                    <span className="font-semibold">{stats.activeSubscriptions}</span>
                    <span className="text-muted-foreground">dispositivo(s)</span>
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-2 py-2 px-3">
                    <BarChart3 className="h-4 w-4" />
                    <span className="font-semibold">{stats.totalSent}</span>
                    <span className="text-muted-foreground">enviada(s)</span>
                  </Badge>
                </div>
              )}
            </div>
            {isSubscribed && (
              <div className="mt-4 pt-4 border-t flex gap-3">
                <Button 
                  onClick={handleSendTest}
                  disabled={sendTestMutation.isPending || !isSubscribed}
                  variant="outline"
                  size="sm"
                >
                  {sendTestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar Teste
                </Button>
              </div>
            )}
          </Card>

          {/* Notification Types Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Tipos de Lembrete</h2>
            <p className="text-muted-foreground mb-4">
              Escolha quais tipos de notificação deseja receber
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notificationTypes.map((type) => {
                const Icon = type.icon;
                const isEnabled = prefs?.[type.id as keyof typeof prefs] ?? false;
                
                return (
                  <Card 
                    key={type.id} 
                    className="group hover:shadow-md transition-all duration-300"
                  >
                    <div className={`h-2 bg-gradient-to-r ${type.color}`} />
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`h-12 w-12 rounded-lg ${type.bgColor} flex items-center justify-center shrink-0`}>
                            <Icon className={`h-6 w-6 ${type.iconColor}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{type.title}</h3>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => togglePreference(type.id, checked)}
                          disabled={!isSubscribed || savePrefsMutation.isPending}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
