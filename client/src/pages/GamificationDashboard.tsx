import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Users, TrendingUp, Trophy, Award, BookOpen } from "lucide-react";

const BELT_CONFIG = [
  { name: 'white', label: 'Faixa Branca', minPoints: 0, color: 'bg-gray-400', iconBg: 'bg-gray-100' },
  { name: 'yellow', label: 'Faixa Amarela', minPoints: 200, color: 'bg-yellow-400', iconBg: 'bg-yellow-100' },
  { name: 'orange', label: 'Faixa Laranja', minPoints: 400, color: 'bg-orange-400', iconBg: 'bg-orange-100' },
  { name: 'green', label: 'Faixa Verde', minPoints: 600, color: 'bg-green-500', iconBg: 'bg-green-100' },
  { name: 'blue', label: 'Faixa Azul', minPoints: 900, color: 'bg-blue-500', iconBg: 'bg-blue-100' },
  { name: 'purple', label: 'Faixa Roxa', minPoints: 1200, color: 'bg-purple-500', iconBg: 'bg-purple-100' },
  { name: 'brown', label: 'Faixa Marrom', minPoints: 1600, color: 'bg-amber-700', iconBg: 'bg-amber-100' },
  { name: 'black', label: 'Faixa Preta', minPoints: 2000, color: 'bg-gray-900', iconBg: 'bg-gray-800' },
];

export default function GamificationDashboard() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);

  // Buscar disciplinas do professor
  const { data: subjects } = trpc.subjects.list.useQuery();

  const { data: overview, isLoading: overviewLoading } = (trpc.gamification as any).getTeacherOverview?.useQuery({ subjectId: selectedSubjectId }) || { data: null, isLoading: false };
  const { data: ranking, isLoading: rankingLoading } = (trpc.gamification as any).getClassRankingTeacher?.useQuery({ limit: 20, subjectId: selectedSubjectId }) || { data: null, isLoading: false };
  const { data: badges, isLoading: badgesLoading } = (trpc.gamification as any).getBadgeStats?.useQuery({ subjectId: selectedSubjectId }) || { data: [], isLoading: false };

  // Calcular distribuição de faixas
  const beltDistribution = BELT_CONFIG.map(belt => {
    const count = ranking?.filter((student: any) => student.currentBelt === belt.name).length || 0;
    const percentage = ranking && ranking.length > 0 ? (count / ranking.length) * 100 : 0;
    return { ...belt, count, percentage };
  });

  const totalStudents = overview?.totalStudents || 0;
  const activeStudents = overview?.activeStudents || 0;
  const averagePoints = overview?.averagePoints || 0;
  const totalBadgesEarned = badges?.reduce((sum: number, badge: any) => sum + (badge.earnedCount || 0), 0) || 0;

  if (overviewLoading) {
    return (
      <>
        <Sidebar />
        <PageWrapper className="min-h-screen bg-gray-50">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando estatísticas...</p>
            </div>
          </div>
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              Dashboard de Gamificação 🎮
            </h1>
            <p className="text-gray-600 mt-2">Acompanhe o progresso e engajamento dos seus alunos</p>
          </div>

          {/* Seletor de Disciplina */}
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                Filtrar por Disciplina
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedSubjectId?.toString() || "all"}
                onValueChange={(value) => setSelectedSubjectId(value === "all" ? undefined : parseInt(value))}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Disciplinas</SelectItem>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSubjectId && (
                <p className="text-sm text-gray-600 mt-2">
                  Exibindo estatísticas da disciplina: <span className="font-semibold">{subjects?.find(s => s.id === selectedSubjectId)?.name}</span>
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total de Alunos */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total de Alunos
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
              <p className="text-xs text-gray-500 mt-1">cadastrados no sistema</p>
            </CardContent>
          </Card>

          {/* Alunos Ativos */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Alunos Ativos
              </CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{activeStudents}</div>
              <p className="text-xs text-gray-500 mt-1">com streak ativo</p>
            </CardContent>
          </Card>

          {/* Pontos Médios */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Pontos Médios
              </CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{Math.round(averagePoints)}</div>
              <p className="text-xs text-gray-500 mt-1">por aluno</p>
            </CardContent>
          </Card>

          {/* Badges Conquistados */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Badges Conquistados
              </CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Award className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalBadgesEarned}</div>
              <p className="text-xs text-gray-500 mt-1">de {badges?.length || 0} disponíveis</p>
            </CardContent>
          </Card>
        </div>

        {/* Distribuição de Faixas */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Trophy className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Distribuição de Faixas</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Veja como seus alunos estão distribuídos nas diferentes faixas</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {beltDistribution.map((belt) => (
              <div key={belt.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${belt.color} flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">
                        {belt.name === 'white' ? '⚪' :
                         belt.name === 'yellow' ? '🟡' :
                         belt.name === 'orange' ? '🟠' :
                         belt.name === 'green' ? '🟢' :
                         belt.name === 'blue' ? '🔵' :
                         belt.name === 'purple' ? '🟣' :
                         belt.name === 'brown' ? '🟤' :
                         belt.name === 'black' ? '⚫' : '🔵'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{belt.label}</p>
                      <p className="text-sm text-gray-500">{belt.minPoints}+ pontos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-900">{belt.count}</span>
                    <span className="text-sm text-gray-500 w-12 text-right">{belt.percentage.toFixed(1)}%</span>
                  </div>
                </div>
                
                {/* Barra de progresso */}
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`${belt.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${belt.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Ranking de Alunos */}
        {ranking && ranking.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Top 10 Alunos</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Alunos com melhor desempenho no sistema de gamificação</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ranking.slice(0, 10).map((student: any, index: number) => {
                  const belt = BELT_CONFIG.find(b => b.name === student.currentBelt) || BELT_CONFIG[0];
                  return (
                    <div key={student.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-amber-600 text-amber-100' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.fullName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-3 h-3 rounded-full ${belt.color}`}></div>
                            <span className="text-xs text-gray-600">{belt.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{student.totalPoints}</p>
                        <p className="text-xs text-gray-500">pontos</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Badges */}
        {badges && badges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Badges Disponíveis</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Conquistas que os alunos podem desbloquear</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((badge: any, badgeIndex: number) => (
                  <div key={badge.badgeKey || `badge-${badgeIndex}`} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{badge.iconUrl || '🏆'}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{badge.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-500">{badge.requiredPoints} pontos</span>
                          <span className="text-sm font-medium text-blue-600">
                            {badge.earnedCount || 0} conquistados
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </PageWrapper>
    </>
  );
}
