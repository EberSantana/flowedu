import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { 
  Bell, BellRing, BellOff, Clock, Calendar, CheckSquare, 
  Sun, Moon, Send, BarChart3, Smartphone, Loader2, ArrowLeft,
  BookOpen, CalendarDays, ListTodo, Sunrise, Search
} from "lucide-react";

const DAYS_OF_WEEK = [
  { value: 0, label: "Dom", fullLabel: "Domingo" },
  { value: 1, label: "Seg", fullLabel: "Segunda" },
  { value: 2, label: "Ter", fullLabel: "Terça" },
  { value: 3, label: "Qua", fullLabel: "Quarta" },
  { value: 4, label: "Qui", fullLabel: "Quinta" },
  { value: 5, label: "Sex", fullLabel: "Sexta" },
  { value: 6, label: "Sáb", fullLabel: "Sábado" },
];

const REMINDER_MINUTES_OPTIONS = [
  { value: 5, label: "5 minutos" },
  { value: 10, label: "10 minutos" },
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
];

const EVENT_REMINDER_OPTIONS = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 60, label: "1 hora" },
  { value: 120, label: "2 horas" },
  { value: 1440, label: "1 dia" },
];

const SUMMARY_TIME_OPTIONS = [
  { value: "06:00", label: "06:00" },
  { value: "06:30", label: "06:30" },
  { value: "07:00", label: "07:00" },
  { value: "07:30", label: "07:30" },
  { value: "08:00", label: "08:00" },
];

