import { useState } from "react";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Trophy, Flame, TrendingUp, Award, Clock, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const BELT_CONFIG = [
  { name: 'white', label: 'Branca', minPoints: 0, maxPoints: 200, color: 'bg-gray-400', gradient: 'from-gray-300 to-gray-500' },
  { name: 'yellow', label: 'Amarela', minPoints: 200, maxPoints: 400, color: 'bg-yellow-400', gradient: 'from-yellow-300 to-yellow-500' },
  { name: 'orange', label: 'Laranja', minPoints: 400, maxPoints: 600, color: 'bg-orange-400', gradient: 'from-orange-300 to-orange-500' },
  { name: 'green', label: 'Verde', minPoints: 600, maxPoints: 900, color: 'bg-green-500', gradient: 'from-green-400 to-green-600' },
  { name: 'blue', label: 'Azul', minPoints: 900, maxPoints: 1200, color: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600' },
  { name: 'purple', label: 'Roxa', minPoints: 1200, maxPoints: 1600, color: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600' },
  { name: 'brown', label: 'Marrom', minPoints: 1600, maxPoints: 2000, color: 'bg-amber-700', gradient: 'from-amber-600 to-amber-800' },
  { name: 'black', label: 'Preta', minPoints: 2000, maxPoints: 999999, color: 'bg-gray-900', gradient: 'from-gray-800 to-black' },
];

export default function StudentGamification() {
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: stats, isLoading: statsLoading } = trpc.gamification.getStudentStats.useQuery();
  const { data: history, isLoading: historyLoading } = trpc.gamification.getPointsHistory.useQuery({ limit: 20 });
  const { data: badges, isLoading: badgesLoading } = trpc.gamification.getStudentBadges.useQuery();
  const { data: ranking, isLoading: rankingLoading } = trpc.gamification.getClassRanking.useQuery({ limit: 10 });
  const { data: ctProfile, isLoading: ctLoading } = (trpc.computationalThinking as any).getProfile?.useQuery() || { data: null, isLoading: false };

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

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Minha Jornada 🥋</h1>
            <p className="text-gray-600 mt-1">Acompanhe seu progresso e conquistas</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Pontos Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{stats?.totalPoints || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Sequência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">{stats?.streakDays || 0} dias</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{badges?.earned?.length || 0}/{badges?.total || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">#{stats?.rank || '-'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Faixa Atual */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Faixa Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${currentBelt.gradient} flex items-center justify-center shadow-lg`}>
                <span className="text-white text-2xl font-bold">🥋</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">Faixa {currentBelt.label}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {stats?.totalPoints || 0} pontos
                </p>
                {nextBelt && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progresso para Faixa {nextBelt.label}</span>
                      <span>{Math.round(progressToNext)}%</span>
                    </div>
                    <Progress value={progressToNext} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      Faltam {nextBelt.minPoints - (stats?.totalPoints || 0)} pontos
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Todas as Faixas */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Jornada Completa</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {BELT_CONFIG.map((belt) => {
                  const isUnlocked = (stats?.totalPoints || 0) >= belt.minPoints;
                  const isCurrent = belt.name === stats?.currentBelt;
                  return (
                    <div
                      key={belt.name}
                      className={`flex flex-col items-center min-w-[80px] p-2 rounded-lg transition-all ${
                        isCurrent ? 'bg-blue-100 ring-2 ring-blue-500' : isUnlocked ? 'bg-gray-100' : 'bg-gray-50 opacity-50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${belt.gradient} flex items-center justify-center mb-2 ${!isUnlocked && 'grayscale'}`}>
                        <span className="text-white text-lg">{isUnlocked ? '🥋' : '🔒'}</span>
                      </div>
                      <span className="text-xs font-medium text-center">{belt.label}</span>
                      <span className="text-xs text-gray-500">{belt.minPoints}+</span>
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

          <TabsContent value="overview" className="space-y-4">
            <Card>
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
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.reason}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <Badge variant={item.points > 0 ? "default" : "secondary"} className="text-lg font-bold">
                            +{item.points}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma atividade ainda. Comece a ganhar pontos!
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Card de Pensamento Computacional */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🧠 Pensamento Computacional
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ctLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando perfil...</div>
                ) : ctProfile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Radar Chart */}
                    <div className="flex items-center justify-center">
                      <div className="w-full max-w-[300px]">
                        <Radar
                          data={{
                            labels: ["Decomposição", "Padrões", "Abstração", "Algoritmos"],
                            datasets: [
                              {
                                label: "Seu Perfil",
                                data: [
                                  ctProfile.decomposition || 0,
                                  ctProfile.patternRecognition || 0,
                                  ctProfile.abstraction || 0,
                                  ctProfile.algorithms || 0,
                                ],
                                backgroundColor: "rgba(59, 130, 246, 0.2)",
                                borderColor: "rgb(59, 130, 246)",
                                borderWidth: 2,
                                pointBackgroundColor: "rgb(59, 130, 246)",
                                pointBorderColor: "#fff",
                                pointHoverBackgroundColor: "#fff",
                                pointHoverBorderColor: "rgb(59, 130, 246)",
                              },
                            ],
                          }}
                          options={{
                            scales: {
                              r: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                  stepSize: 20,
                                },
                              },
                            },
                            plugins: {
                              legend: {
                                display: false,
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Scores */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <div className="text-3xl font-bold text-blue-600">{ctProfile.decomposition || 0}</div>
                        <div className="text-sm text-gray-600 mt-1">Decomposição</div>
                        <div className="text-xs text-gray-500 mt-1">Dividir problemas</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <div className="text-3xl font-bold text-green-600">{ctProfile.patternRecognition || 0}</div>
                        <div className="text-sm text-gray-600 mt-1">Padrões</div>
                        <div className="text-xs text-gray-500 mt-1">Identificar padrões</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                        <div className="text-3xl font-bold text-purple-600">{ctProfile.abstraction || 0}</div>
                        <div className="text-sm text-gray-600 mt-1">Abstração</div>
                        <div className="text-xs text-gray-500 mt-1">Focar no essencial</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                        <div className="text-3xl font-bold text-orange-600">{ctProfile.algorithms || 0}</div>
                        <div className="text-sm text-gray-600 mt-1">Algoritmos</div>
                        <div className="text-xs text-gray-500 mt-1">Sequência lógica</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Complete exercícios de Pensamento Computacional para ver seu perfil!
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Minhas Conquistas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {badgesLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando badges...</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {badges?.all?.map((badge) => {
                      const isEarned = badges.earned.some((b) => b.badgeId === badge.id);
                      return (
                        <div
                          key={badge.id}
                          className={`p-4 rounded-lg border-2 text-center transition-all ${
                            isEarned
                              ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg'
                              : 'border-gray-200 bg-gray-50 opacity-50 grayscale'
                          }`}
                        >
                          <div className="text-4xl mb-2">{badge.icon || '🏆'}</div>
                          <h4 className="font-bold text-sm text-gray-900">{badge.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                          {isEarned && (
                            <Badge variant="secondary" className="mt-2 text-xs">
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

          <TabsContent value="ranking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top 10 da Turma
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="text-2xl font-bold text-gray-700 w-8">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                          </div>
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${belt.gradient} flex items-center justify-center`}>
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
                    Nenhum dado de ranking disponível ainda.
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
