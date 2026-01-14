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
  Target,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Sparkles
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import StudentLayout from "@/components/StudentLayout";
import { useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";

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
  const correctPercentage = (currentAttempt.correctAnswers / currentAttempt.totalQuestions) * 100;

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

        {/* Resumo Visual de Desempenho */}
        <Card className="mb-8 overflow-hidden">
          <div className={`h-2 ${currentAttempt.score >= exercise.passingScore ? 'bg-green-500' : 'bg-red-500'}`} />
          <CardContent className="py-6">
            <div className="grid md:grid-cols-4 gap-6">
              {/* Nota */}
              <div className="text-center">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold ${
                  currentAttempt.score >= 80 ? 'bg-green-500' :
                  currentAttempt.score >= 60 ? 'bg-yellow-500' :
                  currentAttempt.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}>
                  {currentAttempt.score}%
                </div>
                <p className="mt-2 text-sm font-medium text-gray-600">Nota Obtida</p>
              </div>

              {/* Acertos */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <span className="text-2xl font-bold text-green-600">{currentAttempt.correctAnswers}</span>
                  </div>
                  <span className="text-gray-400">/</span>
                  <span className="text-2xl font-bold text-gray-600">{currentAttempt.totalQuestions}</span>
                </div>
                <Progress 
                  value={correctPercentage} 
                  className="h-2 w-32 mx-auto"
                />
                <p className="mt-2 text-sm font-medium text-gray-600">Questões Corretas</p>
              </div>

              {/* Data */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(currentAttempt.submittedAt).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-gray-600">
                  {new Date(currentAttempt.submittedAt).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>

              {/* Status */}
              <div className="text-center">
                {currentAttempt.score >= exercise.passingScore ? (
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <Award className="w-8 h-8 text-green-600" />
                  </div>
                ) : (
                  <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-2">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                )}
                <p className={`text-sm font-bold ${currentAttempt.score >= exercise.passingScore ? 'text-green-600' : 'text-red-600'}`}>
                  {currentAttempt.score >= exercise.passingScore ? 'APROVADO' : 'REPROVADO'}
                </p>
                <p className="text-xs text-gray-600">
                  Mínimo: {exercise.passingScore}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legenda Visual */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Legenda:</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-sm text-gray-600">Resposta Correta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-sm text-gray-600">Resposta Incorreta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-50" />
              <span className="text-sm text-gray-600">Alternativa Correta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-red-500 bg-red-50" />
              <span className="text-sm text-gray-600">Sua Resposta (Errada)</span>
            </div>
          </div>
        </div>

        {/* Questões e Respostas */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Revisão das Questões</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>{currentAttempt.correctAnswers} certas</span>
              <span className="mx-2">|</span>
              <XCircle className="w-4 h-4 text-red-500" />
              <span>{currentAttempt.totalQuestions - currentAttempt.correctAnswers} erradas</span>
            </div>
          </div>
          
          {currentAttempt.responses.map((response: any, index: number) => {
            const isCorrect = response.isCorrect;
            
            return (
              <Card 
                key={response.id || `response-${index}`}
                className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                  isCorrect 
                    ? 'border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/50 to-white' 
                    : 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-white'
                }`}
              >
                {/* Indicador Visual Grande */}
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${
                  isCorrect ? 'bg-green-500' : 'bg-red-500'
                }`} />
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Número da Questão com Indicador */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          isCorrect ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {index + 1}
                        </div>
                        
                        {/* Badge de Status */}
                        {isCorrect ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm font-semibold">Resposta Correta</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm font-semibold">Resposta Incorreta</span>
                          </div>
                        )}
                        
                        {/* Tipo de Questão */}
                        <Badge variant="outline" className="text-xs">
                          {response.type === 'objective' || response.questionType === 'objective' 
                            ? 'Objetiva' 
                            : response.type === 'subjective' || response.questionType === 'subjective'
                            ? 'Subjetiva'
                            : response.type === 'case_study' || response.questionType === 'case_study'
                            ? 'Estudo de Caso'
                            : 'PBL'}
                        </Badge>
                      </div>
                      
                      {/* Enunciado da Questão */}
                      <CardTitle className="text-lg font-medium text-gray-800 leading-relaxed">
                        {response.text || response.question}
                      </CardTitle>
                    </div>
                    
                    {/* Ícone Grande de Status */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      isCorrect ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {isCorrect ? (
                        <CheckCircle2 className="w-7 h-7 text-green-600" />
                      ) : (
                        <XCircle className="w-7 h-7 text-red-600" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 pt-0">
                  {/* Contexto do Caso (se houver) */}
                  {response.caseContext && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-semibold text-blue-900">Contexto do Caso:</p>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {response.caseContext}
                      </p>
                    </div>
                  )}

                  {/* Opções (para questões objetivas) */}
                  {(response.type === 'objective' || response.questionType === 'objective') && response.options && response.options.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-semibold text-sm text-gray-700 mb-3">Alternativas:</p>
                      {response.options.map((option: string, optIdx: number) => {
                        const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D...
                        const isStudentAnswer = response.studentAnswer === option || 
                                               response.studentAnswer === optionLetter ||
                                               response.studentAnswer?.includes(option);
                        const isCorrectAnswer = response.correctAnswer === option ||
                                               response.correctAnswer === optionLetter ||
                                               response.correctAnswer?.includes(option);
                        
                        let bgClass = 'bg-gray-50 border-gray-200 hover:bg-gray-100';
                        let textClass = 'text-gray-700';
                        let iconElement = null;
                        
                        if (isCorrectAnswer) {
                          bgClass = 'bg-green-50 border-green-400 border-2';
                          textClass = 'text-green-800 font-semibold';
                          iconElement = <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />;
                        } else if (isStudentAnswer) {
                          bgClass = 'bg-red-50 border-red-400 border-2';
                          textClass = 'text-red-800 font-semibold';
                          iconElement = <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />;
                        }
                        
                        return (
                          <div
                            key={`${response.id || index}-option-${optIdx}`}
                            className={`p-3 rounded-lg border transition-colors ${bgClass}`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Letra da Alternativa */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                isCorrectAnswer 
                                  ? 'bg-green-500 text-white' 
                                  : isStudentAnswer 
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-200 text-gray-600'
                              }`}>
                                {optionLetter}
                              </div>
                              
                              {/* Texto da Alternativa */}
                              <span className={`flex-1 text-sm ${textClass}`}>
                                {option}
                              </span>
                              
                              {/* Ícone de Status */}
                              {iconElement}
                              
                              {/* Labels */}
                              <div className="flex gap-2">
                                {isCorrectAnswer && (
                                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                    Correta
                                  </span>
                                )}
                                {isStudentAnswer && !isCorrectAnswer && (
                                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                                    Sua resposta
                                  </span>
                                )}
                                {isStudentAnswer && isCorrectAnswer && (
                                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                    Sua resposta ✓
                                  </span>
                                )}
                              </div>
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
                      <div className={`p-4 rounded-lg border-2 ${
                        isCorrect 
                          ? 'bg-green-50 border-green-300' 
                          : 'bg-red-50 border-red-300'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <p className={`text-sm font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                            Sua Resposta:
                          </p>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {response.studentAnswer || "Não respondida"}
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-semibold text-green-800">Resposta Esperada:</p>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {response.correctAnswer}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Explicação */}
                  {response.explanation && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-semibold text-blue-900">Explicação:</p>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {response.explanation}
                      </p>
                    </div>
                  )}

                  {/* Feedback da IA */}
                  {response.aiFeedback && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <p className="text-sm font-semibold text-purple-900">Feedback da IA:</p>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {response.aiFeedback}
                      </p>
                    </div>
                  )}

                  {/* Dicas de Estudo */}
                  {response.studyTips && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        <p className="text-sm font-semibold text-amber-900">Dicas de Estudo:</p>
                      </div>
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

        {/* Resumo Final */}
        <Card className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100 border-2">
          <CardContent className="py-6">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">Resumo do Desempenho</h3>
              <div className="flex justify-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-green-600">{currentAttempt.correctAnswers}</p>
                    <p className="text-xs text-gray-600">Acertos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-red-600">{currentAttempt.totalQuestions - currentAttempt.correctAnswers}</p>
                    <p className="text-xs text-gray-600">Erros</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    currentAttempt.score >= exercise.passingScore ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Award className={`w-6 h-6 ${
                      currentAttempt.score >= exercise.passingScore ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className={`text-2xl font-bold ${
                      currentAttempt.score >= exercise.passingScore ? 'text-green-600' : 'text-red-600'
                    }`}>{currentAttempt.score}%</p>
                    <p className="text-xs text-gray-600">Nota Final</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
