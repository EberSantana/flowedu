import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Award,
  Target
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import StudentLayout from "@/components/StudentLayout";
import { useLocation } from "wouter";

export default function StudentExerciseReview() {
  const params = useParams();
  const exerciseId = parseInt(params.id as string);
  const [, setLocation] = useLocation();
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState(0);

  // Buscar histórico de tentativas
  const { data: history, isLoading } = trpc.studentExercises.getExerciseHistory.useQuery({ exerciseId });

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </StudentLayout>
    );
  }

  if (!history || history.attempts.length === 0) {
    return (
      <StudentLayout>
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="py-20 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Nenhuma tentativa encontrada</h3>
              <p className="text-gray-600 mb-6">
                Você ainda não fez nenhuma tentativa neste exercício.
              </p>
              <Button onClick={() => setLocation("/student-exercises")}>
                Voltar para Exercícios
              </Button>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  const currentAttempt = history.attempts[selectedAttemptIndex];
  const exercise = history.exercise;

  return (
    <StudentLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/student-exercises")}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar para Exercícios
          </Button>
          
          <h1 className="text-4xl font-bold mb-2">{exercise.title}</h1>
          <p className="text-gray-600 text-lg">{exercise.description}</p>
        </div>

        {/* Seletor de Tentativas */}
        {history.attempts.length > 1 && (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Selecione a Tentativa</h3>
                  <p className="text-sm text-gray-600">
                    Você fez {history.attempts.length} tentativa(s) neste exercício
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAttemptIndex(Math.max(0, selectedAttemptIndex - 1))}
                    disabled={selectedAttemptIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="text-center min-w-[120px]">
                    <p className="text-2xl font-bold text-purple-700">
                      Tentativa {selectedAttemptIndex + 1}
                    </p>
                    <p className="text-xs text-gray-600">
                      de {history.attempts.length}
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAttemptIndex(Math.min(history.attempts.length - 1, selectedAttemptIndex + 1))}
                    disabled={selectedAttemptIndex === history.attempts.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações da Tentativa */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{currentAttempt.score}%</p>
                  <p className="text-sm text-gray-600">Nota obtida</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {currentAttempt.correctAnswers}/{currentAttempt.totalQuestions}
                  </p>
                  <p className="text-sm text-gray-600">Acertos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(currentAttempt.submittedAt).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(currentAttempt.submittedAt).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status da Tentativa */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-4">
              {currentAttempt.score >= exercise.passingScore ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-700">Aprovado!</p>
                    <p className="text-gray-600">
                      Você atingiu a nota mínima de {exercise.passingScore}%
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-12 h-12 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-700">Reprovado</p>
                    <p className="text-gray-600">
                      Nota mínima necessária: {exercise.passingScore}%
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Questões e Respostas */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Revisão das Questões</h2>
          
          {currentAttempt.responses.map((response: any, index: number) => {
            const isCorrect = response.isCorrect;
            
            return (
              <Card 
                key={response.id}
                className={`border-2 ${
                  isCorrect 
                    ? 'border-green-200 bg-green-50/30' 
                    : 'border-red-200 bg-red-50/30'
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-sm">
                          Questão {index + 1}
                        </Badge>
                        {isCorrect ? (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Correta
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Incorreta
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{response.text || response.question}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Contexto do Caso (se houver) */}
                  {response.caseContext && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Contexto do Caso:</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {response.caseContext}
                      </p>
                    </div>
                  )}

                  {/* Opções (para questões objetivas) */}
                  {(response.type === 'objective' || response.questionType === 'objective') && response.options && response.options.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-semibold text-sm text-gray-700">Alternativas:</p>
                      {response.options.map((option: string, optIdx: number) => {
                        const isStudentAnswer = response.studentAnswer === option;
                        const isCorrectAnswer = response.correctAnswer === option;
                        
                        return (
                          <div
                            key={`${response.id}-option-${optIdx}`}
                            className={`p-3 rounded-lg border-2 ${
                              isCorrectAnswer
                                ? 'border-green-500 bg-green-50'
                                : isStudentAnswer
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isCorrectAnswer && (
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                              )}
                              {isStudentAnswer && !isCorrectAnswer && (
                                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                              )}
                              <span className={`text-sm ${
                                isCorrectAnswer || isStudentAnswer ? 'font-semibold' : ''
                              }`}>
                                {option}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Resposta do Aluno (para questões subjetivas) */}
                  {(response.type === 'subjective' || response.questionType === 'subjective' ||
                    response.type === 'case_study' || response.questionType === 'case_study' ||
                    response.type === 'pbl' || response.questionType === 'pbl') && (
                    <div className="space-y-3">
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Sua Resposta:</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {response.studentAnswer || "Não respondida"}
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-900 mb-2">Resposta Esperada:</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {response.correctAnswer}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Explicação */}
                  {response.explanation && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Explicação:</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {response.explanation}
                      </p>
                    </div>
                  )}

                  {/* Feedback da IA */}
                  {response.aiFeedback && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm font-semibold text-purple-900 mb-2">Feedback da IA:</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {response.aiFeedback}
                      </p>
                    </div>
                  )}

                  {/* Dicas de Estudo */}
                  {response.studyTips && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-semibold text-amber-900 mb-2">Dicas de Estudo:</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {response.studyTips}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Botão de Voltar */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => setLocation("/student-exercises")}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Voltar para Exercícios
          </Button>
        </div>
      </div>
    </StudentLayout>
  );
}
