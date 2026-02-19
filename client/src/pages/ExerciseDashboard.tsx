import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, CheckCircle2, FileText, AlertTriangle, Trophy } from "lucide-react";
import { Link } from "wouter";

export default function ExerciseDashboard() {
  // Navegação via Link component
  const { data: stats, isLoading } = trpc.teacherExercises.getDashboardStats.useQuery();

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <PageWrapper>
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando estatísticas...</p>
              </div>
            </div>
          </div>
        </PageWrapper>
      </div>
    );
  }

  const overallStats = stats?.overallStats || { averageScore: 0, approvalRate: 0, totalAttempts: 0 };
  const hardestExercises = stats?.hardestExercises || [];
  const topStudents = stats?.topStudents || [];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <PageWrapper>
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="mb-4 -ml-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Dashboard de Desempenho</h1>
              <p className="text-muted-foreground mt-1">
                Visão geral do desempenho dos alunos nos exercícios
              </p>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Média Geral */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Média Geral</p>
                  <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                    {overallStats.averageScore.toFixed(1)}%
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Nota média de todos os exercícios
                  </p>
                </div>
                <div className="p-3 bg-blue-500 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>

            {/* Taxa de Aprovação */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Taxa de Aprovação</p>
                  <p className="text-4xl font-bold text-green-900 dark:text-green-100">
                    {overallStats.approvalRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Alunos que atingiram a nota mínima
                  </p>
                </div>
                <div className="p-3 bg-green-500 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>

            {/* Total de Tentativas */}
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Total de Tentativas</p>
                  <p className="text-4xl font-bold text-orange-900 dark:text-orange-100">
                    {overallStats.totalAttempts}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Exercícios realizados por todos os alunos
                  </p>
                </div>
                <div className="p-3 bg-orange-500 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          </div>

          {/* Tabelas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Exercícios Mais Difíceis */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Exercícios Mais Difíceis</h2>
                  <p className="text-sm text-muted-foreground">Top 5 com menor taxa de aprovação</p>
                </div>
              </div>

              {hardestExercises.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum exercício com tentativas ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hardestExercises.map((exercise: any, index: number) => (
                    <div
                      key={exercise.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{exercise.title}</p>
                          <p className="text-xs text-muted-foreground">{exercise.subject || "Sem disciplina"}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          {exercise.approvalRate.toFixed(0)}%
                        </p>
                        <p className="text-xs text-muted-foreground">{exercise.attempts} tentativas</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Top Alunos */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Top Alunos</h2>
                  <p className="text-sm text-muted-foreground">Top 5 com melhor desempenho</p>
                </div>
              </div>

              {topStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum aluno com exercícios concluídos ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topStudents.map((student: any, index: number) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                          index === 0 ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400" :
                          index === 1 ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" :
                          index === 2 ? "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400" :
                          "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{student.fullName}</p>
                          <p className="text-xs text-muted-foreground">{student.className || "Sem turma"}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {student.averageScore.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">{student.completedExercises} exercícios</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
