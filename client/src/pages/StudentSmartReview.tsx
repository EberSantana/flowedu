import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target, 
  Flame, 
  Award,
  Play,
  BarChart3,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";

export default function StudentSmartReview() {
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>(undefined);

  // Buscar estatísticas de revisão
  const { data: stats, isLoading: statsLoading } = trpc.smartReview.getStatistics.useQuery({
    subjectId: selectedSubject,
  });

  // Buscar fila de revisão
  const { data: queue, isLoading: queueLoading } = trpc.smartReview.getQueue.useQuery({
    subjectId: selectedSubject,
    limit: 20,
  });

  // Buscar histórico
  const { data: history, isLoading: historyLoading } = trpc.smartReview.getHistory.useQuery({
    limit: 10,
  });

  const isLoading = statsLoading || queueLoading || historyLoading;

  // Calcular progresso do dia
  const dailyProgress = stats?.dailyGoal ? Math.min(100, (stats.dailyProgress / stats.dailyGoal) * 100) : 0;
  const weeklyProgress = stats?.weeklyGoal ? Math.min(100, (stats.weeklyProgress / stats.weeklyGoal) * 100) : 0;

  // Determinar cor do streak
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-purple-600";
    if (streak >= 14) return "text-blue-600";
    if (streak >= 7) return "text-green-600";
    return "text-orange-600";
  };

  // Determinar cor da prioridade
  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return "destructive";
    if (priority >= 60) return "default";
    return "secondary";
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 80) return "Alta";
    if (priority >= 60) return "Média";
    return "Baixa";
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Brain className="h-8 w-8 text-primary" />
          Revisão Inteligente
        </h1>
        <p className="text-muted-foreground">
          Sistema de repetição espaçada para otimizar seu aprendizado
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados de revisão...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Streak */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flame className={`h-4 w-4 ${getStreakColor(stats?.currentStreak || 0)}`} />
                  Sequência Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.currentStreak || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recorde: {stats?.longestStreak || 0} dias
                </p>
              </CardContent>
            </Card>

            {/* Taxa de Sucesso */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  Taxa de Acerto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.successRate || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.correctReviews || 0} de {stats?.totalReviewsCompleted || 0} revisões
                </p>
              </CardContent>
            </Card>

            {/* Itens Pendentes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Para Revisar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.itemsPending || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.itemsMastered || 0} dominados
                </p>
              </CardContent>
            </Card>

            {/* Tempo Total */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Tempo de Estudo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.floor((stats?.totalTimeSpent || 0) / 60)}m
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Média: {Math.floor((stats?.averageSessionTime || 0) / 60)}m/sessão
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progresso Diário e Semanal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Meta Diária
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{stats?.dailyProgress || 0} / {stats?.dailyGoal || 10} revisões</span>
                    <span className="font-semibold">{Math.round(dailyProgress)}%</span>
                  </div>
                  <Progress value={dailyProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Meta Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{stats?.weeklyProgress || 0} / {stats?.weeklyGoal || 50} revisões</span>
                    <span className="font-semibold">{Math.round(weeklyProgress)}%</span>
                  </div>
                  <Progress value={weeklyProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs: Fila de Revisão e Histórico */}
          <Tabs defaultValue="queue" className="space-y-4">
            <TabsList>
              <TabsTrigger value="queue" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Fila de Revisão ({queue?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Histórico Recente
              </TabsTrigger>
            </TabsList>

            {/* Fila de Revisão */}
            <TabsContent value="queue" className="space-y-4">
              {!queue || queue.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Parabéns!</h3>
                    <p className="text-muted-foreground">
                      Você não tem itens pendentes para revisar no momento.
                    </p>
                    <Link href="/student/exercises">
                      <Button className="mt-4">
                        Resolver Novos Exercícios
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {queue.map((item) => (
                    <Card key={item.id} className="hover:border-primary transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={getPriorityColor(item.priority)}>
                                Prioridade: {getPriorityLabel(item.priority)}
                              </Badge>
                              <Badge variant="outline">
                                Taxa de acerto: {item.successRate}%
                              </Badge>
                              <Badge variant="outline">
                                {item.reviewCount} revisões
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              Próxima revisão programada: {new Date(item.nextReviewDate).toLocaleDateString('pt-BR')}
                            </p>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Intervalo: {item.interval} dia(s)</span>
                              <span>•</span>
                              <span>Facilidade: {item.easeFactor.toFixed(2)}</span>
                              <span>•</span>
                              <span>Dificuldade: {item.difficultyScore}/100</span>
                            </div>
                          </div>

                          <Link href={`/student/smart-review/${item.id}`}>
                            <Button size="sm">
                              <Play className="h-4 w-4 mr-2" />
                              Revisar
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {queue.length >= 20 && (
                    <Card>
                      <CardContent className="py-4 text-center text-sm text-muted-foreground">
                        Mostrando os 20 itens mais prioritários. Complete estas revisões para ver mais.
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Histórico */}
            <TabsContent value="history" className="space-y-4">
              {!history || history.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma revisão realizada ainda.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {item.wasCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            <div>
                              <p className="text-sm font-medium">
                                {item.wasCorrect ? "Acertou" : "Errou"} a revisão
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.reviewedAt).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-right">
                              <p className="text-muted-foreground">Tempo</p>
                              <p className="font-medium">{Math.floor(item.timeSpent / 60)}m {item.timeSpent % 60}s</p>
                            </div>
                            {item.selfRating && (
                              <Badge variant="outline">
                                {item.selfRating === "again" && "Repetir"}
                                {item.selfRating === "hard" && "Difícil"}
                                {item.selfRating === "good" && "Bom"}
                                {item.selfRating === "easy" && "Fácil"}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {item.notes && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground">{item.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
