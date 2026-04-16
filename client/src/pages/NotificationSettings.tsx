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
  CalendarDays, ListTodo, Sunrise, Send, Loader2, Moon, Clock,
  Inbox, CheckCircle2, XCircle, ChevronDown, ChevronUp, RefreshCw, Trash2, RotateCcw
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
  const { data: queueStats } = trpc.pushNotifications.getQueueStats.useQuery();
  const [showQueueDetails, setShowQueueDetails] = useState(false);
  const [queueFilter, setQueueFilter] = useState<'pending' | 'sent' | 'failed' | undefined>(undefined);
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const { data: queueItems, refetch: refetchQueueItems } = trpc.pushNotifications.getQueueItems.useQuery(
    { status: queueFilter, limit: 20 },
    { enabled: showQueueDetails }
  );

  const retryMutation = trpc.pushNotifications.retryFailed.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Notificação reenviada com sucesso! (${result.sent} dispositivo(s))`);
      } else {
        toast.error(`Falha ao reenviar: ${result.error}`);
      }
      refetchQueueItems();
      utils.pushNotifications.getQueueStats.invalidate();
      setRetryingId(null);
    },
    onError: (err) => {
      toast.error('Erro ao reenviar: ' + err.message);
      setRetryingId(null);
    },
  });

  const retryAllMutation = trpc.pushNotifications.retryAllFailed.useMutation({
    onSuccess: (result) => {
      toast.success(`Reenvio em lote: ${result.success} sucesso, ${result.failed} falha(s) de ${result.retried} total`);
      refetchQueueItems();
      utils.pushNotifications.getQueueStats.invalidate();
    },
    onError: (err) => {
      toast.error('Erro ao reenviar em lote: ' + err.message);
    },
  });

  const cleanMutation = trpc.pushNotifications.cleanOldItems.useMutation({
    onSuccess: (result) => {
      toast.success(`Limpeza concluída: ${result.deleted} registro(s) antigo(s) removido(s)`);
      refetchQueueItems();
      utils.pushNotifications.getQueueStats.invalidate();
    },
    onError: (err) => {
      toast.error('Erro na limpeza: ' + err.message);
    },
  });

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

          {/* Horário Silencioso */}
          <Card className="p-6 border-l-4 border-l-indigo-500">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Moon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Horário Silencioso</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  As notificações push são enviadas apenas entre <strong>07:00</strong> e <strong>21:59</strong> (horário de Manaus).
                  Fora desse período, nenhuma notificação será enviada ao seu dispositivo.
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 font-medium">Ativo: 07:00 – 21:59</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Moon className="h-4 w-4 text-indigo-500" />
                    <span className="text-indigo-600 font-medium">Silencioso: 22:00 – 06:59</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Painel de Fila de Notificações */}
          {(queueStats?.pending || queueStats?.sent || queueStats?.failed) ? (
            <Card className="p-6 border-l-4 border-l-amber-500">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Inbox className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Fila de Notificações</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQueueDetails(!showQueueDetails)}
                    >
                      {showQueueDetails ? (
                        <ChevronUp className="h-4 w-4 mr-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 mr-1" />
                      )}
                      {showQueueDetails ? 'Ocultar' : 'Ver detalhes'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Notificações enviadas durante o horário silencioso são enfileiradas e enviadas às 07:00.
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-amber-700 font-medium">Pendentes: {queueStats?.pending || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-green-700 font-medium">Enviadas: {queueStats?.sent || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-700 font-medium">Falhas: {queueStats?.failed || 0}</span>
                    </div>
                  </div>

                  {showQueueDetails && (
                    <div className="mt-4">
                      <div className="flex gap-2 mb-3">
                        <Button
                          variant={queueFilter === undefined ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setQueueFilter(undefined)}
                        >
                          Todas
                        </Button>
                        <Button
                          variant={queueFilter === 'pending' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setQueueFilter('pending')}
                        >
                          Pendentes
                        </Button>
                        <Button
                          variant={queueFilter === 'sent' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setQueueFilter('sent')}
                        >
                          Enviadas
                        </Button>
                        <Button
                          variant={queueFilter === 'failed' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setQueueFilter('failed')}
                        >
                          Falhas
                        </Button>
                      </div>

                      {/* Botões de ação da fila */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Reenviar TODAS as notificações que falharam?')) {
                              retryAllMutation.mutate();
                            }
                          }}
                          disabled={retryAllMutation.isPending || !queueStats || queueStats.failed === 0}
                          className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        >
                          {retryAllMutation.isPending ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3 mr-1" />
                          )}
                          Reenviar Todos Falhos ({queueStats?.failed || 0})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Limpar registros enviados/falhos com mais de 30 dias?')) {
                              cleanMutation.mutate();
                            }
                          }}
                          disabled={cleanMutation.isPending}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          {cleanMutation.isPending ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 mr-1" />
                          )}
                          Limpar Antigos (+30 dias)
                        </Button>
                      </div>

                      {queueItems && queueItems.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {queueItems.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{item.title}</div>
                                <div className="text-muted-foreground truncate text-xs">{item.body}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Enfileirada: {new Date(item.queuedAt).toLocaleString('pt-BR', { timeZone: 'America/Manaus' })}
                                  {item.sentAt && (
                                    <> · Enviada: {new Date(item.sentAt).toLocaleString('pt-BR', { timeZone: 'America/Manaus' })}</>
                                  )}
                                  {item.error && (
                                    <span className="text-red-500"> · Erro: {item.error}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-2 shrink-0">
                                {(item.status === 'failed' || item.status === 'pending') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setRetryingId(item.id);
                                      retryMutation.mutate({ queueItemId: item.id });
                                    }}
                                    disabled={retryingId === item.id}
                                    className="h-7 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    title="Reenviar esta notificação"
                                  >
                                    {retryingId === item.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                                <Badge
                                  variant={item.status === 'pending' ? 'outline' : item.status === 'sent' ? 'default' : 'destructive'}
                                >
                                  {item.status === 'pending' ? 'Pendente' : item.status === 'sent' ? 'Enviada' : 'Falha'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhuma notificação na fila{queueFilter ? ` com status "${queueFilter === 'pending' ? 'pendente' : queueFilter === 'sent' ? 'enviada' : 'falha'}"` : ''}.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : null}

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
