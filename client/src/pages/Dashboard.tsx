import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Calendar, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function Dashboard() {
  const { user } = useAuth();
  const { data: subjects } = trpc.subjects.list.useQuery();
  const { data: classes } = trpc.classes.list.useQuery();
  const { data: scheduledClasses } = trpc.schedule.list.useQuery();

  // Calcular carga horária total
  const totalHours = scheduledClasses?.length || 0;

  // Dados para gráfico de distribuição por dia da semana
  const dayDistribution = {
    labels: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    datasets: [{
      label: 'Aulas por Dia',
      data: [
        scheduledClasses?.filter(c => c.dayOfWeek === 0).length || 0,
        scheduledClasses?.filter(c => c.dayOfWeek === 1).length || 0,
        scheduledClasses?.filter(c => c.dayOfWeek === 2).length || 0,
        scheduledClasses?.filter(c => c.dayOfWeek === 3).length || 0,
        scheduledClasses?.filter(c => c.dayOfWeek === 4).length || 0,
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(236, 72, 153, 0.8)',
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(139, 92, 246)',
        'rgb(249, 115, 22)',
        'rgb(236, 72, 153)',
      ],
      borderWidth: 2,
    }],
  };

  // Dados para gráfico de carga horária por disciplina (top 5)
  const subjectHours = subjects?.map(subject => ({
    name: subject.name,
    hours: scheduledClasses?.filter(c => c.subjectId === subject.id).length || 0,
  })).sort((a, b) => b.hours - a.hours).slice(0, 5) || [];

  const subjectHoursData = {
    labels: subjectHours.map(s => s.name),
    datasets: [{
      label: 'Horas Semanais',
      data: subjectHours.map(s => s.hours),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2,
    }],
  };

  // Dados para gráfico de evolução semanal (simulado)
  const weeklyData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
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
      tension: 0.4,
      fill: true,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bem-vindo, {user?.name || "Professor"}!
            </h1>
            <p className="text-muted-foreground">
              Visão geral do seu sistema de gestão de tempo
            </p>
          </div>

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
                <BookOpen className="h-5 w-5 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{subjects?.length || 0}</div>
                <p className="text-xs opacity-80 mt-1">disciplinas cadastradas</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Turmas</CardTitle>
                <Users className="h-5 w-5 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{classes?.length || 0}</div>
                <p className="text-xs opacity-80 mt-1">turmas cadastradas</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aulas Agendadas</CardTitle>
                <Calendar className="h-5 w-5 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{scheduledClasses?.length || 0}</div>
                <p className="text-xs opacity-80 mt-1">aulas na grade</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Carga Horária</CardTitle>
                <Clock className="h-5 w-5 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalHours}h</div>
                <p className="text-xs opacity-80 mt-1">horas semanais</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Distribuição por Dia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Distribuição por Dia da Semana
                </CardTitle>
                <CardDescription>
                  Quantidade de aulas em cada dia da semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Doughnut data={dayDistribution} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Carga Horária por Disciplina */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Top 5 Disciplinas
                </CardTitle>
                <CardDescription>
                  Disciplinas com maior carga horária semanal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Bar data={subjectHoursData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Linha - Distribuição Semanal */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Distribuição Semanal
              </CardTitle>
              <CardDescription>
                Quantidade de aulas por dia da semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Line data={weeklyData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Avisos e Notificações */}
          {(!subjects || subjects.length === 0) && (
            <Card className="border-warning bg-warning/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertCircle className="h-5 w-5" />
                  Comece Cadastrando Disciplinas
                </CardTitle>
                <CardDescription>
                  Você ainda não possui disciplinas cadastradas. Comece criando suas primeiras disciplinas para organizar seu tempo.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
