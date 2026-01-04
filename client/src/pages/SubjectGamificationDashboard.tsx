import { useParams } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Sidebar from '@/components/Sidebar';
import PageWrapper from '@/components/PageWrapper';
import { Users, TrendingUp, Award, Zap } from 'lucide-react';
import { KarateAvatar, BeltColor } from '@/components/KarateAvatar';

export function SubjectGamificationDashboard() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { user } = useAuth();
  const subId = parseInt(subjectId || '0');

  // Buscar dados de gamificação
  const isStudent = user?.role === 'user'; // Alunos têm role 'user'
  const gamificationQuery = isStudent
    ? trpc.gamification.getSubjectGamificationStudent.useQuery({ subjectId: subId })
    : trpc.gamification.getSubjectGamificationDashboard.useQuery({ subjectId: subId });

  // Buscar nome da disciplina
  const subjectsQuery = trpc.subjects.list.useQuery();
  const subject = subjectsQuery.data?.find(s => s.id === subId);

  if (gamificationQuery.isLoading || subjectsQuery.isLoading) {
    return (
      <>
        <Sidebar />
        <PageWrapper className="min-h-screen bg-gray-50">
          <div className="container mx-auto py-6 px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando gamificação...</p>
              </div>
            </div>
          </div>
        </PageWrapper>
      </>
    );
  }

  if (gamificationQuery.isError || !gamificationQuery.data) {
    return (
      <>
        <Sidebar />
        <PageWrapper className="min-h-screen bg-gray-50">
          <div className="container mx-auto py-6 px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-red-500 font-semibold mb-2">Erro ao carregar gamificação</p>
                <p className="text-gray-600">Tente recarregar a página</p>
              </div>
            </div>
          </div>
        </PageWrapper>
      </>
    );
  }

  const data = gamificationQuery.data as any;
  const ranking = data.ranking || [];
  const beltDistribution = data.beltDistribution || [];
  const stats = data.stats || {};

  // Para alunos, mostrar sua posição
  const studentPosition = isStudent && 'studentPosition' in data ? data.studentPosition : null;
  const studentData = isStudent && 'studentData' in data ? data.studentData : null;

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-6 px-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🏆 Gamificação: {subject?.name || 'Disciplina'}
              </h1>
              <p className="text-gray-600 mt-1">
                Acompanhe o progresso e engajamento dos alunos nesta disciplina
              </p>
            </div>
          </div>

          {/* Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-500 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Total de Alunos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalStudents || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  Alunos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{data.activeStudents || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  Pontos Médios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {Math.round(stats.avgPoints || 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-500" />
                  Máximo de Pontos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.maxPoints || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Posição do Aluno (apenas para alunos) */}
          {isStudent && studentData && studentPosition && (
            <Card className="border-2 border-blue-500 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🎯 Sua Posição</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600">#{studentPosition}</div>
                      <p className="text-sm text-gray-600">de {stats.totalStudents}</p>
                    </div>
                    <div className="border-l border-gray-300 pl-4">
                      <p className="text-sm text-gray-600">Pontos</p>
                      <p className="text-2xl font-bold text-gray-900">{studentData.totalPoints || 0}</p>
                    </div>
                    <div className="border-l border-gray-300 pl-4">
                      <p className="text-sm text-gray-600">Faixa</p>
                      <div className="mt-1">
                        <KarateAvatar belt={(studentData.currentBelt || 'white') as BeltColor} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Distribuição de Faixas */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <span>📊 Distribuição de Faixas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {beltDistribution.map((belt: any) => (
                  <div key={belt.name} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-24">
                      <span className="text-lg">{belt.emoji}</span>
                      <span className="text-sm font-medium text-gray-900">{belt.label}</span>
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          belt.name === 'white'
                            ? 'bg-gray-400'
                            : belt.name === 'yellow'
                            ? 'bg-yellow-400'
                            : belt.name === 'orange'
                            ? 'bg-orange-400'
                            : belt.name === 'green'
                            ? 'bg-green-400'
                            : belt.name === 'blue'
                            ? 'bg-blue-400'
                            : belt.name === 'purple'
                            ? 'bg-purple-400'
                            : belt.name === 'brown'
                            ? 'bg-amber-600'
                            : 'bg-gray-800'
                        }`}
                        style={{ width: `${belt.percentage}%` }}
                      />
                    </div>
                    <div className="text-right w-20">
                      <span className="text-sm font-semibold text-gray-900">{belt.count}</span>
                      <span className="text-xs text-gray-600 ml-2">
                        ({belt.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ranking */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <span>🏅 Ranking da Disciplina</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Posição
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Aluno
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                        Faixa
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Pontos
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Streak
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.slice(0, 20).map((student: any, index: number) => (
                      <tr
                        key={student.studentId}
                        className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                          isStudent && studentData && student.studentId === studentData.studentId
                            ? 'bg-blue-50'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {index === 0 && <span>🥇</span>}
                            {index === 1 && <span>🥈</span>}
                            {index === 2 && <span>🥉</span>}
                            {index >= 3 && (
                              <span className="text-sm font-semibold text-gray-700">
                                #{student.position}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900">
                            {student.fullName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <KarateAvatar belt={(student.currentBelt || 'white') as BeltColor} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-gray-900">
                            {student.totalPoints}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {student.streakDays > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                              🔥 {student.streakDays}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}
