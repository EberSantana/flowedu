import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Target, 
  TrendingUp,
  BookOpen,
  Award,
  Calendar,
  ArrowLeft
} from "lucide-react";
import StudentLayout from '../components/StudentLayout';
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function StudentStats() {
  // Buscar disciplinas matriculadas
  const { data: enrolledSubjects, isLoading: loadingSubjects } = trpc.student.getEnrolledSubjects.useQuery();
  
  // Buscar tentativas de exercícios
  const { data: exerciseHistoryRaw, isLoading: loadingHistory } = trpc.studentExercises.getHistory.useQuery({});
  
  // Transformar dados para formato mais simples
  const exerciseHistory = exerciseHistoryRaw?.map(item => ({
    id: item.attempt.id,
    exerciseId: item.attempt.exerciseId,
    exerciseTitle: item.exercise.title,
    subjectId: item.exercise.subjectId,
    subjectName: item.exercise.title, // Usaremos o título por enquanto
    score: item.attempt.score,
    correctAnswers: item.attempt.correctAnswers,
    totalQuestions: item.attempt.totalQuestions,
    timeSpent: item.attempt.timeSpent || 0,
    status: item.attempt.status,
    completedAt: item.attempt.completedAt,
  })) || [];

  const isLoading = loadingSubjects || loadingHistory;

  // Calcular estatísticas gerais
  const stats = {
    totalExercises: exerciseHistory?.length || 0,
    completedExercises: exerciseHistory?.filter(e => e.status === 'completed').length || 0,
    averageScore: exerciseHistory?.length 
      ? Math.round(exerciseHistory.reduce((acc, e) => acc + (e.score || 0), 0) / exerciseHistory.length)
      : 0,
    totalCorrect: exerciseHistory?.reduce((acc, e) => acc + (e.correctAnswers || 0), 0) || 0,
    totalQuestions: exerciseHistory?.reduce((acc, e) => acc + (e.totalQuestions || 0), 0) || 0,
    totalTimeSpent: exerciseHistory?.reduce((acc, e) => acc + (e.timeSpent || 0), 0) || 0,
    perfectScores: exerciseHistory?.filter(e => e.score === 100).length || 0,
  };

  const accuracyRate = stats.totalQuestions > 0 
    ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) 
    : 0;

  // Formatar tempo
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Agrupar exercícios por disciplina
  const exercisesBySubject = exerciseHistory?.reduce((acc, attempt) => {
    const subjectId = attempt.subjectId;
    if (!acc[subjectId]) {
      acc[subjectId] = {
        subjectId,
        subjectName: attempt.subjectName || 'Disciplina',
        attempts: [],
        totalScore: 0,
        totalCorrect: 0,
        totalQuestions: 0,
      };
    }
    acc[subjectId].attempts.push(attempt);
    acc[subjectId].totalScore += attempt.score || 0;
    acc[subjectId].totalCorrect += attempt.correctAnswers || 0;
    acc[subjectId].totalQuestions += attempt.totalQuestions || 0;
    return acc;
  }, {} as Record<number, any>) || {};

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/student-dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Estatísticas de Desempenho</h1>
              <p className="text-gray-600">Acompanhe seu progresso nos exercícios</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-green-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium">Carregando estatísticas...</p>
          </div>
        ) : (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Exercícios</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.completedExercises}</p>
                      <p className="text-xs text-gray-400">concluídos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Média Geral</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
                      <p className="text-xs text-gray-400">de acerto</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Questões Corretas</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalCorrect}</p>
                      <p className="text-xs text-gray-400">de {stats.totalQuestions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tempo Total</p>
                      <p className="text-2xl font-bold text-gray-900">{formatTime(stats.totalTimeSpent)}</p>
                      <p className="text-xs text-gray-400">estudando</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Taxa de Acerto Geral */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Taxa de Acerto Geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Progresso</span>
                    <span className="text-lg font-bold text-green-600">{accuracyRate}%</span>
                  </div>
                  <Progress value={accuracyRate} className="h-3" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{stats.totalCorrect} acertos</span>
                    <span>{stats.totalQuestions - stats.totalCorrect} erros</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conquistas */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Conquistas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="text-3xl font-bold text-yellow-600">{stats.perfectScores}</div>
                    <p className="text-sm text-gray-600 mt-1">Notas 100%</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600">{stats.completedExercises}</div>
                    <p className="text-sm text-gray-600 mt-1">Exercícios Feitos</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="text-3xl font-bold text-green-600">{stats.totalCorrect}</div>
                    <p className="text-sm text-gray-600 mt-1">Respostas Corretas</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="text-3xl font-bold text-purple-600">
                      {Object.keys(exercisesBySubject).length}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Disciplinas Praticadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desempenho por Disciplina */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Desempenho por Disciplina
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(exercisesBySubject).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum exercício realizado ainda</p>
                    <Link href="/student-exercises">
                      <Button variant="outline" className="mt-4">
                        Começar a Praticar
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.values(exercisesBySubject).map((subject: any) => {
                      const avgScore = subject.attempts.length > 0 
                        ? Math.round(subject.totalScore / subject.attempts.length)
                        : 0;
                      const accuracy = subject.totalQuestions > 0
                        ? Math.round((subject.totalCorrect / subject.totalQuestions) * 100)
                        : 0;

                      return (
                        <div key={subject.subjectId} className="p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">{subject.subjectName}</h3>
                            <Badge variant={avgScore >= 70 ? "default" : "secondary"}>
                              Média: {avgScore}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Exercícios</p>
                              <p className="font-semibold">{subject.attempts.length}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Acertos</p>
                              <p className="font-semibold">{subject.totalCorrect}/{subject.totalQuestions}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Taxa</p>
                              <p className="font-semibold text-green-600">{accuracy}%</p>
                            </div>
                          </div>
                          <Progress value={accuracy} className="h-2 mt-3" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Histórico Recente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Histórico Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!exerciseHistory || exerciseHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum exercício no histórico</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exerciseHistory.slice(0, 10).map((attempt: any) => (
                      <div 
                        key={attempt.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            attempt.score >= 70 ? 'bg-green-100' : 'bg-orange-100'
                          }`}>
                            {attempt.score >= 70 ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Target className="w-4 h-4 text-orange-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{attempt.exerciseTitle || 'Exercício'}</p>
                            <p className="text-xs text-gray-500">
                              {attempt.subjectName} • {attempt.correctAnswers}/{attempt.totalQuestions} acertos
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={attempt.score >= 70 ? "default" : "secondary"}>
                            {attempt.score}%
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">
                            {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString('pt-BR') : '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
