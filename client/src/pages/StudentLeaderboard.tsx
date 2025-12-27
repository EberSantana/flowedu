import { useState } from "react";
import { trpc } from "@/lib/trpc";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, TrendingUp, Award } from "lucide-react";

export function StudentLeaderboard() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  // Buscar disciplinas matriculadas
  const { data: enrollments = [] } = trpc.student.getEnrolledSubjects.useQuery();

  // Buscar ranking da disciplina (top 10 para alunos)
  const { data: ranking = [], isLoading } = trpc.gamification.getSubjectRanking.useQuery(
    { subjectId: selectedSubjectId!, limit: 10 },
    { enabled: !!selectedSubjectId }
  );

  // Buscar posição do aluno
  const { data: myPosition } = trpc.gamification.getMyPosition.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId }
  );

  // Buscar top 3
  const { data: topPerformers = [] } = trpc.gamification.getSubjectTopPerformers.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId }
  );

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
    <StudentLayout>
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Rankings</h1>
            </div>
            <p className="text-muted-foreground">
              Veja sua posição e os melhores alunos da turma
            </p>
          </div>

          {/* Filtro de disciplina */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Selecione a Disciplina</CardTitle>
              <CardDescription>Escolha uma disciplina para ver o ranking</CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedSubjectId?.toString() || ""} 
                onValueChange={(v) => setSelectedSubjectId(Number(v))}
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Selecione uma disciplina..." />
                </SelectTrigger>
                <SelectContent>
                  {enrollments.map((enrollment: any) => (
                    <SelectItem key={enrollment.subjectId} value={enrollment.subjectId.toString()}>
                      {enrollment.subject?.name || "Disciplina"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Minha posição */}
          {selectedSubjectId && myPosition && myPosition.studentData && (
            <Card className="mb-6 border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-primary" />
                  Minha Posição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Posição</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl">
                        {myPosition.position === 1 ? "🥇" :
                         myPosition.position === 2 ? "🥈" :
                         myPosition.position === 3 ? "🥉" :
                         myPosition.position <= 10 ? "🏆" : "📊"}
                      </span>
                      <span className="text-3xl font-bold">{myPosition.position}º</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      de {myPosition.totalStudents} alunos
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Pontos</p>
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="text-3xl font-bold">{myPosition.studentData.totalPoints}</span>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Faixa</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getBeltColor(myPosition.studentData.currentBelt)}`}>
                      {getBeltLabel(myPosition.studentData.currentBelt)}
                    </span>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Sequência</p>
                    <div className="flex items-center justify-center gap-2">
                      {myPosition.studentData.streakDays > 0 ? (
                        <>
                          <span className="text-2xl">🔥</span>
                          <span className="text-2xl font-bold">{myPosition.studentData.streakDays}</span>
                          <span className="text-sm text-muted-foreground">dias</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top 3 */}
          {selectedSubjectId && topPerformers.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>🏆 Top 3 da Turma</CardTitle>
                <CardDescription>Os melhores alunos desta disciplina</CardDescription>
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
                        <h3 className="text-lg font-bold mb-1">{performer.fullName}</h3>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Trophy className="w-4 h-4 text-primary" />
                          <span className="text-xl font-bold">{performer.totalPoints}</span>
                          <span className="text-xs text-muted-foreground">pontos</span>
                        </div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getBeltColor(performer.currentBelt)}`}>
                          {getBeltLabel(performer.currentBelt)}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ranking completo (Top 10) */}
          <Card>
            <CardHeader>
              <CardTitle>Ranking da Turma (Top 10)</CardTitle>
              <CardDescription>Classificação dos melhores alunos</CardDescription>
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

              {selectedSubjectId && !isLoading && ranking.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Medal className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum aluno encontrado neste ranking</p>
                </div>
              )}

              {selectedSubjectId && !isLoading && ranking.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Posição</th>
                        <th className="text-left py-3 px-4 font-semibold">Aluno</th>
                        <th className="text-left py-3 px-4 font-semibold">Pontos</th>
                        <th className="text-left py-3 px-4 font-semibold">Faixa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((student: any, index: number) => {
                        const medal = getMedalEmoji(index + 1);
                        const isMe = myPosition?.studentData?.studentId === student.studentId;
                        return (
                          <tr 
                            key={student.studentId} 
                            className={`border-b transition-colors ${
                              isMe ? "bg-primary/10 font-semibold" : "hover:bg-muted/50"
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {medal && <span className="text-2xl">{medal}</span>}
                                <span className="font-bold text-lg">{index + 1}º</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {student.fullName}
                              {isMe && (
                                <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                  Você
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-primary" />
                                <span className="font-bold">{student.totalPoints}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBeltColor(student.currentBelt)}`}>
                                {getBeltLabel(student.currentBelt)}
                              </span>
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
    </StudentLayout>
  );
}
