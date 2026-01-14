import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import * as LucideIcons from "lucide-react";
import { BookOpen, Users, Clock, Plus, Calendar as CalendarIcon, BarChart3, ArrowRight, AlertCircle, ExternalLink, Lightbulb, Settings, Eye, EyeOff, RotateCcw, Timer, CheckSquare, Square, Trash2, Bell, TrendingUp, CheckCircle2, XCircle, Ban, LogOut, User, UserCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Link } from "wouter";
import { toast } from "sonner";
import { useEffect, useRef, useState, useMemo } from "react";
import { useOnboardingTour } from "@/components/OnboardingTour";
import { GuidedTour } from "@/components/GuidedTour";
import { useAdaptiveDashboard } from "@/hooks/useAdaptiveDashboard";
import { QuickActionsCustomizer, QuickAction } from "@/components/QuickActionsCustomizer";
// ProfileOnboarding removido - perfil único tradicional
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

// Componente de botão de logout
function LogoutButton() {
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error("Erro ao fazer logout: " + error.message);
    },
  });

  const handleLogout = () => {
    if (confirm("Deseja realmente sair do sistema?")) {
      logoutMutation.mutate();
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      size="sm"
      className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
      disabled={logoutMutation.isPending}
    >
      <LogOut className="h-4 w-4" />
      {logoutMutation.isPending ? 'Saindo...' : 'Sair'}
    </Button>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  
  // Tour interativo para novos usuários
  useOnboardingTour();
  
  // Estado para controlar o tour guiado
  const [showGuidedTour, setShowGuidedTour] = useState(() => {
    const hasSeenTour = localStorage.getItem('guided_tour_completed');
    return !hasSeenTour;
  });
  
  const handleTourComplete = () => {
    localStorage.setItem('guided_tour_completed', 'true');
    setShowGuidedTour(false);
  };
  
  // Configuração adaptativa baseada no perfil do professor
  const dashboardConfig = useAdaptiveDashboard();
  const { data: subjects, isLoading: isLoadingSubjects } = trpc.subjects.list.useQuery();
  const { data: classes, isLoading: isLoadingClasses } = trpc.classes.list.useQuery();
  const { data: scheduledClasses, isLoading: isLoadingSchedule } = trpc.schedule.list.useQuery();
  const { data: upcomingClasses, isLoading: isLoadingUpcoming } = trpc.dashboard.getUpcomingClasses.useQuery();
  const { data: todayClasses, isLoading: isLoadingToday } = trpc.dashboard.getTodayClasses.useQuery();
  const { data: upcomingEvents, isLoading: isLoadingEvents } = trpc.dashboard.getUpcomingEvents.useQuery();
  const { data: calendarUpcomingEvents, isLoading: isLoadingCalendar } = trpc.calendar.getUpcomingEvents.useQuery();
  
  // Mutation para atualizar status de aulas
  const utils = trpc.useUtils();
  const setStatusMutation = trpc.classStatus.set.useMutation({
    onSuccess: async () => {
      // Invalidar queries de forma sequencial para evitar race conditions
      await utils.classStatus.getWeek.invalidate();
      await utils.dashboard.getTodayClasses.invalidate();
      toast.success("Status da aula atualizado!");
      setIsStatusDialogOpen(false);
      setStatusReason("");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });
  
  const deleteStatusMutation = trpc.classStatus.delete.useMutation({
    onSuccess: async () => {
      // Invalidar queries de forma sequencial para evitar race conditions
      await utils.classStatus.getWeek.invalidate();
      await utils.dashboard.getTodayClasses.invalidate();
      toast.success("Status removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover status: " + error.message);
    },
  });
  
  // Função para calcular número da semana no ano
  const getWeekNumber = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  };
  
  // Carregar status das aulas da semana atual para cálculo do progresso
  const now = new Date();
  const currentWeekNumber = getWeekNumber(now);
  const currentYear = now.getFullYear();
  const { data: weekClassStatuses } = trpc.classStatus.getWeek.useQuery({
    weekNumber: currentWeekNumber,
    year: currentYear,
  });
  const hasShownToast = useRef(false);
  
  // Estado de personalização do Dashboard
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isCustomizingActions, setIsCustomizingActions] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  
  // Estados para controle de status de aulas
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedClassForStatus, setSelectedClassForStatus] = useState<any>(null);
  const [statusReason, setStatusReason] = useState("");
  const [widgetVisibility, setWidgetVisibility] = useState(() => {
    const saved = localStorage.getItem('dashboardWidgetVisibility');
    return saved ? JSON.parse(saved) : {
      stats: true,
      quickActions: true,
      todayClasses: true,
      upcomingEvents: true,
      weeklyChart: true,
    };
  });
  
  // Salvar preferências no localStorage
  useEffect(() => {
    localStorage.setItem('dashboardWidgetVisibility', JSON.stringify(widgetVisibility));
  }, [widgetVisibility]);
  
  // Carregar preferências de ações rápidas
  const { data: preferences } = trpc.dashboard.getQuickActionsPreferences.useQuery();
  
  useEffect(() => {
    if (preferences?.actions) {
      setQuickActions(preferences.actions);
    } else {
      // Ações padrão se não houver preferências salvas - usando variáveis do tema
      setQuickActions([
        { id: "new-subject", label: "Nova Disciplina", icon: "Plus", href: "/subjects", color: "from-primary to-primary/80", enabled: true },
        { id: "schedule", label: "Grade Completa", icon: "Calendar", href: "/schedule", color: "from-accent to-accent/80", enabled: true },
        { id: "reports", label: "Relatórios", icon: "BarChart3", href: "/reports", color: "from-success to-success/80", enabled: true },
        { id: "tasks", label: "Tarefas", icon: "CheckSquare", href: "/tasks", color: "from-info to-info/80", enabled: true },
        { id: "announcements", label: "Avisos", icon: "Bell", href: "/announcements", color: "from-destructive to-destructive/80", enabled: true },
      ]);
    }
  }, [preferences]);
  
  const toggleWidget = (widgetKey: string) => {
    setWidgetVisibility((prev: any) => ({ ...prev, [widgetKey]: !prev[widgetKey] }));
  };
  
  const resetToDefault = () => {
    const defaultVisibility = {
      stats: true,
      quickActions: true,
      todayClasses: true,
      upcomingEvents: true,
      weeklyChart: true,
    };
    setWidgetVisibility(defaultVisibility);
    toast.success('Layout restaurado para o padrão!');
  };
  

  

  
  // Toast automático para eventos próximos
  useEffect(() => {
    if (calendarUpcomingEvents && calendarUpcomingEvents.length > 0 && !hasShownToast.current) {
      hasShownToast.current = true;
      const count = calendarUpcomingEvents.length;
      toast.info(
        `📢 Você tem ${count} evento${count > 1 ? 's' : ''} nos próximos 3 dias!`,
        {
          description: calendarUpcomingEvents.slice(0, 2).map((e: any) => e.title).join(', ') + (count > 2 ? '...' : ''),
          duration: 5000,
        }
      );
    }
  }, [calendarUpcomingEvents]);

  // Calcular total de aulas agendadas
  const totalScheduledClasses = scheduledClasses?.length || 0;
  
  // Calcular progresso semanal (aulas concluídas vs. total da semana)
  // Agora exclui aulas marcadas como "not_given" ou "cancelled"
  const weeklyProgress = useMemo(() => {
    if (!scheduledClasses || scheduledClasses.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutos desde meia-noite
    
    // Criar mapa de status por scheduledClassId
    const statusMap = new Map<number, string>();
    if (weekClassStatuses) {
      weekClassStatuses.forEach((status: any) => {
        statusMap.set(status.scheduledClassId, status.status);
      });
    }
    
    // Filtrar aulas da semana (segunda a sexta) e excluir as não dadas/canceladas
    const validWeekClasses = scheduledClasses.filter(c => {
      if (c.dayOfWeek < 0 || c.dayOfWeek > 4) return false; // Apenas seg-sex
      const status = statusMap.get(c.id);
      return status !== 'not_given' && status !== 'cancelled'; // Excluir não dadas e canceladas
    });
    
    const totalWeekClasses = validWeekClasses.length;
    
    // Contar aulas já concluídas (dias passados + aulas concluídas hoje)
    let completedClasses = 0;
    
    validWeekClasses.forEach(classItem => {
      const classDayOfWeek = classItem.dayOfWeek;
      const status = statusMap.get(classItem.id);
      
      // Se a aula é de um dia anterior da semana
      if (classDayOfWeek < currentDay) {
        completedClasses++;
      }
      // Se a aula é hoje, verificar se já passou
      else if (classDayOfWeek === currentDay) {
        // Precisamos buscar o horário de fim da aula via timeSlot
        // Por enquanto, vamos considerar que aulas de hoje já passadas contam
        // Isso requer join com timeSlots - vamos simplificar considerando apenas dias passados
        // Para precisão, seria necessário carregar os timeSlots também
      }
    });
    
    const percentage = totalWeekClasses > 0 ? Math.round((completedClasses / totalWeekClasses) * 100) : 0;
    
    return {
      completed: completedClasses,
      total: totalWeekClasses,
      percentage
    };
  }, [scheduledClasses, weekClassStatuses]);
  
  // Calcular tempo até próxima aula
  const [timeToNextClass, setTimeToNextClass] = useState<{hours: number, minutes: number, seconds: number} | null>(null);
  
  useEffect(() => {
    const calculateTimeToNextClass = () => {
      if (!upcomingClasses || upcomingClasses.length === 0) {
        setTimeToNextClass(null);
        return;
      }
      
      const nextClass = upcomingClasses[0];
      const now = new Date();
      const classDateTime = new Date(`${nextClass.date}T${nextClass.startTime}`);
      const diff = classDateTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeToNextClass(null);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeToNextClass({ hours, minutes, seconds });
    };
    
    calculateTimeToNextClass();
    const interval = setInterval(calculateTimeToNextClass, 1000);
    
    return () => clearInterval(interval);
  }, [upcomingClasses]);
  
  // Prazos importantes (eventos dos próximos 7 dias)
  const importantDeadlines = calendarUpcomingEvents?.filter((event: any) => {
    const eventDate = new Date(event.eventDate);
    const now = new Date();
    const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7 && (event.eventType === 'school_event' || event.eventType === 'holiday');
  }).slice(0, 5) || [];

  // Obter cor do tema via CSS custom property
  const getThemeColor = (opacity: number = 1) => {
    if (typeof window === 'undefined') return `rgba(59, 130, 246, ${opacity})`;
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const primaryColor = style.getPropertyValue('--primary').trim();
    // Converter OKLCH para RGB aproximado ou usar fallback
    // Por simplicidade, usamos cores que se adaptam ao tema
    return `oklch(from ${primaryColor || 'oklch(0.55 0.12 230)'} l c h / ${opacity})`;
  };

  // Dados para gráfico de distribuição semanal - cores adaptativas ao tema
  const weeklyDistribution = {
    labels: DAYS_OF_WEEK,
    datasets: [{
      label: 'Aulas por Dia',
      data: [
        scheduledClasses?.filter(c => c.dayOfWeek === 0).length || 0,
        scheduledClasses?.filter(c => c.dayOfWeek === 1).length || 0,
        scheduledClasses?.filter(c => c.dayOfWeek === 2).length || 0,
        scheduledClasses?.filter(c => c.dayOfWeek === 3).length || 0,
        scheduledClasses?.filter(c => c.dayOfWeek === 4).length || 0,
      ],
      borderColor: 'var(--chart-1, rgb(59, 130, 246))',
      backgroundColor: 'color-mix(in oklch, var(--chart-1, rgb(59, 130, 246)) 15%, transparent)',
      fill: true,
      tension: 0.4,
    }]
  };
  
  // Formatar data para exibição (ex: "15/01")
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  };

  // Verificar se aula está acontecendo agora
  const isClassHappeningNow = (date: string, startTime: string, endTime: string) => {
    const now = new Date();
    const classDate = new Date(date);
    
    // Verificar se é o mesmo dia
    if (
      now.getFullYear() !== classDate.getFullYear() ||
      now.getMonth() !== classDate.getMonth() ||
      now.getDate() !== classDate.getDate()
    ) {
      return false;
    }
    
    // Comparar horários
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };
  
  // Funções para manipular status de aulas
  const handleSetStatus = (scheduledClass: any, status: 'given' | 'not_given' | 'cancelled') => {
    const currentStatus = getClassStatus(scheduledClass.id);
    
    // Se o status clicado já é o status atual, desmarcar (remover status)
    if (currentStatus?.status === status) {
      deleteStatusMutation.mutate({ id: currentStatus.id });
      return;
    }
    
    // Caso contrário, marcar com o novo status
    if (status === 'given') {
      // Marcar como dada diretamente (sem dialog)
      setStatusMutation.mutate({
        scheduledClassId: scheduledClass.id,
        weekNumber: currentWeekNumber,
        year: currentYear,
        status: 'given',
      });
    } else {
      // Abrir dialog para adicionar motivo (Não Dada e Cancelada)
      setSelectedClassForStatus({ ...scheduledClass, status });
      setIsStatusDialogOpen(true);
    }
  };

  const handleConfirmStatus = () => {
    if (!selectedClassForStatus) return;
    
    setStatusMutation.mutate({
      scheduledClassId: selectedClassForStatus.id,
      weekNumber: currentWeekNumber,
      year: currentYear,
      status: selectedClassForStatus.status,
      reason: statusReason || undefined,
    });
  };

  const getClassStatus = (scheduledClassId: number) => {
    return weekClassStatuses?.find(s => s.scheduledClassId === scheduledClassId);
  };

  return (
    <>
      {/* ProfileOnboarding removido - perfil único tradicional */}
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar do Usuário */}
              <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-lg">
                <AvatarImage 
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'Professor')}&backgroundColor=6366f1&textColor=ffffff`} 
                  alt={user?.name || 'Professor'}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'P'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {dashboardConfig.welcomeMessage.replace('professor', user?.name || 'Professor')}
                </h1>
                <p className="text-gray-600 mt-1">
                  {dashboardConfig.dashboardDescription}
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {/* Botão de perfil removido - perfil único tradicional */}
              <LogoutButton />
              {isCustomizing && (
                <Button
                  onClick={resetToDefault}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restaurar Padrão
                </Button>
              )}
              <Button
                onClick={() => setIsCustomizing(!isCustomizing)}
                variant={isCustomizing ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                {isCustomizing ? 'Concluir' : 'Personalizar'}
              </Button>
            </div>
          </div>
          
          {/* Painel de Controle de Widgets */}
          {isCustomizing && (
            <Card className="mb-6 bg-white border-2 border-blue-400">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Personalizar Dashboard
                </CardTitle>
                <CardDescription>
                  Escolha quais widgets você deseja exibir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <button
                    onClick={() => toggleWidget('stats')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      widgetVisibility.stats
                        ? 'bg-blue-100 border-blue-500 text-blue-900'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {widgetVisibility.stats ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </div>
                    <p className="text-sm font-medium">Estatísticas</p>
                  </button>
                  
                  <button
                    onClick={() => toggleWidget('quickActions')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      widgetVisibility.quickActions
                        ? 'bg-blue-100 border-blue-500 text-blue-900'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {widgetVisibility.quickActions ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </div>
                    <p className="text-sm font-medium">Ações Rápidas</p>
                  </button>
                  
                  <button
                    onClick={() => toggleWidget('todayClasses')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      widgetVisibility.todayClasses
                        ? 'bg-blue-100 border-blue-500 text-blue-900'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {widgetVisibility.todayClasses ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </div>
                    <p className="text-sm font-medium">Aulas de Hoje</p>
                  </button>
                  
                  <button
                    onClick={() => toggleWidget('upcomingEvents')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      widgetVisibility.upcomingEvents
                        ? 'bg-blue-100 border-blue-500 text-blue-900'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {widgetVisibility.upcomingEvents ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </div>
                    <p className="text-sm font-medium">Eventos Próximos</p>
                  </button>
                  
                  <button
                    onClick={() => toggleWidget('weeklyChart')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      widgetVisibility.weeklyChart
                        ? 'bg-blue-100 border-blue-500 text-blue-900'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {widgetVisibility.weeklyChart ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </div>
                    <p className="text-sm font-medium">Gráfico Semanal</p>
                  </button>
                  
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cards          {/* Estatísticas */}
          {widgetVisibility.stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6" data-tour="stats">          {isLoadingSubjects || isLoadingClasses || isLoadingSchedule ? (
              // Skeleton Loading
              <>
                <Card className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-9 w-16 mb-2" />
                    <Skeleton className="h-3 w-40" />
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-9 w-16 mb-2" />
                    <Skeleton className="h-3 w-40" />
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-9 w-16 mb-2" />
                    <Skeleton className="h-3 w-40" />
                  </CardContent>
                </Card>
              </>
            ) : (
              // Conteúdo Real
              <>
                <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Disciplinas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {subjects?.length || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">disciplinas cadastradas</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Turmas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {classes?.length || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">turmas cadastradas</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Carga Horária
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {totalScheduledClasses}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">aulas agendadas</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          )}

          {/* Grid Principal: Ações Rápidas + Próximas Aulas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
          {/* Ações Rápidas */}
          {widgetVisibility.quickActions && (
          <Card className="overflow-hidden" data-tour="quick-actions">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Ações Rápidas</CardTitle>
                    <CardDescription className="text-gray-600">Acesso rápido às funcionalidades principais</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCustomizingActions(true)}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Personalizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Botão Próxima Aula em Destaque com Dropdown */}
                <div className="mb-4">
                  <div
                    className={`group relative overflow-hidden rounded-xl bg-gradient-to-br p-4 shadow-lg transition-all duration-300 ${
                      upcomingClasses && upcomingClasses.length > 0
                        ? 'from-info to-info/80 hover:shadow-xl'
                        : 'from-muted to-muted/80 opacity-60'
                    }`}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 text-white mb-2">
                        <ExternalLink className="h-6 w-6 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm font-bold block">Ir para Próxima Aula</span>
                          {upcomingClasses && upcomingClasses.length > 0 && (
                            <span className="text-xs opacity-90">
                              {upcomingClasses[0].subjectName} - {upcomingClasses[0].startTime}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Opções de Acesso */}
                      {upcomingClasses && upcomingClasses.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => {
                              const url = upcomingClasses[0].googleClassroomUrl;
                              if (url) {
                                window.open(url, '_blank');
                              } else {
                                toast.error('⚠️ Link do Google Classroom não cadastrado para esta disciplina.');
                              }
                            }}
                            disabled={!upcomingClasses[0].googleClassroomUrl}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                              upcomingClasses[0].googleClassroomUrl
                                ? 'bg-white/20 hover:bg-white/30 text-white cursor-pointer'
                                : 'bg-white/10 text-white/50 cursor-not-allowed'
                            }`}
                            title={upcomingClasses[0].googleClassroomUrl ? 'Abrir Google Classroom' : 'Link não cadastrado'}
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M1.636 11.636v-.727C1.636 6.073 5.709 2 10.545 2h2.91c4.836 0 8.909 4.073 8.909 8.909v.727c0 .4-.328.728-.728.728h-1.454c-.4 0-.727-.327-.727-.728v-.727c0-3.636-2.982-6.618-6.618-6.618h-2.182c-3.636 0-6.618 2.982-6.618 6.618v.727c0 .4-.327.728-.727.728H2.364c-.4 0-.728-.328-.728-.728zm8.91 10.546c-2.018 0-3.637-1.637-3.637-3.637v-2.181c0-2.018 1.619-3.637 3.637-3.637s3.636 1.619 3.636 3.637v2.181c0 2-1.618 3.637-3.636 3.637zm0-7.273c-1.2 0-2.182.982-2.182 2.182v2.181c0 1.2.982 2.182 2.182 2.182s2.181-.982 2.181-2.182v-2.181c0-1.2-.981-2.182-2.181-2.182z"/>
                            </svg>
                            Classroom
                          </button>
                          <button
                            onClick={() => {
                              const url = upcomingClasses[0].googleDriveUrl;
                              if (url) {
                                window.open(url, '_blank');
                              } else {
                                toast.error('⚠️ Link do Google Drive não cadastrado para esta disciplina.');
                              }
                            }}
                            disabled={!upcomingClasses[0].googleDriveUrl}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                              upcomingClasses[0].googleDriveUrl
                                ? 'bg-white/20 hover:bg-white/30 text-white cursor-pointer'
                                : 'bg-white/10 text-white/50 cursor-not-allowed'
                            }`}
                            title={upcomingClasses[0].googleDriveUrl ? 'Abrir Google Drive' : 'Link não cadastrado'}
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M7.71 3.5L1.15 15l3.58 6.5L11.29 9.5 7.71 3.5zM2.73 15l5.58-9.5h5.58l-5.58 9.5H2.73zm9.56 6.5L8.71 15h11.58l3.58 6.5H12.29zm6.29-6.5l-5.58-9.5h5.58L22.15 15h-3.57z"/>
                            </svg>
                            Drive
                          </button>
                        </div>
                      )}
                      
                      {(!upcomingClasses || upcomingClasses.length === 0) && (
                        <p className="text-xs text-white/70 text-center">Nenhuma aula agendada para hoje</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid de Ações Dinâmico */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {quickActions.filter(action => action.enabled).map((action) => {
                    const IconComponent = (LucideIcons as any)[action.icon] || LucideIcons.HelpCircle;
                    return (
                      <Link key={action.id} href={action.href}>
                        <div className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${action.color} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer h-32`}>
                          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                            <IconComponent className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-semibold text-center">{action.label}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Aulas de Hoje */}
            {widgetVisibility.todayClasses && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-success/5 to-info/5 border-b">
                <CardTitle className="text-xl font-bold text-gray-900">Aulas de Hoje</CardTitle>
                <CardDescription className="text-gray-600">Sua programação de aulas para hoje</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {todayClasses && todayClasses.length > 0 ? (
                  <div className="space-y-4">
                    {todayClasses.map((cls, idx) => (
                      <div
                        key={idx}
                        className={`group relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg ${
                          cls.isHoliday 
                            ? 'bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300' 
                            : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {/* Barra lateral colorida */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2"
                          style={{ backgroundColor: cls.subjectColor || '#6B7280' }}
                        />
                        
                        <div className="p-3 pl-5">
                          <div className="flex items-center gap-2">
                            {/* Indicador de Data e Dia - Compacto */}
                            <div className={`flex flex-col items-center justify-center rounded-lg px-2.5 py-2 min-w-[70px] shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                              cls.isHoliday
                                ? 'bg-gradient-to-br from-destructive via-destructive/90 to-destructive/80'
                                : 'bg-gradient-to-br from-primary via-primary/90 to-primary/80'
                            }`}>
                              <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                                {cls.dayOfWeek.substring(0, 3)}
                              </span>
                              <span className="text-xl font-extrabold text-white">
                                {formatDate(cls.date)}
                              </span>
                            </div>
                            
                            {/* Horário - Compacto */}
                            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg px-2.5 py-2 border border-gray-200 min-w-[65px] shadow-sm">
                              <Clock className="h-4 w-4 text-blue-600 mb-0.5" />
                              <span className="text-xs font-bold text-gray-900">
                                {cls.startTime}
                              </span>
                              <span className="text-[10px] text-gray-500 font-medium">
                                {cls.endTime}
                              </span>
                            </div>
                            
                            {/* Informações da aula - Flex otimizado */}
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-start gap-2 flex-wrap">
                                <p className="font-bold text-gray-900 text-base leading-tight break-words max-w-full">
                                  {cls.subjectName}
                                </p>
                                {isClassHappeningNow(cls.date, cls.startTime, cls.endTime) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-md whitespace-nowrap">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                    </span>
                                    AGORA
                                  </span>
                                )}
                                {cls.isPast && !isClassHappeningNow(cls.date, cls.startTime, cls.endTime) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-400 text-white text-[10px] font-bold rounded-full shadow-sm whitespace-nowrap">
                                    Concluída
                                  </span>
                                )}
                                
                                {/* Indicador de Status */}
                                {(() => {
                                  const status = getClassStatus(cls.id);
                                  if (status) {
                                    return (
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-white text-[10px] font-bold rounded-full shadow-sm whitespace-nowrap ${
                                        status.status === 'given' ? 'bg-green-500' :
                                        status.status === 'not_given' ? 'bg-yellow-500' :
                                        'bg-red-500'
                                      }`}>
                                        {status.status === 'given' && <CheckCircle2 className="h-3 w-3" />}
                                        {status.status === 'not_given' && <XCircle className="h-3 w-3" />}
                                        {status.status === 'cancelled' && <Ban className="h-3 w-3" />}
                                        {status.status === 'given' ? 'Dada' :
                                         status.status === 'not_given' ? 'Não Dada' :
                                         'Cancelada'}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              <p className="text-xs text-gray-600 font-medium mt-0.5">
                                Turma: <span className="text-blue-600 font-semibold">{cls.className}</span>
                              </p>
                              {cls.isHoliday && (
                                <div className="flex items-center gap-1.5 mt-1.5 bg-red-100 border border-red-300 rounded-md px-2 py-1">
                                  <AlertCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
                                  <p className="text-[10px] text-red-700 font-bold">
                                    Feriado: {cls.holidayName}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Botões de Status */}
                          {!cls.isHoliday && (
                            <div className="mt-3 flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant={getClassStatus(cls.id)?.status === 'given' ? 'default' : 'outline'}
                                className={`flex-1 min-w-[100px] h-8 text-xs ${
                                  getClassStatus(cls.id)?.status === 'given'
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'hover:bg-green-50 hover:border-green-500 hover:text-green-700'
                                }`}
                                onClick={() => handleSetStatus(cls, 'given')}
                                disabled={setStatusMutation.isPending || deleteStatusMutation.isPending}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                Dada
                              </Button>
                              
                              <Button
                                size="sm"
                                variant={getClassStatus(cls.id)?.status === 'not_given' ? 'default' : 'outline'}
                                className={`flex-1 min-w-[100px] h-8 text-xs ${
                                  getClassStatus(cls.id)?.status === 'not_given'
                                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                    : 'hover:bg-yellow-50 hover:border-yellow-500 hover:text-yellow-700'
                                }`}
                                onClick={() => handleSetStatus(cls, 'not_given')}
                                disabled={setStatusMutation.isPending || deleteStatusMutation.isPending}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                Não Dada
                              </Button>
                              
                              <Button
                                size="sm"
                                variant={getClassStatus(cls.id)?.status === 'cancelled' ? 'default' : 'outline'}
                                className={`flex-1 min-w-[100px] h-8 text-xs ${
                                  getClassStatus(cls.id)?.status === 'cancelled'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'hover:bg-red-50 hover:border-red-500 hover:text-red-700'
                                }`}
                                onClick={() => handleSetStatus(cls, 'cancelled')}
                                disabled={setStatusMutation.isPending || deleteStatusMutation.isPending}
                              >
                                <Ban className="h-3.5 w-3.5 mr-1.5" />
                                Cancelada
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">Nenhuma aula agendada para hoje</p>
                    <p className="text-xs mt-1">Aproveite o dia livre! 🎉</p>
                    <Link href="/schedule">
                      <Button variant="link" className="mt-2 text-blue-600 text-xs">
                        Ver grade completa <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </div>

          {/* Widget: Eventos Próximos do Calendário (3 dias) */}
          {widgetVisibility.upcomingEvents && calendarUpcomingEvents && calendarUpcomingEvents.length > 0 && (
            <Card className="mb-8 overflow-hidden border-2 border-warning/30 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-warning/5 via-warning/10 to-destructive/5 border-b-2 border-warning/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      Eventos Próximos
                    </CardTitle>
                    <CardDescription className="text-gray-600">Eventos nos próximos 3 dias</CardDescription>
                  </div>
                  <Link href="/calendar">
                    <Button variant="outline" size="sm" className="border-warning/50 hover:bg-warning/5">
                      Ver Calendário <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {calendarUpcomingEvents.map((event: any) => {
                    const eventDate = new Date(event.eventDate + 'T00:00:00');
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);
                    const dayAfterTomorrow = new Date(today);
                    dayAfterTomorrow.setDate(today.getDate() + 2);
                    
                    // Determinar urgência
                    let urgencyColor = 'bg-yellow-500';
                    let urgencyText = 'Em 2-3 dias';
                    if (eventDate.getTime() === today.getTime()) {
                      urgencyColor = 'bg-red-500';
                      urgencyText = 'HOJE';
                    } else if (eventDate.getTime() === tomorrow.getTime()) {
                      urgencyColor = 'bg-orange-500';
                      urgencyText = 'AMANHÃ';
                    }
                    
                    const dayMonth = eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                    const dayOfWeek = eventDate.toLocaleDateString('pt-BR', { weekday: 'short' });
                    
                    // Estilos por tipo de evento
                    const eventStyles: any = {
                      holiday: { icon: '🎉', label: 'Feriado', borderColor: 'border-red-300', bgColor: 'bg-white' },
                      commemorative: { icon: '🎂', label: 'Data Comemorativa', borderColor: 'border-amber-300', bgColor: 'bg-white' },
                      school_event: { icon: '🏫', label: 'Evento Escolar', borderColor: 'border-blue-300', bgColor: 'bg-white' },
                      personal: { icon: '📌', label: 'Observação', borderColor: 'border-purple-300', bgColor: 'bg-white' },
                    };
                    
                    const style = eventStyles[event.eventType] || eventStyles.personal;
                    
                    return (
                      <div
                        key={event.id}
                        className={`relative p-4 rounded-xl border-2 ${style.borderColor} ${style.bgColor} hover:shadow-lg transition-all duration-300`}
                      >
                        {/* Badge de Urgência */}
                        <div className={`absolute -top-2 -right-2 ${urgencyColor} text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md`}>
                          {urgencyText}
                        </div>
                        
                        <div className="flex items-start gap-3">
                          {/* Ícone */}
                          <div className="text-3xl">
                            {style.icon}
                          </div>
                          
                          {/* Conteúdo */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm mb-1 truncate">
                              {event.title}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2">
                              {dayOfWeek}, {dayMonth}
                            </p>
                            <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/50 border border-gray-300">
                              {style.label}
                            </span>
                            {event.description && (
                              <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Distribuição Semanal */}
          {widgetVisibility.weeklyChart && scheduledClasses && scheduledClasses.length > 0 && (
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">Distribuição Semanal</CardTitle>
                      <CardDescription className="text-sm text-gray-500 mt-0.5">Carga horária por dia da semana</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{totalScheduledClasses}</div>
                    <div className="text-xs text-gray-500 mt-0.5">aulas/semana</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {/* Barra de estatísticas resumidas */}
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {DAYS_OF_WEEK.map((day, index) => {
                    const count = scheduledClasses?.filter(c => c.dayOfWeek === index).length || 0;
                    const percentage = totalScheduledClasses > 0 ? (count / totalScheduledClasses) * 100 : 0;
                    return (
                      <div key={day} className="text-center">
                        <div className="text-xs font-medium text-gray-500 mb-1">{day.substring(0, 3)}</div>
                        <div className="text-lg font-bold text-gray-900">{count}</div>
                        <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Gráfico de linha */}
                <div className="h-48 mt-4">
                  <Line
                    data={weeklyDistribution}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          padding: 12,
                          titleFont: {
                            size: 14,
                            weight: 'bold',
                          },
                          bodyFont: {
                            size: 13,
                          },
                          cornerRadius: 8,
                          displayColors: false,
                        },
                      },
                      scales: {
                        x: {
                          grid: {
                            display: false,
                          },
                          ticks: {
                            font: {
                              size: 11,
                              weight: 500,
                            },
                            color: '#6B7280',
                          },
                        },
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1,
                            font: {
                              size: 11,
                            },
                            color: '#6B7280',
                          },
                          grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          




          {/* Aviso quando não há disciplinas */}
          {(!subjects || subjects.length === 0) && (
            <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-yellow-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Comece Criando Disciplinas
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  Você ainda não possui disciplinas cadastradas. Comece criando suas primeiras disciplinas para organizar sua grade de horários.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/subjects">
                  <Button className="bg-yellow-600 hover:bg-yellow-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira Disciplina
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </PageWrapper>
      
      {/* Dialog de Status de Aula */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedClassForStatus?.status === 'not_given' ? 'Marcar Aula como Não Dada' : 'Marcar Aula como Cancelada'}
            </DialogTitle>
            <DialogDescription>
              Adicione um motivo opcional para esta marcação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Falta por motivo de saúde, Reunião pedagógica, Feriado municipal..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmStatus}
                disabled={setStatusMutation.isPending}
              >
                {setStatusMutation.isPending ? 'Salvando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Personalização de Ações Rápidas */}
      <QuickActionsCustomizer
        open={isCustomizingActions}
        onOpenChange={setIsCustomizingActions}
        onSave={(actions) => setQuickActions(actions)}
      />
      
      {/* Tour Guiado */}
      <GuidedTour run={showGuidedTour} onComplete={handleTourComplete} />
    </>
  );
}
