import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Trophy, Award, TrendingUp, Users, Flame, Target, FileDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
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

const BELT_CONFIG = [
  { name: 'white', label: 'Branca', minPoints: 0, color: 'bg-gray-400', gradient: 'from-gray-300 to-gray-500' },
  { name: 'yellow', label: 'Amarela', minPoints: 200, color: 'bg-yellow-400', gradient: 'from-yellow-300 to-yellow-500' },
  { name: 'orange', label: 'Laranja', minPoints: 400, color: 'bg-orange-400', gradient: 'from-orange-300 to-orange-500' },
  { name: 'green', label: 'Verde', minPoints: 600, color: 'bg-green-500', gradient: 'from-green-400 to-green-600' },
  { name: 'blue', label: 'Azul', minPoints: 900, color: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600' },
  { name: 'purple', label: 'Roxa', minPoints: 1200, color: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600' },
  { name: 'brown', label: 'Marrom', minPoints: 1600, color: 'bg-amber-700', gradient: 'from-amber-600 to-amber-800' },
  { name: 'black', label: 'Preta', minPoints: 2000, color: 'bg-gray-900', gradient: 'from-gray-800 to-black' },
];

export default function GamificationDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);

  const { data: overview, isLoading: overviewLoading } = (trpc.gamification as any).getTeacherOverview?.useQuery() || { data: null, isLoading: false };
  const { data: ranking, isLoading: rankingLoading } = trpc.gamification.getClassRanking.useQuery({ limit: 20 });
  const { data: badges, isLoading: badgesLoading } = (trpc.gamification as any).getBadgeStats?.useQuery() || { data: [], isLoading: false };
  const { data: evolutionData, isLoading: evolutionLoading } = (trpc.gamification as any).getPointsEvolution?.useQuery() || { data: [], isLoading: false };
  
  const generateReportMutation = (trpc.gamification as any).generateReport?.useMutation() || { mutate: () => {}, isPending: false };
  
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const result = await generateReportMutation.mutateAsync();
      
      // Converter base64 para blob e fazer download
      const byteCharacters = atob(result.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar relatório PDF');
    } finally {
      setIsExporting(false);
    }
  };

  if (overviewLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando estatísticas...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calcular distribuição de faixas
  const beltDistribution = BELT_CONFIG.map(belt => ({
    ...belt,
    count: ranking?.filter(s => s.currentBelt === belt.name).length || 0
  }));

  const totalStudents = ranking?.length || 0;
  const averagePoints = totalStudents > 0
    ? Math.round((ranking?.reduce((sum, s) => sum + s.totalPoints, 0) || 0) / totalStudents)
    : 0;

  const activeStudents = ranking?.filter(s => s.streakDays > 0).length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Gamificação 🎮</h1>
            <p className="text-gray-600 mt-1">Acompanhe o progresso e engajamento dos seus alunos</p>
          </div>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="h-5 w-5" />
            {isExporting ? 'Gerando PDF...' : 'Exportar PDF'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Alunos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{totalStudents}</div>
              <p className="text-xs text-blue-600 mt-1">cadastrados no sistema</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Alunos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{activeStudents}</div>
              <p className="text-xs text-green-600 mt-1">com streak ativo</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Pontos Médios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{averagePoints}</div>
              <p className="text-xs text-purple-600 mt-1">por aluno</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Badges Conquistados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">{overview?.totalBadgesEarned || 0}</div>
              <p className="text-xs text-orange-600 mt-1">de {overview?.totalBadgesAvailable || 0} disponíveis</p>
            </CardContent>
          </Card>
        </div>

        {/* Distribuição de Faixas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Distribuição de Faixas
            </CardTitle>
            <CardDescription>Veja como seus alunos estão distribuídos nas diferentes faixas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {beltDistribution.map((belt) => {
                const percentage = totalStudents > 0 ? (belt.count / totalStudents) * 100 : 0;
                return (
                  <div key={belt.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${belt.gradient} flex items-center justify-center shadow-md`}>
                          <span className="text-white text-sm font-bold">🥋</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Faixa {belt.label}</p>
                          <p className="text-xs text-gray-500">{belt.minPoints}+ pontos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{belt.count}</p>
                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Evolução Temporal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Evolução de Pontos da Turma
            </CardTitle>
            <CardDescription>Últimas 4 semanas - Total de pontos ganhos pela turma</CardDescription>
          </CardHeader>
          <CardContent>
            {evolutionLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Carregando dados...</p>
                </div>
              </div>
            ) : evolutionData && evolutionData.length > 0 ? (
              <div className="h-[300px]">
                <Line
                  data={{
                    labels: evolutionData.map((d: any) => d.week),
                    datasets: [
                      {
                        label: 'Pontos Totais',
                        data: evolutionData.map((d: any) => d.totalPoints),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: 'rgb(59, 130, 246)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                      },
                    ],
                  }}
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
                        callbacks: {
                          label: function(context) {
                            return `Pontos: ${context.parsed.y}`;
                          }
                        }
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          font: {
                            size: 12,
                          },
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)',
                        },
                      },
                      x: {
                        ticks: {
                          font: {
                            size: 12,
                            weight: 'bold',
                          },
                        },
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-500">Nenhum dado disponível ainda</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Ranking Completo</TabsTrigger>
            <TabsTrigger value="badges">Badges Mais Conquistados</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Ranking Geral da Turma
                </CardTitle>
                <CardDescription>Top 20 alunos com maior pontuação</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {rankingLoading ? (
                    <div className="text-center py-8 text-gray-500">Carregando ranking...</div>
                  ) : ranking && ranking.length > 0 ? (
                    <div className="space-y-2">
                      {ranking.map((student, index) => {
                        const belt = BELT_CONFIG.find(b => b.name === student.currentBelt) || BELT_CONFIG[0];
                        return (
                          <div
                            key={student.studentId}
                            className={`flex items-center gap-4 p-3 rounded-lg ${
                              index === 0
                                ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400'
                                : index === 1
                                ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-400'
                                : index === 2
                                ? 'bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-400'
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <div className="text-2xl font-bold text-gray-700 w-8">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                            </div>
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${belt.gradient} flex items-center justify-center shadow-md`}>
                              <span className="text-white text-sm">🥋</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{student.studentName}</p>
                              <p className="text-xs text-gray-600">
                                Faixa {belt.label} • {student.streakDays} dias de sequência
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-blue-600">{student.totalPoints}</p>
                              <p className="text-xs text-gray-500">pontos</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum aluno com pontuação ainda.
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Badges Mais Conquistados
                </CardTitle>
                <CardDescription>Veja quais conquistas seus alunos mais alcançam</CardDescription>
              </CardHeader>
              <CardContent>
                {badgesLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando badges...</div>
                ) : badges && badges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {badges.map((badge: any) => {
                      const earnedPercentage = totalStudents > 0 
                        ? (badge.earnedCount / totalStudents) * 100 
                        : 0;
                      return (
                        <div
                          key={badge.id}
                          className="p-4 rounded-lg border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50"
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-4xl">{badge.icon || '🏆'}</div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900">{badge.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                              <div className="mt-3">
                                <div className="flex justify-between text-sm text-gray-700 mb-1">
                                  <span>{badge.earnedCount} alunos</span>
                                  <span>{earnedPercentage.toFixed(0)}%</span>
                                </div>
                                <Progress value={earnedPercentage} className="h-2" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum badge conquistado ainda.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
