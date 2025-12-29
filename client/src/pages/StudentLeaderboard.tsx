import { useState } from "react";
import { trpc } from "@/lib/trpc";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, TrendingUp, Award, Users, Target, Flame } from "lucide-react";

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
        <div className="container py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Rankings</h1>
                <p className="text-lg text-gray-600 mt-1">
                  Veja sua posição e os melhores alunos da turma
                </p>
              </div>
            </div>
          </div>

          {/* Filtro de disciplina */}
          <Card className="mb-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Selecione a Disciplina
              </CardTitle>
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

          {/* Cards de Estatísticas - Minha Posição */}
          {selectedSubjectId && myPosition && myPosition.studentData && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-600" />
                Minha Posição
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-gray-700">
                        Posição
                      </CardTitle>
                      <Trophy className="w-5 h-5 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">
                        {myPosition.position === 1 ? "🥇" :
                         myPosition.position === 2 ? "🥈" :
                         myPosition.position === 3 ? "🥉" :
                         myPosition.position <= 10 ? "🏆" : "📊"}
                      </span>
                      <span className="text-3xl font-bold text-gray-900">{myPosition.position}º</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      de {myPosition.totalStudents} alunos
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-gray-700">
                        Pontos
                      </CardTitle>
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-gray-900">{myPosition.studentData.totalPoints}</p>
                    <p className="text-sm text-gray-600 mt-2">pontos totais</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-gray-700">
                        Faixa
                      </CardTitle>
                      <Award className="w-5 h-5 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <span className={`inline-block px-3 py-2 rounded-full text-sm font-semibold ${getBeltColor(myPosition.studentData.currentBelt)}`}>
                      {getBeltLabel(myPosition.studentData.currentBelt)}
                    </span>
                    <p className="text-sm text-gray-600 mt-2">faixa atual</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-gray-700">
                        Sequência
                      </CardTitle>
                      <Flame className="w-5 h-5 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {myPosition.studentData.streakDays > 0 ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">🔥</span>
                          <span className="text-3xl font-bold text-gray-900">{myPosition.studentData.streakDays}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">dias consecutivos</p>
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-gray-400">0</p>
                        <p className="text-sm text-gray-600 mt-2">sem sequência ativa</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Top 3 - Pódio */}
          {selectedSubjectId && topPerformers.length > 0 && (
            <Card className="mb-6 border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  Top 3 da Turma
                </CardTitle>
                <CardDescription>Os melhores alunos desta disciplina</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topPerformers.map((performer) => (
                    <Card 
                      key={performer.studentId} 
                      className={`border-2 transition-all hover:scale-105 ${
                        performer.position === 1 ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg" :
                        performer.position === 2 ? "border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100" :
                        "border-amber-600 bg-gradient-to-br from-amber-50 to-amber-100"
                      }`}
                    >
                      <CardContent className="pt-6 text-center">
                        <div className="text-5xl mb-3">{performer.medal}</div>
                        <h3 className="text-lg font-bold mb-2 text-gray-900">{performer.fullName}</h3>
                        <div className="flex items-center justify-center gap-2 mb-3 bg-white/50 rounded-lg py-2">
                          <Trophy className="w-4 h-4 text-yellow-600" />
                          <span className="text-2xl font-bold text-gray-900">{performer.totalPoints}</span>
                          <span className="text-xs text-gray-600">pontos</span>
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getBeltColor(performer.currentBelt)}`}>
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
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Ranking da Turma (Top 10)
              </CardTitle>
              <CardDescription>Classificação dos melhores alunos</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedSubjectId && (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 text-lg font-medium">Selecione uma disciplina para visualizar o ranking</p>
                </div>
              )}

              {selectedSubjectId && isLoading && (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Carregando ranking...</p>
                </div>
              )}

              {selectedSubjectId && !isLoading && ranking.length === 0 && (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <Medal className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 text-lg font-medium">Nenhum aluno encontrado neste ranking</p>
                </div>
              )}

              {selectedSubjectId && !isLoading && ranking.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-gray-50">
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Posição</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Aluno</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Pontos</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Faixa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((student: any, index: number) => {
                        const medal = getMedalEmoji(index + 1);
                        const isMe = myPosition?.studentData?.studentId === student.studentId;
                        return (
                          <tr 
                            key={student.studentId} 
                            className={`border-b border-gray-200 transition-all ${
                              isMe ? "bg-blue-50 font-semibold shadow-sm" : "hover:bg-gray-50"
                            }`}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                {medal && <span className="text-2xl">{medal}</span>}
                                <span className="font-bold text-lg text-gray-900">{index + 1}º</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-gray-900">{student.fullName}</span>
                              {isMe && (
                                <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-semibold">
                                  Você
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-600" />
                                <span className="font-bold text-gray-900">{student.totalPoints}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBeltColor(student.currentBelt)}`}>
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
