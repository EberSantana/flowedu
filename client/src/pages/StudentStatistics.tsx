import { trpc } from "@/lib/trpc";
import StudentLayout from "@/components/StudentLayout";
import { 
  TrendingUp, BookOpen, Target, Award, Clock, CheckCircle2, 
  AlertCircle, BarChart3, Calendar, Flame
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function StudentStatistics() {
  // Buscar disciplinas matriculadas
  const { data: enrolledSubjects, isLoading: loadingSubjects } = 
    trpc.student.getEnrolledSubjects.useQuery();

  // Buscar estatísticas gerais
  const { data: stats, isLoading: loadingStats } = 
    trpc.student.getStudyStatistics.useQuery({});

  const activeSubjects = enrolledSubjects?.filter(e => e.status === 'active') || [];

  const isLoading = loadingSubjects || loadingStats;

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Estatísticas de Desempenho</h1>
                <p className="text-green-100 mt-1">
                  Acompanhe seu desempenho e evolução em todas as disciplinas
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4 max-w-7xl">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando estatísticas...</p>
            </div>
          ) : (
            <>
              {/* Cards de Estatísticas Gerais */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      Disciplinas Ativas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {activeSubjects.length}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Matriculadas</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Tópicos Concluídos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.completedTopics || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Finalizados</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Em Progresso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.inProgressTopics || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Estudando</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-500" />
                      Pendentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.notStartedTopics || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">A iniciar</p>
                  </CardContent>
                </Card>
              </div>

              {/* Desempenho por Disciplina */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  Desempenho por Disciplina
                </h2>

                {activeSubjects.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        Nenhuma disciplina ativa
                      </h3>
                      <p className="text-gray-600">
                        Você ainda não está matriculado em nenhuma disciplina.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {activeSubjects.map((enrollment) => {
                      const subject = enrollment.subject;
                      if (!subject) return null;

                      // Calcular progresso fictício (pode ser substituído por dados reais)
                      const progress = Math.floor(Math.random() * 100);
                      const completedTopics = Math.floor(Math.random() * 20);
                      const totalTopics = 20;

                      return (
                        <Card 
                          key={enrollment.id}
                          className="hover:shadow-lg transition-shadow border-t-4 border-t-blue-500"
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg font-bold text-gray-900">
                                  {subject.name}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {subject.code} • {enrollment.professor?.name}
                                </CardDescription>
                              </div>
                              <Badge 
                                className={
                                  progress >= 75 
                                    ? "bg-green-100 text-green-700 border-green-300"
                                    : progress >= 50
                                    ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                    : "bg-red-100 text-red-700 border-red-300"
                                }
                              >
                                {progress}%
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Barra de Progresso */}
                            <div>
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-600 font-medium">Progresso Geral</span>
                                <span className="text-gray-900 font-bold">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>

                            {/* Estatísticas */}
                            <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                              <div className="text-center">
                                <div className="flex items-center justify-center mb-1">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="text-lg font-bold text-gray-900">
                                  {completedTopics}
                                </div>
                                <div className="text-xs text-gray-500">Concluídos</div>
                              </div>

                              <div className="text-center border-l border-r">
                                <div className="flex items-center justify-center mb-1">
                                  <Target className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="text-lg font-bold text-gray-900">
                                  {totalTopics}
                                </div>
                                <div className="text-xs text-gray-500">Total</div>
                              </div>

                              <div className="text-center">
                                <div className="flex items-center justify-center mb-1">
                                  <Award className="h-4 w-4 text-yellow-600" />
                                </div>
                                <div className="text-lg font-bold text-gray-900">
                                  {Math.floor(progress / 10)}
                                </div>
                                <div className="text-xs text-gray-500">Nota</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Atividade Recente */}
              <Card className="border-t-4 border-t-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    Resumo de Atividades
                  </CardTitle>
                  <CardDescription>
                    Visão geral do seu progresso e engajamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {stats?.totalHoursEstimated || 0}h
                        </div>
                        <div className="text-sm text-gray-600">Horas Estimadas</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                      <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {stats?.completedTopics || 0}
                        </div>
                        <div className="text-sm text-gray-600">Tópicos Concluídos</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                      <div className="bg-orange-100 p-3 rounded-full">
                        <Flame className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {stats?.journalEntries || 0}
                        </div>
                        <div className="text-sm text-gray-600">Entradas no Diário</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
