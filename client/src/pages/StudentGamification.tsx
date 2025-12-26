import { useState } from "react";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Trophy, Flame, TrendingUp, Award, Clock, Target, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const BELT_CONFIG = [
  { name: 'white', label: 'Branca', minPoints: 0, maxPoints: 200, color: '#9CA3AF', emoji: '⚪' },
  { name: 'yellow', label: 'Amarela', minPoints: 200, maxPoints: 400, color: '#FBBF24', emoji: '🟡' },
  { name: 'orange', label: 'Laranja', minPoints: 400, maxPoints: 600, color: '#F97316', emoji: '🟠' },
  { name: 'green', label: 'Verde', minPoints: 600, maxPoints: 900, color: '#10B981', emoji: '🟢' },
  { name: 'blue', label: 'Azul', minPoints: 900, maxPoints: 1200, color: '#3B82F6', emoji: '🔵' },
  { name: 'purple', label: 'Roxa', minPoints: 1200, maxPoints: 1600, color: '#8B5CF6', emoji: '🟣' },
  { name: 'brown', label: 'Marrom', minPoints: 1600, maxPoints: 2000, color: '#92400E', emoji: '🟤' },
  { name: 'black', label: 'Preta', minPoints: 2000, maxPoints: 999999, color: '#1F2937', emoji: '⚫' },
];

