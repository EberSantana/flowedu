import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Users, Award, Download } from "lucide-react";
import { toast } from "sonner";

export function Leaderboard() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [periodFilter, setPeriodFilter] = useState<"all" | "week" | "month">("all");

  // Buscar disciplinas
  const { data: subjects = [] } = trpc.subjects.list.useQuery();

  // Buscar ranking por disciplina
  const { data: subjectRanking = [], isLoading: loadingSubjectRanking } = 
    trpc.gamification.getSubjectRanking.useQuery(
      { subjectId: selectedSubjectId!, limit: 20 },
      { enabled: !!selectedSubjectId && periodFilter === "all" }
    );

  // Buscar ranking por disciplina com período
  const periodDates = useMemo(() => {
    const now = new Date();
    const start = new Date();
    if (periodFilter === "week") {
      start.setDate(now.getDate() - 7);
    } else if (periodFilter === "month") {
      start.setMonth(now.getMonth() - 1);
    }
    return { start, end: now };
  }, [periodFilter]);

  const { data: periodRanking = [], isLoading: loadingPeriodRanking } = 
    trpc.gamification.getSubjectRankingByPeriod.useQuery(
      { 
        subjectId: selectedSubjectId!, 
        startDate: periodDates.start,
        endDate: periodDates.end,
        limit: 20 
      },
      { enabled: !!selectedSubjectId && periodFilter !== "all" }
    );

  // Buscar top 3 performers
  const { data: topPerformers = [] } = trpc.gamification.getSubjectTopPerformers.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId }
  );

  // Buscar estatísticas
  const { data: stats } = trpc.gamification.getSubjectRankingStats.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId }
  );

  // Determinar ranking atual
  const currentRanking = useMemo(() => {
    return periodFilter === "all" ? subjectRanking : periodRanking;
  }, [periodFilter, subjectRanking, periodRanking]);

  const isLoading = loadingSubjectRanking || loadingPeriodRanking;

  const handleExportPDF = () => {
    toast.info("Funcionalidade de exportação em desenvolvimento");
  };

  const getMedalEmoji = (position: number) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return null;
  };

  const getBeltColor = (belt: string) => {
    const colors: Record<string, string> = {
      white: "bg-gray-100 text-gray-800",
      yellow: "bg-yellow-100 text-yellow-800",
      orange: "bg-orange-100 text-orange-800",
      green: "bg-green-100 text-green-800",
      blue: "bg-blue-100 text-blue-800",
      purple: "bg-purple-100 text-purple-800",
      brown: "bg-amber-100 text-amber-800",
      black: "bg-gray-800 text-white",
    };
    return colors[belt] || colors.white;
  };

  const getBeltLabel = (belt: string) => {
    const labels: Record<string, string> = {
      white: "Branca",
      yellow: "Amarela",
      orange: "Laranja",
      green: "Verde",
      blue: "Azul",
      purple: "Roxa",
      brown: "Marrom",
      black: "Preta",
    };
    return labels[belt] || "Branca";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Rankings (Leaderboard)</h1>
            </div>
            <p className="text-muted-foreground">
              Classificação dos melhores alunos por disciplina
            </p>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Selecione a disciplina para visualizar o ranking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Seleção de disciplina */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Disciplina</label>
                  <Select 
                    value={selectedSubjectId?.toString() || ""} 
                    onValueChange={(v) => setSelectedSubjectId(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de período */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Período</label>
                  <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo o período</SelectItem>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Espaço vazio para manter grid */}
                <div></div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          {selectedSubjectId && stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Alunos</p>
                      <p className="text-2xl font-bold">{stats.totalStudents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Média de Pontos</p>
                      <p className="text-2xl font-bold">{Math.round(stats.avgPoints)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Award className="w-8 h-8 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pontuação Máxima</p>
                      <p className="text-2xl font-bold">{stats.maxPoints}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pontuação Mínima</p>
                      <p className="text-2xl font-bold">{stats.minPoints}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top 3 Performers */}
          {selectedSubjectId && topPerformers.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>🏆 Top 3 Performers</CardTitle>
                    <CardDescription>Os melhores alunos da disciplina</CardDescription>
                  </div>
                  <Button onClick={handleExportPDF} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topPerformers.map((performer) => (
                    <Card 
                      key={performer.studentId} 
                      className={`border-2 ${
                        performer.position === 1 ? "border-yellow-400 bg-yellow-50" :
                        performer.position === 2 ? "border-gray-400 bg-gray-50" :
                        "border-amber-600 bg-amber-50"
                      }`}
                    >
                      <CardContent className="pt-6 text-center">
                        <div className="text-5xl mb-2">{performer.medal}</div>
                        <h3 className="text-xl font-bold mb-1">{performer.fullName}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {performer.registrationNumber}
                        </p>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Trophy className="w-5 h-5 text-primary" />
                          <span className="text-2xl font-bold">{performer.totalPoints}</span>
                          <span className="text-sm text-muted-foreground">pontos</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBeltColor(performer.currentBelt)}`}>
                            Faixa {getBeltLabel(performer.currentBelt)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela de Ranking Completo */}
          <Card>
            <CardHeader>
              <CardTitle>Ranking Completo (Top 20)</CardTitle>
              <CardDescription>
                Classificação geral da disciplina {periodFilter !== "all" ? `(${periodFilter === "week" ? "última semana" : "último mês"})` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedSubjectId && (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma disciplina para visualizar o ranking</p>
                </div>
              )}

              {selectedSubjectId && isLoading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Carregando ranking...</p>
                </div>
              )}

              {selectedSubjectId && !isLoading && currentRanking.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum aluno encontrado neste ranking</p>
                </div>
              )}

              {selectedSubjectId && !isLoading && currentRanking.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Posição</th>
                        <th className="text-left py-3 px-4 font-semibold">Aluno</th>
                        <th className="text-left py-3 px-4 font-semibold">Matrícula</th>
                        <th className="text-left py-3 px-4 font-semibold">Pontos</th>
                        <th className="text-left py-3 px-4 font-semibold">Faixa</th>
                        <th className="text-left py-3 px-4 font-semibold">Sequência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRanking.map((student: any, index: number) => {
                        const medal = getMedalEmoji(index + 1);
                        return (
                          <tr key={student.studentId} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {medal && <span className="text-2xl">{medal}</span>}
                                <span className="font-bold text-lg">{index + 1}º</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium">{student.fullName}</td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {student.registrationNumber || "-"}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-primary" />
                                <span className="font-bold">{student.totalPoints}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {student.currentBelt && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBeltColor(student.currentBelt)}`}>
                                  {getBeltLabel(student.currentBelt)}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {student.streakDays !== undefined && (
                                <span className="text-sm">
                                  {student.streakDays > 0 ? `🔥 ${student.streakDays} dias` : "-"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
