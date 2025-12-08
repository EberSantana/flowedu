import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Clock, Plus, Calendar as CalendarIcon, BarChart3, ArrowRight, AlertCircle, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import { Link } from "wouter";
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
  const { data: upcomingEvents } = trpc.dashboard.getUpcomingEvents.useQuery();

  // Calcular total de aulas agendadas
  const totalScheduledClasses = scheduledClasses?.length || 0;

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
      <div className="min-h-screen bg-gray-50 lg:ml-64">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Bem-vindo, {user?.name || 'Professor'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Visão geral do seu sistema de gestão de tempo
            </p>
          </div>

          {/* Cards de Métricas Principais */}
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

          {/* Grid Principal: Ações Rápidas + Próximas Aulas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Ações Rápidas */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-900">Ações Rápidas</CardTitle>
                <CardDescription className="text-gray-600">Acesso rápido às funcionalidades principais</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Botão Próxima Aula em Destaque */}
                <div className="mb-4">
                  <div
                    onClick={() => {
                      if (upcomingClasses && upcomingClasses.length > 0) {
                        const nextClass = upcomingClasses[0];
                        const url = nextClass.googleClassroomUrl || nextClass.googleDriveUrl;
                        if (url) {
                          window.open(url, '_blank');
                        } else {
                          alert('⚠️ Nenhum link do Google Classroom ou Drive cadastrado para esta disciplina.\n\nAcesse "Disciplinas" para adicionar os links de integração.');
                        }
                      }
                    }}
                    className={`group relative overflow-hidden rounded-xl bg-gradient-to-br p-4 shadow-lg transition-all duration-300 ${
                      upcomingClasses && upcomingClasses.length > 0
                        ? 'from-teal-500 to-teal-600 hover:shadow-xl hover:scale-[1.02] cursor-pointer'
                        : 'from-gray-400 to-gray-500 cursor-not-allowed opacity-60'
                    }`}
                    title={upcomingClasses && upcomingClasses.length > 0 ? 'Clique para abrir a próxima aula' : 'Nenhuma aula agendada para hoje'}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className="relative z-10 flex items-center gap-3 text-white">
                      <ExternalLink className="h-6 w-6 group-hover:scale-110 transition-transform flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-sm font-bold block">Ir para Próxima Aula</span>
                        {upcomingClasses && upcomingClasses.length > 0 && (
                          <span className="text-xs opacity-90">
                            {upcomingClasses[0].subjectName} - {upcomingClasses[0].startTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid de Ações */}
                <div className="grid grid-cols-2 gap-4">
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

                </div>
              </CardContent>
            </Card>

            {/* Aulas de Hoje */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-900">Aulas de Hoje</CardTitle>
                <CardDescription className="text-gray-600">Sua programação de aulas para hoje</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {upcomingClasses && upcomingClasses.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingClasses.map((cls, idx) => (
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
          </div>

          {/* Gráfico de Distribuição Semanal */}
          {scheduledClasses && scheduledClasses.length > 0 && (
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

          {/* Widget de Eventos do Calendário */}
          {upcomingEvents && upcomingEvents.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Próximos Eventos</CardTitle>
                    <CardDescription>Feriados, datas comemorativas e eventos escolares</CardDescription>
                  </div>
                  <Link href="/calendar">
                    <Button variant="outline" size="sm">
                      Ver Calendário <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {upcomingEvents.map((event) => {
                    const eventDate = new Date(event.eventDate + 'T00:00:00');
                    const dayMonth = eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                    const dayOfWeek = eventDate.toLocaleDateString('pt-BR', { weekday: 'short' });
                    
                    // Definir ícone e cor por tipo
                    const eventStyles = {
                      holiday: { icon: '🎉', bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-700', badgeColor: 'bg-red-500' },
                      commemorative: { icon: '🎂', bgColor: 'bg-purple-50', borderColor: 'border-purple-300', textColor: 'text-purple-700', badgeColor: 'bg-purple-500' },
                      school_event: { icon: '🏫', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700', badgeColor: 'bg-blue-500' },
                      personal: { icon: '📌', bgColor: 'bg-green-50', borderColor: 'border-green-300', textColor: 'text-green-700', badgeColor: 'bg-green-500' },
                    };
                    
                    const style = eventStyles[event.eventType] || eventStyles.personal;
                    
                    return (
                      <div
                        key={event.id}
                        className={`p-4 rounded-lg border-2 ${style.bgColor} ${style.borderColor} hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Data */}
                          <div className={`flex flex-col items-center justify-center rounded-lg px-3 py-2 ${style.badgeColor} text-white min-w-[60px]`}>
                            <span className="text-xs font-medium uppercase">
                              {dayOfWeek}
                            </span>
                            <span className="text-lg font-bold">
                              {dayMonth.split(' ')[0]}
                            </span>
                            <span className="text-xs uppercase">
                              {dayMonth.split(' ')[1]}
                            </span>
                          </div>
                          
                          {/* Informações do evento */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">{style.icon}</span>
                              <span className={`text-xs font-semibold uppercase ${style.textColor}`}>
                                {event.eventType === 'holiday' ? 'Feriado' :
                                 event.eventType === 'commemorative' ? 'Comemorativo' :
                                 event.eventType === 'school_event' ? 'Evento Escolar' : 'Pessoal'}
                              </span>
                            </div>
                            <p className={`font-semibold ${style.textColor} text-sm truncate`}>
                              {event.title}
                            </p>
                            {event.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
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
      </div>
    </>
  );
}
