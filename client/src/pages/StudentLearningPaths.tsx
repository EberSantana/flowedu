import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, Map, ChevronRight, AlertCircle, CheckCircle2, Clock, Circle, 
  Lock, Unlock, TrendingUp, Calendar, MessageCircle, BookMarked, Target,
  Award, Flame, FileText, Lightbulb, Video, FileQuestion,
  Zap, Brain
} from "lucide-react";
import StudentLayout from "@/components/StudentLayout";
import { Link } from "wouter";


export default function StudentLearningPaths() {
  // Buscar disciplinas matriculadas
  const { data: enrolledSubjects, isLoading } = trpc.student.getEnrolledSubjects.useQuery();
  
  // Buscar estatísticas globais de estudo
  const { data: globalStats } = trpc.student.getStudyStatistics.useQuery({});

  // Filtrar disciplinas ativas (sem usar hooks condicionais)
  const activeSubjects = enrolledSubjects?.filter(e => e.status === 'active') || [];
  
  // Extrair IDs das disciplinas ativas para buscar estatísticas em uma única query
  const subjectIds = activeSubjects.map(e => e.subjectId);
  
  // Buscar estatísticas de todas as disciplinas de uma vez (evita hooks em loop)
  const { data: allSubjectStats } = trpc.student.getAllSubjectsStatistics.useQuery(
    { subjectIds },
    { enabled: subjectIds.length > 0 }
  );
  
  // Criar mapa de estatísticas por subjectId
  const subjectStatsMap: Record<number, any> = {};
  if (allSubjectStats) {
    allSubjectStats.forEach((stats: any) => {
      if (stats) {
        subjectStatsMap[stats.subjectId] = stats;
      }
    });
  }

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando trilhas de aprendizagem...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-600 text-white';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'hard': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
      default: return 'Médio';
    }
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Map className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Trilhas de Aprendizagem</h1>
                <p className="text-primary-foreground/80 mt-1">
                  Acompanhe seu progresso e domine cada disciplina passo a passo
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4 max-w-7xl">
          {/* Cards de Estatísticas Globais */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow bg-gradient-to-br from-primary/10 to-background">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-700">
                  Disciplinas Ativas
                </CardTitle>
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{activeSubjects.length}</p>
              <p className="text-sm text-gray-600 mt-1">disciplinas matriculadas</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success hover:shadow-lg transition-shadow bg-gradient-to-br from-success/10 to-background">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-700">
                  Tópicos Concluídos
                </CardTitle>
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{globalStats?.completedTopics || 0}</p>
              <p className="text-sm text-gray-600 mt-1">de {globalStats?.totalTopics || 0} tópicos</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent hover:shadow-lg transition-shadow bg-gradient-to-br from-accent/10 to-background">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-700">
                  Horas Estimadas
                </CardTitle>
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{globalStats?.totalHoursEstimated || 0}h</p>
              <p className="text-sm text-gray-600 mt-1">de estudo planejado</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning hover:shadow-lg transition-shadow bg-gradient-to-br from-warning/10 to-background">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-700">
                  Em Progresso
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{globalStats?.inProgressTopics || 0}</p>
              <p className="text-sm text-gray-600 mt-1">tópicos em andamento</p>
            </CardContent>
          </Card>
          </div>

          {/* Lista de Disciplinas com Trilhas */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Suas Trilhas de Aprendizagem
            </h2>
            </div>

            {activeSubjects.length === 0 ? (
            <Card className="bg-white shadow-lg">
              <CardContent className="py-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhuma disciplina encontrada
                </h3>
                <p className="text-gray-600">
                  Você ainda não está matriculado em nenhuma disciplina com trilha de aprendizagem.
                </p>
              </CardContent>
            </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeSubjects.map((enrollment) => {
                const subject = enrollment.subject;
                if (!subject) return null;

                // Buscar estatísticas específicas desta disciplina
                const subjectStats = subjectStatsMap[enrollment.subjectId];
                const progress = subjectStats?.progressPercentage || 0;
                const completedTopics = subjectStats?.completedTopics || 0;
                const inProgressTopics = subjectStats?.inProgressTopics || 0;
                const notStartedTopics = subjectStats?.notStartedTopics || 0;
                const totalTopics = subjectStats?.totalTopics || 0;
                const hasLearningPath = totalTopics > 0;

                return (
                  <Card 
                    key={enrollment.id} 
                    className="bg-white shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-t-blue-500 group"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                            {subject.name}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600 mt-1">
                            {subject.code} • {enrollment.professor?.name || 'Professor'}
                          </CardDescription>
                        </div>
                        {hasLearningPath && (
                          <Badge className="bg-emerald-600 text-white">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Trilha Ativa
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {hasLearningPath ? (
                        <>
                          {/* Progresso */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 font-medium">Progresso Geral</span>
                              <span className="text-gray-900 font-bold">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            {progress === 0 && totalTopics > 0 && (
                              <p className="text-xs text-gray-500 italic">
                                Comece a estudar os tópicos para ver seu progresso aqui!
                              </p>
                            )}
                          </div>

                          {/* Estatísticas Rápidas */}
                          <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                            <div className="text-center">
                              <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                              <div className="text-lg font-bold text-gray-900">
                                {completedTopics}
                              </div>
                              <div className="text-xs text-gray-500">Concluídos</div>
                            </div>
                            <div className="text-center">
                              <Target className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                              <div className="text-lg font-bold text-gray-900">
                                {totalTopics}
                              </div>
                              <div className="text-xs text-gray-500">Total</div>
                            </div>
                            <div className="text-center">
                              <BookOpen className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                              <div className="text-lg font-bold text-gray-900">
                                {subjectStats?.totalModules || 0}
                              </div>
                              <div className="text-xs text-gray-500">Módulos</div>
                            </div>
                          </div>

                          {/* Botão Ver Trilha */}
                          <div className="pt-2">
                            <Link 
                              href={`/student/learning-path/${subject.id}/${enrollment.userId}`}
                            >
                              <Button 
                                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-md"
                                size="sm"
                              >
                                <Map className="w-4 h-4 mr-2" />
                                Ver Trilha
                              </Button>
                            </Link>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            Trilha de aprendizagem ainda não disponível para esta disciplina.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            )}
          </div>

          {/* Recursos Adicionais */}
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Card className="bg-white border-2 border-purple-200 hover:shadow-lg hover:border-purple-400 transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  Minhas Dúvidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Envie suas dúvidas aos professores e acompanhe as respostas.
                </p>
                <Link href="/student/doubts">
                  <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Ver Dúvidas ({globalStats?.pendingDoubts || 0})
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-emerald-200 hover:shadow-lg hover:border-emerald-400 transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Acompanhe seu desempenho e evolução em todas as disciplinas.
                </p>
                <Link href="/student/statistics">
                  <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Ver Estatísticas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
