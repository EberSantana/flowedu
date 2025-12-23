import { trpc } from "@/lib/trpc";
import { BeltBadge } from "@/components/BeltBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Flame, Target, Award, TrendingUp } from "lucide-react";

export default function StudentGamification() {
  const { data: points, isLoading: loadingPoints } = trpc.gamification.getMyPoints.useQuery();
  const { data: beltConfig } = trpc.gamification.getBeltConfig.useQuery();
  const { data: badges } = trpc.gamification.getMyBadges.useQuery();
  const { data: allBadges } = trpc.gamification.getAllBadges.useQuery();
  const { data: history } = trpc.gamification.getPointsHistory.useQuery({ limit: 20 });
  const { data: ranking } = trpc.gamification.getClassRanking.useQuery({ limit: 10 });

  if (loadingPoints) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Carregando sua jornada...</p>
        </div>
      </div>
    );
  }

  const currentBelt = points?.currentBelt || "white";
  const totalPoints = points?.totalPoints || 0;
  const streakDays = points?.streakDays || 0;

  // Calcular progresso até próxima faixa
  const belts = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black'] as const;
  const currentIndex = belts.indexOf(currentBelt as typeof belts[number]);
  const nextBelt = currentIndex < belts.length - 1 ? belts[currentIndex + 1] : null;
  
  const currentBeltData = beltConfig?.[currentBelt as keyof typeof beltConfig];
  const nextBeltData = nextBelt && beltConfig ? beltConfig[nextBelt] : null;
  
  const pointsInCurrentBelt = totalPoints - (currentBeltData?.min || 0);
  const pointsNeededForNext = nextBeltData && currentBeltData
    ? (nextBeltData.min - currentBeltData.min)
    : 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header com Faixa Atual */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Minha Jornada</h1>
            <p className="text-purple-100">Continue evoluindo e conquistando novas faixas!</p>
          </div>
          <div className="text-right">
            <BeltBadge belt={currentBelt} size="lg" className="mb-2" />
            <p className="text-2xl font-bold">{totalPoints} pontos</p>
          </div>
        </div>

        {/* Progresso até próxima faixa */}
        {nextBeltData && (
          <div className="mt-6">
            <ProgressBar
              current={pointsInCurrentBelt}
              max={pointsNeededForNext}
              label={`Próxima faixa: ${nextBeltData.name}`}
              barClassName="bg-gradient-to-r from-yellow-400 to-orange-500"
              className="text-white"
            />
          </div>
        )}
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sequência Atual</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streakDays} dias</div>
            <p className="text-xs text-muted-foreground">
              Continue assim para ganhar bônus!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Conquistados</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{badges?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {allBadges?.length || 0} disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranking</CardTitle>
            <Trophy className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ranking && points ? `#${ranking.findIndex((r) => r.studentId === points.studentId) + 1}` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              na turma
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Badges, Histórico, Ranking */}
      <Tabs defaultValue="badges" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        {/* Tab: Badges */}
        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Minhas Conquistas</CardTitle>
              <CardDescription>Badges que você já conquistou</CardDescription>
            </CardHeader>
            <CardContent>
              {badges && badges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {badges.map((b) => (
                    <div
                      key={b.badge.id}
                      className="flex items-start gap-3 p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50"
                    >
                      <span className="text-3xl">{b.badge.icon}</span>
                      <div>
                        <h3 className="font-semibold">{b.badge.name}</h3>
                        <p className="text-sm text-gray-600">{b.badge.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Conquistado em {new Date(b.earnedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Você ainda não conquistou nenhum badge. Continue estudando!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badges Disponíveis</CardTitle>
              <CardDescription>Conquiste todos os badges!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allBadges?.map((badge) => {
                  const earned = badges?.some((b) => b.badge.id === badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`flex items-start gap-3 p-4 border rounded-lg ${
                        earned ? "opacity-50 bg-gray-50" : "bg-white"
                      }`}
                    >
                      <span className="text-3xl">{badge.icon}</span>
                      <div>
                        <h3 className="font-semibold">{badge.name}</h3>
                        <p className="text-sm text-gray-600">{badge.description}</p>
                        {earned && (
                          <Badge variant="secondary" className="mt-2">
                            ✓ Conquistado
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Histórico */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pontos</CardTitle>
              <CardDescription>Suas últimas atividades e pontuações</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {history && history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{h.reason}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(h.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            h.points > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {h.points > 0 ? "+" : ""}
                          {h.points} pts
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Nenhuma atividade registrada ainda.
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Ranking */}
        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle>Ranking da Turma</CardTitle>
              <CardDescription>Top 10 alunos com mais pontos</CardDescription>
            </CardHeader>
            <CardContent>
              {ranking && ranking.length > 0 ? (
                <div className="space-y-3">
                  {ranking.map((r, index) => (
                    <div
                      key={r.studentId}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        r.studentId === points?.studentId
                          ? "bg-blue-50 border-blue-300"
                          : "bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0
                              ? "bg-yellow-400 text-yellow-900"
                              : index === 1
                              ? "bg-gray-300 text-gray-700"
                              : index === 2
                              ? "bg-orange-400 text-orange-900"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{r.studentName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <BeltBadge belt={r.currentBelt} size="sm" showName={false} />
                            {r.streakDays > 0 && (
                              <span className="text-xs text-orange-600 flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                {r.streakDays} dias
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-purple-600">{r.totalPoints}</p>
                        <p className="text-xs text-gray-500">pontos</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Nenhum dado de ranking disponível.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
