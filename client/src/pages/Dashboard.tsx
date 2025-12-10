import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Clock, Plus, Calendar as CalendarIcon, BarChart3, ArrowRight, AlertCircle, ExternalLink, Lightbulb, Settings, Eye, EyeOff, RotateCcw, Timer, CheckSquare, Square, Trash2, Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Link } from "wouter";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
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

export default function Dashboard() {
  const { user } = useAuth();
  const { data: subjects } = trpc.subjects.list.useQuery();
  const { data: classes } = trpc.classes.list.useQuery();
  const { data: scheduledClasses } = trpc.schedule.list.useQuery();
  const { data: upcomingClasses } = trpc.dashboard.getUpcomingClasses.useQuery();
  const { data: todayClasses } = trpc.dashboard.getTodayClasses.useQuery();
  const { data: upcomingEvents } = trpc.dashboard.getUpcomingEvents.useQuery();
  const { data: calendarUpcomingEvents } = trpc.calendar.getUpcomingEvents.useQuery();
  const hasShownToast = useRef(false);
  
  // Estado de personalização do Dashboard
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [widgetVisibility, setWidgetVisibility] = useState(() => {
    const saved = localStorage.getItem('dashboardWidgetVisibility');
    return saved ? JSON.parse(saved) : {
      stats: true,
      quickActions: true,
      todayClasses: true,
      upcomingEvents: true,
      weeklyChart: true,
      timeToNextClass: true,
      todoList: true,
      importantDeadlines: true,
    };
  });
  
  // Salvar preferências no localStorage
  useEffect(() => {
    localStorage.setItem('dashboardWidgetVisibility', JSON.stringify(widgetVisibility));
  }, [widgetVisibility]);
  
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
      timeToNextClass: true,
      todoList: true,
      importantDeadlines: true,
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
  
  // ===== NOVOS WIDGETS =====
  
  // Estado da lista de tarefas
  const [todoItems, setTodoItems] = useState<Array<{id: string, text: string, completed: boolean}>>(() => {
    const saved = localStorage.getItem('dashboardTodoList');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTodoText, setNewTodoText] = useState('');
  
  // Salvar tarefas no localStorage
  useEffect(() => {
    localStorage.setItem('dashboardTodoList', JSON.stringify(todoItems));
  }, [todoItems]);
  
  const addTodoItem = () => {
    if (newTodoText.trim()) {
      setTodoItems([...todoItems, { id: Date.now().toString(), text: newTodoText.trim(), completed: false }]);
      setNewTodoText('');
    }
  };
  
  const toggleTodoItem = (id: string) => {
    setTodoItems(todoItems.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };
  
  const deleteTodoItem = (id: string) => {
    setTodoItems(todoItems.filter(item => item.id !== id));
  };
  
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

  // Dados para gráfico de distribuição semanal
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
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
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

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bem-vindo, {user?.name || 'Professor'}!
              </h1>
              <p className="text-gray-600 mt-1">
                Visão geral do seu sistema de gestão de tempo
              </p>
            </div>
            <div className="flex gap-2">
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
            <Card className="mb-6 bg-blue-50 border-2 border-blue-200">
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
                  
                  <button
                    onClick={() => toggleWidget('timeToNextClass')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      widgetVisibility.timeToNextClass
                        ? 'bg-blue-100 border-blue-500 text-blue-900'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {widgetVisibility.timeToNextClass ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </div>
                    <p className="text-sm font-medium">Contador de Tempo</p>
                  </button>
                  
                  <button
                    onClick={() => toggleWidget('todoList')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      widgetVisibility.todoList
                        ? 'bg-blue-100 border-blue-500 text-blue-900'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {widgetVisibility.todoList ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </div>
                    <p className="text-sm font-medium">Lista de Tarefas</p>
                  </button>
                  
                  <button
                    onClick={() => toggleWidget('importantDeadlines')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      widgetVisibility.importantDeadlines
                        ? 'bg-blue-100 border-blue-500 text-blue-900'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {widgetVisibility.importantDeadlines ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </div>
                    <p className="text-sm font-medium">Prazos Importantes</p>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cards de Métricas Principais */}
          {widgetVisibility.stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          </div>
          )}

          {/* Grid Principal: Ações Rápidas + Próximas Aulas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Ações Rápidas */}
            {widgetVisibility.quickActions && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-900">Ações Rápidas</CardTitle>
                <CardDescription className="text-gray-600">Acesso rápido às funcionalidades principais</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Botão Próxima Aula em Destaque com Dropdown */}
                <div className="mb-4">
                  <div
                    className={`group relative overflow-hidden rounded-xl bg-gradient-to-br p-4 shadow-lg transition-all duration-300 ${
                      upcomingClasses && upcomingClasses.length > 0
                        ? 'from-teal-500 to-teal-600 hover:shadow-xl'
                        : 'from-gray-400 to-gray-500 opacity-60'
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

                {/* Grid de Ações */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link href="/subjects">
                  <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer h-32">
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                      <Plus className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold text-center">Nova Disciplina</span>
                    </div>
                  </div>
                </Link>
                
                <Link href="/schedule">
                  <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer h-32">
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                      <CalendarIcon className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold text-center">Grade Completa</span>
                    </div>
                  </div>
                </Link>

                <Link href="/classes">
                  <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer h-32">
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                      <Users className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold text-center">Gerenciar Turmas</span>
                    </div>
                  </div>
                </Link>

                <Link href="/calendar">
                  <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer h-32">
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                      <BarChart3 className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold text-center">Calendário</span>
                    </div>
                  </div>
                </Link>

                <Link href="/active-methodologies">
                  <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer h-32">
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                      <Lightbulb className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold text-center">Metodologias</span>
                    </div>
                  </div>
                </Link>

                </div>
              </CardContent>
            </Card>
            )}

            {/* Aulas de Hoje */}
            {widgetVisibility.todayClasses && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
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
                        
                        <div className="flex items-center gap-2 p-3 pl-5">
                          {/* Indicador de Data e Dia - Compacto */}
                          <div className={`flex flex-col items-center justify-center rounded-lg px-2.5 py-2 min-w-[70px] shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                            cls.isHoliday
                              ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700'
                              : 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700'
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
                          
                          <div className="flex items-center flex-shrink-0">
                            <ArrowRight className="h-4 w-4 text-gray-400 transition-transform duration-300 group-hover:translate-x-1" />
                          </div>
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
            <Card className="mb-8 overflow-hidden border-2 border-amber-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-b-2 border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      Eventos Próximos
                    </CardTitle>
                    <CardDescription className="text-gray-600">Eventos nos próximos 3 dias</CardDescription>
                  </div>
                  <Link href="/calendar">
                    <Button variant="outline" size="sm" className="border-amber-300 hover:bg-amber-50">
                      Ver Calendário <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      holiday: { icon: '🎉', label: 'Feriado', borderColor: 'border-red-300', bgColor: 'bg-red-50' },
                      commemorative: { icon: '🎂', label: 'Data Comemorativa', borderColor: 'border-amber-300', bgColor: 'bg-amber-50' },
                      school_event: { icon: '🏫', label: 'Evento Escolar', borderColor: 'border-blue-300', bgColor: 'bg-blue-50' },
                      personal: { icon: '📌', label: 'Observação', borderColor: 'border-purple-300', bgColor: 'bg-purple-50' },
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Distribuição Semanal</CardTitle>
                <CardDescription>Quantidade de aulas em cada dia da semana</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Line
                    data={weeklyDistribution}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* ===== NOVOS WIDGETS ===== */}
          
          {/* Grid dos Novos Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Widget 1: Contador de Tempo até Próxima Aula */}
            {widgetVisibility.timeToNextClass && (
              <Card className="border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Timer className="h-5 w-5 text-teal-600" />
                    Próxima Aula
                  </CardTitle>
                  <CardDescription>Tempo restante até sua próxima aula</CardDescription>
                </CardHeader>
                <CardContent>
                  {timeToNextClass && upcomingClasses && upcomingClasses.length > 0 ? (
                    <>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="text-center">
                          <div className={`text-4xl font-bold ${
                            timeToNextClass.hours === 0 && timeToNextClass.minutes < 15 
                              ? 'text-red-600 animate-pulse' 
                              : 'text-teal-600'
                          }`}>
                            {String(timeToNextClass.hours).padStart(2, '0')}:{String(timeToNextClass.minutes).padStart(2, '0')}:{String(timeToNextClass.seconds).padStart(2, '0')}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">horas:minutos:segundos</p>
                        </div>
                      </div>
                      
                      {timeToNextClass.hours === 0 && timeToNextClass.minutes < 15 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Alerta: Aula começa em breve!
                          </p>
                        </div>
                      )}
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {upcomingClasses[0].subjectName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {upcomingClasses[0].className} • {upcomingClasses[0].startTime} - {upcomingClasses[0].endTime}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Nenhuma aula agendada</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Widget 2: Lista de Tarefas Pendentes */}
            {widgetVisibility.todoList && (
              <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-purple-600" />
                    Tarefas Pendentes
                  </CardTitle>
                  <CardDescription>
                    {todoItems.filter(t => !t.completed).length} de {todoItems.length} tarefas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                    {todoItems.length === 0 ? (
                      <div className="text-center py-6">
                        <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Nenhuma tarefa adicionada</p>
                      </div>
                    ) : (
                      todoItems.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <button
                            onClick={() => toggleTodoItem(item.id)}
                            className="flex-shrink-0"
                          >
                            {item.completed ? (
                              <CheckSquare className="h-5 w-5 text-green-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                          <span className={`flex-1 text-sm ${
                            item.completed 
                              ? 'line-through text-gray-400' 
                              : 'text-gray-900'
                          }`}>
                            {item.text}
                          </span>
                          <button
                            onClick={() => deleteTodoItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTodoText}
                      onChange={(e) => setNewTodoText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTodoItem()}
                      placeholder="Nova tarefa..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <Button
                      onClick={addTodoItem}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Widget 3: Prazos Importantes */}
            {widgetVisibility.importantDeadlines && (
              <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Bell className="h-5 w-5 text-orange-600" />
                    Prazos Importantes
                  </CardTitle>
                  <CardDescription>Próximos 7 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {importantDeadlines.length === 0 ? (
                      <div className="text-center py-6">
                        <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Nenhum prazo nos próximos 7 dias</p>
                      </div>
                    ) : (
                      importantDeadlines.map((event: any) => {
                        const eventDate = new Date(event.eventDate);
                        const now = new Date();
                        const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        
                        const urgencyColor = diffDays <= 2 ? 'bg-red-500' : diffDays <= 5 ? 'bg-yellow-500' : 'bg-green-500';
                        const urgencyText = diffDays === 0 ? 'HOJE' : diffDays === 1 ? 'AMANHÃ' : `${diffDays}d`;
                        
                        const dayOfWeek = eventDate.toLocaleDateString('pt-BR', { weekday: 'short' });
                        const dayMonth = eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                        
                        return (
                          <div
                            key={event.id}
                            className="relative p-3 rounded-lg border-2 border-orange-200 bg-orange-50 hover:shadow-md transition-shadow"
                          >
                            <div className={`absolute -top-2 -right-2 ${urgencyColor} text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md`}>
                              {urgencyText}
                            </div>
                            
                            <h4 className="font-bold text-gray-900 text-sm mb-1 pr-8">
                              {event.title}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {dayOfWeek}, {dayMonth}
                            </p>
                            {event.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
          </div>



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
    </>
  );
}
