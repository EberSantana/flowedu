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
  const { data: results, isLoading } = (trpc.studentExercises as any).getResults.useQuery(
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
        <Card className="mb-8 border-t-4 border-t-blue-500 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2 flex items-center gap-3">
                  <Trophy className={`w-8 h-8 ${getScoreColor(scorePercentage)}`} />
                  {results.exerciseTitle}
                </CardTitle>
                <div className="flex items-center gap-3 mt-3">
                  <Badge className={`${scoreBadge.color} text-white px-4 py-1 text-base`}>
                    {scoreBadge.label}
                  </Badge>
                  <span className={`text-4xl font-bold ${getScoreColor(scorePercentage)}`}>
                    {scorePercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">Acertos</span>
                </div>
                <div className="text-3xl font-bold text-green-700">{correctCount}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                <div className="flex items-center gap-2 text-red-700 mb-1">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm font-semibold">Erros</span>
                </div>
                <div className="text-3xl font-bold text-red-700">{incorrectCount}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Target className="w-5 h-5" />
                  <span className="text-sm font-semibold">Total</span>
                </div>
                <div className="text-3xl font-bold text-blue-700">{totalQuestions}</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Progresso</span>
                <span className="text-sm text-gray-600">
                  {correctCount} de {totalQuestions} questões corretas
                </span>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            Gabarito Detalhado
          </h2>
          <p className="text-gray-600 text-base">
            Revise suas respostas e aprenda com os erros
          </p>
        </div>

        <div className="space-y-8">
          {results.questions.map((question: any, index: number) => {
            const isCorrect = question.isCorrect;
            const studentAnswer = question.studentAnswer;
            const correctAnswer = question.correctAnswer;
            const questionType = question.type;

            return (
              <Card
                key={index}
                className={`border-l-4 shadow-lg ${
                  isCorrect ? "border-l-green-500 bg-green-50/20" : "border-l-red-500 bg-red-50/20"
                }`}
              >
                <CardHeader className="bg-white/90 pb-4">
                  <div className="flex items-start gap-4">
                    {/* Número da questão */}
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg flex-shrink-0 ${
                        isCorrect ? "bg-green-600" : "bg-red-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      {/* Badge de status */}
                      <div className="flex items-center gap-2 mb-3">
                        {isCorrect ? (
                          <Badge className="bg-green-100 text-green-800 border border-green-300 px-3 py-1">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Correto
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border border-red-300 px-3 py-1">
                            <XCircle className="w-4 h-4 mr-1" />
                            Incorreto
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-gray-600">
                          {questionType === "objective" ? "Múltipla Escolha" : "Dissertativa"}
                        </Badge>
                      </div>

                      {/* Enunciado da questão */}
                      <CardTitle className="text-xl font-bold text-gray-900 leading-relaxed mb-4">
                        {question.text || question.question}
                      </CardTitle>

                      {/* Opções de resposta (se for múltipla escolha) */}
                      {questionType === "objective" && question.options && question.options.length > 0 && (
                        <div className="space-y-2 mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="text-sm font-semibold text-gray-700 mb-3">Alternativas:</div>
                          {question.options.map((option: string, optIndex: number) => {
                            const optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D...
                            const isStudentChoice = studentAnswer === optionLetter || studentAnswer === option;
                            const isCorrectOption = correctAnswer === optionLetter || correctAnswer === option;
                            
                            return (
                              <div
                                key={optIndex}
                                className={`flex items-start gap-3 p-3 rounded-md border-2 ${
                                  isCorrectOption
                                    ? "bg-green-50 border-green-400"
                                    : isStudentChoice
                                    ? "bg-red-50 border-red-400"
                                    : "bg-white border-gray-200"
                                }`}
                              >
                                <div
                                  className={`flex items-center justify-center w-8 h-8 rounded-full font-bold flex-shrink-0 ${
                                    isCorrectOption
                                      ? "bg-green-600 text-white"
                                      : isStudentChoice
                                      ? "bg-red-600 text-white"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {optionLetter}
                                </div>
                                <div className="flex-1 pt-1">
                                  <span className={`text-base leading-relaxed ${
                                    isCorrectOption || isStudentChoice ? "font-semibold" : ""
                                  }`}>
                                    {option}
                                  </span>
                                  {isCorrectOption && (
                                    <span className="ml-2 text-green-700 text-sm font-bold">
                                      ✓ Correta
                                    </span>
                                  )}
                                  {isStudentChoice && !isCorrectOption && (
                                    <span className="ml-2 text-red-700 text-sm font-bold">
                                      ✗ Sua escolha
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-5">
                  {/* Resposta do aluno (para questões dissertativas) */}
                  {questionType !== "objective" && (
                    <div className={`p-5 rounded-lg border-2 ${
                      isCorrect
                        ? "bg-green-50 border-green-300"
                        : "bg-red-50 border-red-300"
                    }`}>
                      <div className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        Sua resposta:
                      </div>
                      <div className="text-gray-900 text-base leading-relaxed bg-white/70 p-4 rounded-md">
                        {studentAnswer || <em className="text-gray-500">Não respondida</em>}
                      </div>
                    </div>
                  )}

                  {/* Resposta correta (se errou) */}
                  {!isCorrect && questionType !== "objective" && (
                    <div className="p-5 rounded-lg border-2 bg-blue-50 border-blue-300">
                      <div className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        Resposta esperada:
                      </div>
                      <div className="text-gray-900 text-base leading-relaxed font-medium bg-white/70 p-4 rounded-md">
                        {correctAnswer}
                      </div>
                    </div>
                  )}

                  {/* Explicação (se disponível) */}
                  {question.explanation && (
                    <div className="p-5 rounded-lg bg-purple-50 border-2 border-purple-300">
                      <div className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-purple-600" />
                        Explicação:
                      </div>
                      <div className="text-gray-800 text-base leading-relaxed bg-white/60 p-4 rounded-md">
                        {question.explanation}
                      </div>
                    </div>
                  )}

                  {/* Feedback com IA */}
                  {question.aiFeedback && (
                    <div className={`p-5 rounded-lg shadow-md border-2 ${
                      isCorrect 
                        ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300" 
                        : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300"
                    }`}>
                      <div className={`text-sm font-bold mb-3 flex items-center gap-2 ${
                        isCorrect ? "text-green-900" : "text-amber-900"
                      }`}>
                        <Sparkles className={`w-5 h-5 ${isCorrect ? "text-green-600" : "text-amber-600"}`} />
                        {isCorrect ? "Reforço de Aprendizado:" : "Feedback Personalizado:"}
                      </div>
                      <div className="text-gray-800 text-base leading-relaxed mb-3 bg-white/70 p-4 rounded-md">
                        {question.aiFeedback}
                      </div>
                      
                      {/* Dicas de estudo (apenas para erradas) */}
                      {!isCorrect && question.studyTips && (
                        <div className="mt-4 pt-4 border-t-2 border-amber-200">
                          <div className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                            Dicas de Estudo:
                          </div>
                          <div className="text-gray-800 text-base leading-relaxed bg-blue-50/70 p-4 rounded-md">
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

              {results.canRetry && (
                <Button
                  onClick={() => setLocation(`/student-exercises/${id}/attempt`)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  Tentar Novamente
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
