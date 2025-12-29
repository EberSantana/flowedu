import { useParams, useLocation } from "wouter";
import StudentLayout from "@/components/StudentLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  Clock,
  Target,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export default function StudentExerciseResults() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const [, setLocation] = useLocation();

  // Buscar resultados da tentativa
  // @ts-ignore - Rota existe no backend, erro de inferência de tipo
  const { data: results, isLoading } = trpc.studentExercises.getResults.useQuery(
    { attemptId: parseInt(attemptId!) },
    { enabled: !!attemptId }
  );

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando resultados...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!results) {
    return (
      <StudentLayout>
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Resultados não encontrados</h2>
                <p className="text-gray-600 mb-4">
                  Não foi possível carregar os resultados desta tentativa.
                </p>
                <Button onClick={() => setLocation("/student-exercises")}>
                  Voltar para Exercícios
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  const scorePercentage = results.score;
  const correctCount = results.correctCount;
  const totalQuestions = results.totalQuestions;
  const incorrectCount = totalQuestions - correctCount;

  // Determinar cor e mensagem baseado na pontuação
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: "Excelente!", color: "bg-green-500" };
    if (score >= 70) return { label: "Bom trabalho!", color: "bg-blue-500" };
    if (score >= 50) return { label: "Pode melhorar", color: "bg-yellow-500" };
    return { label: "Precisa estudar mais", color: "bg-red-500" };
  };

  const scoreBadge = getScoreBadge(scorePercentage);

  return (
    <StudentLayout>
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Header com resultado geral */}
        <Card className="mb-6 border-t-4 border-t-blue-500 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2 flex items-center gap-3">
                  <Trophy className={`w-8 h-8 ${getScoreColor(scorePercentage)}`} />
                  Resultado do Exercício
                </CardTitle>
                <p className="text-gray-600">{results.exerciseTitle}</p>
              </div>
              <div className="text-center">
                <div className={`text-6xl font-bold ${getScoreColor(scorePercentage)}`}>
                  {scorePercentage.toFixed(1)}%
                </div>
                <Badge className={`${scoreBadge.color} text-white mt-2`}>
                  {scoreBadge.label}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-green-600">{correctCount}</div>
                  <div className="text-sm text-gray-600">Acertos</div>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6 text-center">
                  <XCircle className="w-10 h-10 text-red-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-red-600">{incorrectCount}</div>
                  <div className="text-sm text-gray-600">Erros</div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6 text-center">
                  <Target className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-blue-600">{totalQuestions}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progresso geral</span>
                <span>{correctCount} de {totalQuestions} questões corretas</span>
              </div>
              <Progress value={scorePercentage} className="h-3" />
            </div>

            {results.timeSpent && (
              <div className="mt-4 flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span>Tempo gasto: {Math.floor(results.timeSpent / 60)}min {results.timeSpent % 60}s</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gabarito detalhado */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Gabarito Detalhado
          </h2>
        </div>

        <div className="space-y-6">
          {results.questions.map((question: any, index: number) => {
            const isCorrect = question.isCorrect;
            const studentAnswer = question.studentAnswer;
            const correctAnswer = question.correctAnswer;

            return (
              <Card
                key={index}
                className={`border-l-4 ${
                  isCorrect ? "border-l-green-500 bg-green-50/30" : "border-l-red-500 bg-red-50/30"
                }`}
              >
                <CardHeader className="bg-white/80">
                  <div className="flex items-start gap-3">
                    <Badge
                      className={`${
                        isCorrect ? "bg-green-600" : "bg-red-600"
                      } text-white px-3 py-1 flex-shrink-0`}
                    >
                      {index + 1}
                    </Badge>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 leading-relaxed mb-2">
                        {question.question}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Correto
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                            <XCircle className="w-3 h-3 mr-1" />
                            Incorreto
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Resposta do aluno */}
                  <div className={`p-4 rounded-lg border-2 ${
                    isCorrect
                      ? "bg-green-50 border-green-300"
                      : "bg-red-50 border-red-300"
                  }`}>
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Sua resposta:
                    </div>
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="text-gray-900 leading-relaxed">
                        {studentAnswer || <em className="text-gray-500">Não respondida</em>}
                      </div>
                    </div>
                  </div>

                  {/* Resposta correta (se errou) */}
                  {!isCorrect && (
                    <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-300">
                      <div className="text-sm font-semibold text-gray-700 mb-2">
                        Resposta correta:
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-gray-900 leading-relaxed font-medium">
                          {correctAnswer}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Explicação (se disponível) */}
                  {question.explanation && (
                    <div className="p-4 rounded-lg bg-purple-50 border-2 border-purple-200">
                      <div className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Explicação:
                      </div>
                      <div className="text-gray-700 leading-relaxed">
                        {question.explanation}
                      </div>
                    </div>
                  )}

                  {/* Feedback com IA (apenas para questões erradas) */}
                  {!isCorrect && question.aiFeedback && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 shadow-md">
                      <div className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                        Feedback Personalizado:
                      </div>
                      <div className="text-gray-800 leading-relaxed mb-3 bg-white/60 p-3 rounded-md">
                        {question.aiFeedback}
                      </div>
                      
                      {/* Dicas de estudo */}
                      {question.studyTips && (
                        <div className="mt-3 pt-3 border-t-2 border-amber-200">
                          <div className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                            Dicas de Estudo:
                          </div>
                          <div className="text-gray-700 leading-relaxed bg-blue-50/50 p-3 rounded-md">
                            {question.studyTips}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Botões de ação */}
        <Card className="mt-8 sticky bottom-4 shadow-xl border-2 border-blue-200">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-3 justify-between">
              <Button
                variant="outline"
                onClick={() => setLocation("/student-exercises")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para Exercícios
              </Button>
              <div className="flex gap-3">
                {results.canRetry && (
                  <Button
                    onClick={() => setLocation(`/student-exercises/${id}/attempt`)}
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Tentar Novamente
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="gap-2"
                >
                  🖨️ Imprimir Resultados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSS para impressão */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </StudentLayout>
  );
}
