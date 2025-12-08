import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Clock, Plus, Calendar as CalendarIcon, BarChart3, ArrowRight, AlertCircle } from "lucide-react";
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
                <CardDescription>Acesso rápido às funcionalidades principais</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Link href="/subjects">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300">
                    <Plus className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Nova Disciplina</span>
                  </Button>
                </Link>
                
                <Link href="/schedule">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300">
                    <CalendarIcon className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">Grade Completa</span>
                  </Button>
                </Link>

                <Link href="/classes">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300">
                    <Users className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Gerenciar Turmas</span>
                  </Button>
                </Link>

                <Link href="/calendar">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-300">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium">Calendário</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Próximas Aulas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Próximas Aulas</CardTitle>
                <CardDescription>Suas aulas programadas para esta semana</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingClasses && upcomingClasses.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingClasses.map((cls, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors border-2 ${
                          cls.isHoliday 
                            ? 'bg-red-50 border-red-300 opacity-75' 
                            : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        {/* Indicador de Data e Dia */}
                        <div className={`flex flex-col items-center justify-center rounded-lg px-3 py-2 min-w-[85px] shadow-sm ${
                          cls.isHoliday
                            ? 'bg-gradient-to-br from-red-500 to-red-600'
                            : 'bg-gradient-to-br from-blue-500 to-blue-600'
                        }`}>
                          <span className="text-xs font-medium text-white uppercase tracking-wide">
                            {cls.dayOfWeek.substring(0, 3)}
                          </span>
                          <span className="text-lg font-bold text-white">
                            {formatDate(cls.date)}
                          </span>
                        </div>
                        
                        {/* Horário */}
                        <div className="flex flex-col items-center justify-center bg-white rounded-lg px-3 py-2 border border-gray-300 min-w-[70px]">
                          <Clock className="h-4 w-4 text-gray-500 mb-1" />
                          <span className="text-xs font-semibold text-gray-700">
                            {cls.startTime}
                          </span>
                          <span className="text-xs text-gray-500">
                            {cls.endTime}
                          </span>
                        </div>
                        
                        {/* Barra colorida da disciplina */}
                        <div
                          className="w-1 h-16 rounded-full"
                          style={{ backgroundColor: cls.subjectColor || '#6B7280' }}
                        />
                        
                        {/* Informações da aula */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-base">
                            {cls.subjectName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Turma: {cls.className}
                          </p>
                          {cls.isHoliday && (
                            <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Feriado: {cls.holidayName}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Nenhuma aula agendada</p>
                    <Link href="/schedule">
                      <Button variant="link" className="mt-2 text-blue-600">
                        Criar grade de horários <ArrowRight className="ml-1 h-4 w-4" />
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