export default function StudentGamification() {
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: stats, isLoading: statsLoading } = trpc.gamification.getStudentStats.useQuery();
  const { data: history, isLoading: historyLoading } = trpc.gamification.getPointsHistory.useQuery({ limit: 20 });
  const { data: badges, isLoading: badgesLoading } = trpc.gamification.getStudentBadges.useQuery();
  const { data: ranking, isLoading: rankingLoading } = trpc.gamification.getClassRanking.useQuery({ limit: 10 });

  if (statsLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando sua jornada...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const currentBelt = BELT_CONFIG.find(b => b.name === stats?.currentBelt) || BELT_CONFIG[0];
  const nextBelt = BELT_CONFIG[BELT_CONFIG.indexOf(currentBelt) + 1];
  const progressToNext = nextBelt 
    ? ((stats?.totalPoints || 0) - currentBelt.minPoints) / (nextBelt.minPoints - currentBelt.minPoints) * 100
    : 100;

  // Calcular distribuição de alunos por faixa (mock para o aluno - apenas visual)
  const totalStudents = ranking?.length || 1;

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Minha Jornada 🥋</h1>
          <p className="text-gray-600 mt-2">Acompanhe seu progresso e conquistas</p>
        </div>

        {/* Cards de Estatísticas - Layout Padronizado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total de Pontos */}
          <Card className="border-l-4 border-blue-500 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Trophy className="h-5 w-5 text-blue-600" />
                </div>
                Pontos Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats?.totalPoints || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Acumulados</p>
            </CardContent>
          </Card>

          {/* Sequência de Dias */}
          <Card className="border-l-4 border-orange-500 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Flame className="h-5 w-5 text-orange-600" />
                </div>
                Sequência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats?.streakDays || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Dias consecutivos</p>
            </CardContent>
          </Card>

          {/* Badges Conquistados */}
          <Card className="border-l-4 border-purple-500 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
                Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{badges?.earned?.length || 0}/{badges?.total || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Conquistados</p>
            </CardContent>
          </Card>

          {/* Posição no Ranking */}
          <Card className="border-l-4 border-green-500 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-full">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">#{stats?.rank || '-'}</div>
              <p className="text-xs text-gray-500 mt-1">Posição na turma</p>
            </CardContent>
          </Card>
        </div>

        {/* Faixa Atual e Progresso */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-blue-600" />
              Faixa Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Faixa Atual Grande */}
            <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="text-6xl">{currentBelt.emoji}</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">Faixa {currentBelt.label}</h3>
                <p className="text-gray-600 text-base mt-1">
                  {stats?.totalPoints || 0} pontos acumulados
                </p>
                {nextBelt && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span className="font-medium">Progresso para Faixa {nextBelt.label}</span>
                      <span className="font-bold">{Math.round(progressToNext)}%</span>
                    </div>
                    <Progress value={progressToNext} className="h-3" />
                    <p className="text-xs text-gray-500 mt-2">
                      Faltam <span className="font-semibold">{nextBelt.minPoints - (stats?.totalPoints || 0)} pontos</span> para a próxima faixa
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Distribuição de Faixas - Layout Padronizado */}
            <div>
              <h4 className="text-base font-semibold text-gray-700 mb-4">Jornada Completa</h4>
              <div className="space-y-3">
                {BELT_CONFIG.map((belt) => {
                  const isUnlocked = (stats?.totalPoints || 0) >= belt.minPoints;
                  const isCurrent = belt.name === stats?.currentBelt;
                  
                  return (
                    <div key={belt.name} className="flex items-center gap-3">
                      {/* Ícone Circular */}
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
                          isUnlocked ? '' : 'grayscale opacity-40'
                        }`}
                        style={{ backgroundColor: isUnlocked ? belt.color : '#E5E7EB' }}
                      >
                        {isUnlocked ? belt.emoji : '🔒'}
                      </div>

                      {/* Nome e Barra */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${isCurrent ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                            {belt.label}
                            {isCurrent && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Atual</span>}
                          </span>
                          <span className="text-xs text-gray-500">{belt.minPoints}+ pts</span>
                        </div>
                        {/* Barra de Progresso Visual */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all"
                            style={{ 
                              width: isUnlocked ? '100%' : '0%',
                              backgroundColor: belt.color
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
          </TabsList>

          {/* Tab: Visão Geral */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Histórico de Pontos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {historyLoading ? (
                    <div className="text-center py-8 text-gray-500">Carregando histórico...</div>
                  ) : history && history.length > 0 ? (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.reason}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <Badge variant="default" className="text-base font-bold bg-green-500">
                            +{item.points}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Nenhuma atividade ainda</p>
                      <p className="text-sm mt-1">Complete exercícios e provas para ganhar pontos!</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Badges */}
          <TabsContent value="badges" className="space-y-4 mt-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Badges Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {badgesLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando badges...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {badges?.all?.map((badge: any) => {
                      const isEarned = badges.earned?.some((e: any) => e.badgeId === badge.id);
                      return (
                        <div
                          key={badge.id}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isEarned
                              ? 'border-purple-300 bg-purple-50'
                              : 'border-gray-200 bg-gray-50 opacity-60'
                          }`}
                        >
                          <div className="text-4xl mb-2">{isEarned ? '🏆' : '🔒'}</div>
                          <h4 className="font-semibold text-gray-900">{badge.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                          {isEarned && (
                            <Badge variant="secondary" className="mt-2 bg-purple-100 text-purple-700">
                              Conquistado!
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Ranking */}
          <TabsContent value="ranking" className="space-y-4 mt-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Ranking da Turma
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rankingLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando ranking...</div>
                ) : ranking && ranking.length > 0 ? (
                  <div className="space-y-2">
                    {ranking.map((student: any, index: number) => {
                      const isCurrentStudent = false; // TODO: Implementar detecção de aluno atual
                      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                      
                      return (
                        <div
                          key={student.studentId}
                          className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                            isCurrentStudent
                              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-2xl font-bold text-gray-400 w-8 text-center">
                            {medal || `#${index + 1}`}
                          </div>
                          <div className="flex-1">
                            <p className={`font-semibold ${isCurrentStudent ? 'text-blue-700' : 'text-gray-900'}`}>
                              {student.studentName}
                              {isCurrentStudent && <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Você</span>}
                            </p>
                            <p className="text-sm text-gray-500">
                              Faixa {BELT_CONFIG.find(b => b.name === student.currentBelt)?.label || 'Branca'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">{student.totalPoints}</p>
                            <p className="text-xs text-gray-500">pontos</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Ranking vazio</p>
                    <p className="text-sm mt-1">Seja o primeiro a pontuar!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
}
