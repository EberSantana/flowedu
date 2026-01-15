import { trpc } from "@/lib/trpc";
import StudentLayout from "@/components/StudentLayout";
import { 
  TrendingUp, BookOpen, Target, Clock, CheckCircle2, 
  BarChart3, Layers, GraduationCap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useThemeColors } from "@/hooks/useThemeColors";

// Componente para card de estatística por disciplina
function SubjectStatCard({ subjectId, professorName }: { subjectId: number; professorName?: string }) {
  const { data: stats, isLoading } = trpc.student.getSubjectStatistics.useQuery({ subjectId });
  const colors = useThemeColors();

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-4 bg-muted rounded w-full"></div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className={`hover:shadow-lg transition-shadow border-l-4 ${colors.primary.border}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-foreground">
              {stats.subjectName}
            </CardTitle>
            <CardDescription className="mt-1">
              {stats.subjectCode} • {professorName || 'Professor'}
            </CardDescription>
          </div>
          <Badge 
            className={
              stats.progressPercentage >= 75 
                ? `${colors.primary.bgLight} ${colors.primary.text} border ${colors.primary.borderLight}`
                : stats.progressPercentage >= 50
                ? `${colors.primary.bgLight} ${colors.primary.text} border ${colors.primary.borderLight}`
                : "bg-muted text-muted-foreground border border-border"
            }
          >
            {stats.progressPercentage}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de Progresso */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground font-medium">Progresso Geral</span>
            <span className="text-foreground font-bold">{stats.progressPercentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${colors.primary.bg}`}
              style={{ width: `${stats.progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle2 className={`h-4 w-4 ${colors.primary.text}`} />
            </div>
            <div className="text-lg font-bold text-foreground">
              {stats.completedTopics}
            </div>
            <div className="text-xs text-muted-foreground">Concluídos</div>
          </div>

          <div className="text-center border-l border-border">
            <div className="flex items-center justify-center mb-1">
              <Target className={`h-4 w-4 ${colors.primary.text}`} />
            </div>
            <div className="text-lg font-bold text-foreground">
              {stats.totalTopics}
            </div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>

          <div className="text-center border-l border-border">
            <div className="flex items-center justify-center mb-1">
              <Layers className={`h-4 w-4 ${colors.primary.text}`} />
            </div>
            <div className="text-lg font-bold text-foreground">
              {stats.totalModules}
            </div>
            <div className="text-xs text-muted-foreground">Módulos</div>
          </div>

          <div className="text-center border-l border-border">
            <div className="flex items-center justify-center mb-1">
              <Clock className={`h-4 w-4 ${colors.primary.text}`} />
            </div>
            <div className="text-lg font-bold text-foreground">
              {stats.workload}h
            </div>
            <div className="text-xs text-muted-foreground">Carga</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentStatistics() {
  const colors = useThemeColors();
  
  // Buscar disciplinas matriculadas
  const { data: enrolledSubjects, isLoading: loadingSubjects } = 
    trpc.student.getEnrolledSubjects.useQuery();

  // Buscar estatísticas gerais
  const { data: stats, isLoading: loadingStats } = 
    trpc.student.getStudyStatistics.useQuery({});

  const activeSubjects = enrolledSubjects?.filter(e => e.status === 'active') || [];

  const isLoading = loadingSubjects || loadingStats;

  // Calcular totais de horas das disciplinas ativas
  const totalWorkload = activeSubjects.reduce((sum, e) => sum + (e.subject?.workload || 0), 0);

  return (
    <StudentLayout>
      <div className="min-h-screen bg-background">
        {/* Header - usando gradiente do tema */}
        <div className={`bg-gradient-to-r ${colors.primary.gradient} text-primary-foreground py-12 px-4`}>
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Estatísticas de Desempenho</h1>
                <p className="text-primary-foreground/80 mt-1">
                  Acompanhe seu desempenho e evolução em todas as disciplinas
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4 max-w-7xl">
          {isLoading ? (
            <div className="text-center py-12">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${colors.primary.border} mx-auto`}></div>
              <p className="mt-4 text-muted-foreground">Carregando estatísticas...</p>
            </div>
          ) : (
            <>
              {/* Cards de Estatísticas Gerais */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className={`border-l-4 ${colors.primary.border} hover:shadow-lg transition-shadow`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <BookOpen className={`h-4 w-4 ${colors.primary.text}`} />
                      Disciplinas Ativas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      {activeSubjects.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Matriculadas</p>
                  </CardContent>
                </Card>

                <Card className={`border-l-4 ${colors.primary.border} hover:shadow-lg transition-shadow`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${colors.primary.text}`} />
                      Tópicos Concluídos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      {stats?.completedTopics || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">de {stats?.totalTopics || 0} total</p>
                  </CardContent>
                </Card>

                <Card className={`border-l-4 ${colors.primary.border} hover:shadow-lg transition-shadow`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className={`h-4 w-4 ${colors.primary.text}`} />
                      Em Progresso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      {stats?.inProgressTopics || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Estudando</p>
                  </CardContent>
                </Card>

                <Card className={`border-l-4 ${colors.primary.border} hover:shadow-lg transition-shadow`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Target className={`h-4 w-4 ${colors.primary.text}`} />
                      Pendentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      {stats?.notStartedTopics || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">A iniciar</p>
                  </CardContent>
                </Card>
              </div>

              {/* Desempenho por Disciplina */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <TrendingUp className={`h-6 w-6 ${colors.primary.text}`} />
                  Desempenho por Disciplina
                </h2>

                {activeSubjects.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Nenhuma disciplina ativa
                      </h3>
                      <p className="text-muted-foreground">
                        Você ainda não está matriculado em nenhuma disciplina.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {activeSubjects.map((enrollment) => {
                      const subject = enrollment.subject;
                      if (!subject) return null;

                      return (
                        <SubjectStatCard 
                          key={enrollment.id}
                          subjectId={subject.id}
                          professorName={enrollment.professor?.name}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Resumo de Atividades */}
              <Card className={`border-l-4 ${colors.primary.border}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className={`h-5 w-5 ${colors.primary.text}`} />
                    Resumo de Atividades
                  </CardTitle>
                  <CardDescription>
                    Visão geral do seu progresso e engajamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className={`flex items-center gap-3 p-4 ${colors.primary.bgLight} rounded-lg`}>
                      <div className={`${colors.primary.bgLight} p-3 rounded-full border ${colors.primary.borderLight}`}>
                        <Clock className={`h-6 w-6 ${colors.primary.text}`} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">
                          {totalWorkload}h
                        </div>
                        <div className="text-sm text-muted-foreground">Carga Horária Total</div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-3 p-4 ${colors.primary.bgLight} rounded-lg`}>
                      <div className={`${colors.primary.bgLight} p-3 rounded-full border ${colors.primary.borderLight}`}>
                        <CheckCircle2 className={`h-6 w-6 ${colors.primary.text}`} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">
                          {stats?.completedTopics || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Tópicos Concluídos</div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-3 p-4 ${colors.primary.bgLight} rounded-lg`}>
                      <div className={`${colors.primary.bgLight} p-3 rounded-full border ${colors.primary.borderLight}`}>
                        <Target className={`h-6 w-6 ${colors.primary.text}`} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">
                          {stats?.totalTopics ? Math.round((stats.completedTopics / stats.totalTopics) * 100) : 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">Progresso Geral</div>
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