export default function NotificationSettings() {
  const [, setLocation] = useLocation();
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: vapidKey } = trpc.pushNotifications.getVapidKey.useQuery();
  const { data: prefs, refetch: refetchPrefs } = trpc.pushNotifications.getPreferences.useQuery();
  const { data: stats } = trpc.pushNotifications.getStats.useQuery();

  const subscribeMutation = trpc.pushNotifications.subscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(true);
      toast.success("Notificações push ativadas!");
    },
    onError: (err) => {
      toast.error("Erro ao ativar notificações: " + err.message);
    },
  });

  const unsubscribeMutation = trpc.pushNotifications.unsubscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(false);
      toast.success("Notificações push desativadas");
    },
  });

  const savePrefsMutation = trpc.pushNotifications.savePreferences.useMutation({
    onSuccess: () => {
      refetchPrefs();
      toast.success("Preferências salvas!");
    },
    onError: (err) => {
      toast.error("Erro ao salvar: " + err.message);
    },
  });

  const sendTestMutation = trpc.pushNotifications.sendTest.useMutation({
    onSuccess: (result) => {
      if (result.sent > 0) {
        toast.success("Notificação de teste enviada! Verifique seu navegador.");
      } else {
        toast.error("Nenhuma notificação enviada. Verifique se as notificações estão ativadas.");
      }
    },
    onError: (err) => {
      toast.error("Erro ao enviar teste: " + err.message);
    },
  });

  // Verificar suporte a push notifications
  useEffect(() => {
    const checkPushSupport = async () => {
      const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
      setPushSupported(supported);
      
      if (supported) {
        setPushPermission(Notification.permission);
        
        // Verificar se já está inscrito
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error("Erro ao verificar subscription:", error);
        }
      }
    };
    
    checkPushSupport();
  }, []);

  // Ativar notificações push
  const handleEnablePush = async () => {
    if (!vapidKey?.key) {
      toast.error("Chave VAPID não disponível. Configure as variáveis de ambiente.");
      return;
    }

    setSubscribing(true);
    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission !== "granted") {
        toast.error("Permissão de notificação negada. Habilite nas configurações do navegador.");
        setSubscribing(false);
        return;
      }

      // Registrar subscription
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey.key) as BufferSource,
      });

      const subJson = subscription.toJSON();
      
      // Enviar para o servidor
      await subscribeMutation.mutateAsync({
        endpoint: subJson.endpoint!,
        keys: {
          p256dh: subJson.keys!.p256dh!,
          auth: subJson.keys!.auth!,
        },
        userAgent: navigator.userAgent,
      });
    } catch (error: any) {
      console.error("Erro ao ativar push:", error);
      toast.error("Erro ao ativar notificações: " + error.message);
    } finally {
      setSubscribing(false);
    }
  };

  // Desativar notificações push
  const handleDisablePush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await unsubscribeMutation.mutateAsync({ endpoint });
      }
    } catch (error: any) {
      console.error("Erro ao desativar push:", error);
      toast.error("Erro ao desativar: " + error.message);
    }
  };

  // Salvar preferência individual
  const updatePref = (key: string, value: any) => {
    if (!prefs) return;
    savePrefsMutation.mutate({
      ...prefs,
      activeDays: Array.isArray(prefs.activeDays) ? prefs.activeDays : [1, 2, 3, 4, 5],
      [key]: value,
    });
  };

  // Toggle dia da semana
  const toggleDay = (day: number) => {
    if (!prefs) return;
    const currentDays = Array.isArray(prefs.activeDays) ? prefs.activeDays : [1, 2, 3, 4, 5];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d: number) => d !== day)
      : [...currentDays, day].sort();
    updatePref("activeDays", newDays);
  };

  const tabs = [
    { id: "all", label: "Todas" },
    { id: "active", label: "Ativas" },
    { id: "inactive", label: "Inativas" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <PageWrapper>
        <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
          {/* Voltar ao Dashboard */}
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </button>

          {/* Header com Título e Subtítulo */}
          <div>
            <div className="flex items-start gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notificações Push</h1>
                <p className="text-gray-600 mt-1">
                  Configure lembretes automáticos para aulas, eventos e tarefas
                </p>
              </div>
            </div>
          </div>

          {/* Botão de Ação e Stats */}
          <div className="flex items-center justify-between">
            <Button 
              onClick={handleEnablePush}
              disabled={!pushSupported || pushPermission === "denied" || subscribing || isSubscribed}
              className="bg-primary hover:bg-primary/90"
            >
              {subscribing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BellRing className="h-4 w-4 mr-2" />
              )}
              {isSubscribed ? "Notificações Ativas" : "Ativar Notificações"}
            </Button>
            
            {stats && (
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  {stats.activeSubscriptions} dispositivo(s)
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {stats.totalSent} enviada(s)
                </Badge>
              </div>
            )}
          </div>

          {/* Barra de Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar notificações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>

          {/* Abas de Filtro */}
          <div className="flex gap-2 border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary -mb-px"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Card */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSubscribed ? (
                    <BellRing className="h-5 w-5 text-green-600" />
                  ) : (
                    <BellOff className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <CardTitle>Status das Notificações</CardTitle>
                    <CardDescription>
                      {!pushSupported 
                        ? "Seu navegador não suporta notificações push. Use Chrome, Firefox ou Edge."
                        : pushPermission === "denied"
                        ? "Notificações bloqueadas. Habilite nas configurações do navegador."
                        : isSubscribed
                        ? "Notificações ativadas. Você receberá lembretes sobre aulas e eventos."
                        : "Ative as notificações para receber lembretes automáticos."
                      }
                    </CardDescription>
                  </div>
                </div>
                {isSubscribed && (
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    Ativo
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex gap-2">
              {isSubscribed ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleDisablePush}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <BellOff className="h-4 w-4 mr-2" />
                    Desativar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => sendTestMutation.mutate()}
                    disabled={sendTestMutation.isPending}
                  >
                    {sendTestMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Enviar Teste
                  </Button>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  {pushPermission === "denied" && "As notificações foram bloqueadas. Habilite nas configurações do navegador."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tipos de Lembrete */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle>Tipos de Lembrete</CardTitle>
              <CardDescription>
                Escolha quais tipos de notificação deseja receber
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Lembretes de Aula */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <Label className="text-base font-medium">Lembretes de Aula</Label>
                    <p className="text-sm text-gray-600">
                      Receba um lembrete antes de cada aula
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={prefs?.classReminders ?? true}
                  onCheckedChange={(checked) => updatePref("classReminders", checked)}
                />
              </div>

              {prefs?.classReminders && (
                <div className="ml-13 pl-4 border-l-2 border-blue-200">
                  <Label className="text-sm text-gray-600">Antecedência</Label>
                  <Select 
                    value={String(prefs?.classReminderMinutes ?? 15)}
                    onValueChange={(v) => updatePref("classReminderMinutes", parseInt(v))}
                  >
                    <SelectTrigger className="w-48 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_MINUTES_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label} antes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              {/* Lembretes de Eventos */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <Label className="text-base font-medium">Lembretes de Eventos</Label>
                    <p className="text-sm text-gray-600">
                      Feriados, eventos escolares e datas comemorativas
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={prefs?.eventReminders ?? true}
                  onCheckedChange={(checked) => updatePref("eventReminders", checked)}
                />
              </div>

              <Separator />

              {/* Lembretes de Tarefas */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <ListTodo className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <Label className="text-base font-medium">Lembretes de Tarefas</Label>
                    <p className="text-sm text-gray-600">
                      Tarefas com prazo para hoje ou amanhã
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={prefs?.taskReminders ?? true}
                  onCheckedChange={(checked) => updatePref("taskReminders", checked)}
                />
              </div>

              <Separator />

              {/* Resumo Diário */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Sunrise className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <Label className="text-base font-medium">Resumo Diário</Label>
                    <p className="text-sm text-gray-600">
                      Resumo das aulas e eventos do dia pela manhã
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={prefs?.dailySummary ?? false}
                  onCheckedChange={(checked) => updatePref("dailySummary", checked)}
                />
              </div>

              {prefs?.dailySummary && (
                <div className="ml-13 pl-4 border-l-2 border-green-200">
                  <Label className="text-sm text-gray-600">Horário do resumo</Label>
                  <Select 
                    value={prefs?.dailySummaryTime ?? "07:00"}
                    onValueChange={(v) => updatePref("dailySummaryTime", v)}
                  >
                    <SelectTrigger className="w-48 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUMMARY_TIME_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dias e Horários */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Dias e Horários
              </CardTitle>
              <CardDescription>
                Configure quando deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dias ativos */}
              <div>
                <Label className="text-base font-medium mb-3 block">Dias ativos</Label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS_OF_WEEK.map(day => {
                    const activeDays = Array.isArray(prefs?.activeDays) 
                      ? prefs.activeDays 
                      : [1, 2, 3, 4, 5];
                    const isActive = activeDays.includes(day.value);
                    return (
                      <Button
                        key={day.value}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDay(day.value)}
                        className={`w-12 h-12 rounded-full ${
                          isActive ? "" : "text-gray-600"
                        }`}
                        title={day.fullLabel}
                      >
                        {day.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Horário silencioso */}
              <div>
                <Label className="text-base font-medium mb-1 block flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Horário Silencioso
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Nenhuma notificação será enviada durante este período
                </p>
                <div className="flex items-center gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">Início</Label>
                    <Select 
                      value={prefs?.quietHoursStart ?? "22:00"}
                      onValueChange={(v) => updatePref("quietHoursStart", v)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const h = String(i).padStart(2, '0');
                          return (
                            <SelectItem key={h} value={`${h}:00`}>
                              {h}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-gray-600 mt-4">até</span>
                  <div>
                    <Label className="text-xs text-gray-600">Fim</Label>
                    <Select 
                      value={prefs?.quietHoursEnd ?? "06:00"}
                      onValueChange={(v) => updatePref("quietHoursEnd", v)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const h = String(i).padStart(2, '0');
                          return (
                            <SelectItem key={h} value={`${h}:00`}>
                              {h}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bell className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-sm text-blue-800 space-y-1">
                  <p className="font-medium">Como funcionam as notificações push?</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>As notificações são enviadas diretamente para o seu navegador</li>
                    <li>Funcionam mesmo quando o site não está aberto</li>
                    <li>Lembretes de aula são enviados com a antecedência configurada</li>
                    <li>Eventos do calendário são notificados pela manhã do dia</li>
                    <li>Você pode desativar a qualquer momento</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </div>
  );
}

// Converte VAPID key de base64 para Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
