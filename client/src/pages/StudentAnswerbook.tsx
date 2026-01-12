import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, CheckCircle2, XCircle, Filter, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function StudentAnswerbook() {
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>(undefined);
  const [selectedExercise, setSelectedExercise] = useState<number | undefined>(undefined);

  // Buscar disciplinas matriculadas
  const { data: subjects } = trpc.student.getEnrolledSubjects.useQuery();

  // Buscar caderno de respostas detalhado
  const { data: answerbook, isLoading } = trpc.notebook.getDetailedAnswerbook.useQuery({
    subjectId: selectedSubject,
    exerciseId: selectedExercise,
  });

  // Buscar estatísticas
  const { data: stats } = trpc.notebook.getStats.useQuery({
    subjectId: selectedSubject,
  });

  // Extrair lista de exercícios únicos para filtro
  const exercises = answerbook?.map(ex => ({
    id: ex.exerciseId,
    title: ex.exerciseTitle,
  })) || [];

  const handleClearFilters = () => {
    setSelectedSubject(undefined);
    setSelectedExercise(undefined);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Sidebar />
      <PageWrapper>
        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                Caderno de Respostas
              </h1>
              <p className="text-gray-600 mt-2">
                Revise todas as perguntas respondidas com gabarito completo
              </p>
            </div>
          </div>

          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total de Questões</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalQuestions}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Acertos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{stats.correctQuestions}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.totalQuestions > 0 
                      ? `${Math.round((stats.correctQuestions / stats.totalQuestions) * 100)}%`
                      : '0%'
                    }
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Erros</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">{stats.incorrectQuestions}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.totalQuestions > 0 
                      ? `${Math.round((stats.incorrectQuestions / stats.totalQuestions) * 100)}%`
                      : '0%'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
              <CardDescription>
                Filtre as questões por disciplina ou exercício específico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Disciplina
                  </label>
                  <Select
                    value={selectedSubject?.toString() || "all"}
                    onValueChange={(value) => {
                      setSelectedSubject(value === "all" ? undefined : Number(value));
                      setSelectedExercise(undefined); // Limpar filtro de exercício
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as disciplinas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as disciplinas</SelectItem>
                      {subjects?.map((subject) => (
                        <SelectItem key={subject.subject?.id} value={subject.subject?.id.toString() || ''}>
                          {subject.subject?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Exercício
                  </label>
                  <Select
                    value={selectedExercise?.toString() || "all"}
                    onValueChange={(value) => 
                      setSelectedExercise(value === "all" ? undefined : Number(value))
                    }
                    disabled={!selectedSubject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os exercícios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os exercícios</SelectItem>
                      {exercises.map((exercise) => (
                        <SelectItem key={exercise.id} value={exercise.id.toString()}>
                          {exercise.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(selectedSubject || selectedExercise) && (
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="whitespace-nowrap"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Exercícios e Questões */}
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">Carregando caderno de respostas...</p>
              </CardContent>
            </Card>
          ) : !answerbook || answerbook.length === 0 ? (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Nenhuma questão respondida encontrada. Complete alguns exercícios para visualizar seu caderno de respostas.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {answerbook.map((exercise) => (
                <Card key={exercise.exerciseId} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      {exercise.exerciseTitle}
                    </CardTitle>
                    <CardDescription>
                      {exercise.questions.length} {exercise.questions.length === 1 ? 'questão' : 'questões'} respondida{exercise.questions.length === 1 ? '' : 's'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {exercise.questions.map((question: any, index: number) => (
                      <div key={question.answerId}>
                        {index > 0 && <Separator className="my-6" />}
                        
                        <div className="space-y-4">
                          {/* Cabeçalho da Questão */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="font-mono">
                                  Questão {question.questionNumber}
                                </Badge>
                                <Badge variant={question.isCorrect ? "default" : "destructive"}>
                                  {question.isCorrect ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Correta
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Incorreta
                                    </>
                                  )}
                                </Badge>
                              </div>
                              <p className="text-gray-900 font-medium leading-relaxed">
                                {question.questionText}
                              </p>
                            </div>
                          </div>

                          {/* Opções de Resposta (para questões objetivas) */}
                          {question.questionType === 'objective' && question.options && question.options.length > 0 && (
                            <div className="space-y-2 ml-4">
                              {question.options.map((option: any, optIndex: number) => {
                                const optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D...
                                const isStudentAnswer = question.studentAnswer === optionLetter;
                                const isCorrectAnswer = question.correctAnswer === optionLetter;
                                
                                let bgColor = 'bg-gray-50';
                                let borderColor = 'border-gray-200';
                                let textColor = 'text-gray-700';
                                
                                if (isCorrectAnswer) {
                                  bgColor = 'bg-green-50';
                                  borderColor = 'border-green-500';
                                  textColor = 'text-green-900';
                                } else if (isStudentAnswer && !question.isCorrect) {
                                  bgColor = 'bg-red-50';
                                  borderColor = 'border-red-500';
                                  textColor = 'text-red-900';
                                }
                                
                                return (
                                  <div
                                    key={optIndex}
                                    className={`p-3 rounded-lg border-2 ${bgColor} ${borderColor} transition-colors`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <span className={`font-bold ${textColor} min-w-[24px]`}>
                                        {optionLetter})
                                      </span>
                                      <span className={textColor}>
                                        {option.text || option}
                                      </span>
                                      {isCorrectAnswer && (
                                        <Badge variant="default" className="ml-auto bg-green-600">
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Correta
                                        </Badge>
                                      )}
                                      {isStudentAnswer && !question.isCorrect && (
                                        <Badge variant="destructive" className="ml-auto">
                                          <XCircle className="h-3 w-3 mr-1" />
                                          Sua resposta
                                        </Badge>
                                      )}
                                      {isStudentAnswer && question.isCorrect && (
                                        <Badge variant="default" className="ml-auto bg-blue-600">
                                          Sua resposta
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Respostas para questões subjetivas */}
                          {question.questionType !== 'objective' && (
                            <div className="space-y-3 ml-4">
                              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                <p className="text-sm font-semibold text-blue-900 mb-2">
                                  Sua resposta:
                                </p>
                                <p className="text-blue-800">
                                  {question.studentAnswer}
                                </p>
                              </div>
                              
                              {question.correctAnswer && (
                                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                                  <p className="text-sm font-semibold text-green-900 mb-2">
                                    Resposta esperada:
                                  </p>
                                  <p className="text-green-800">
                                    {question.correctAnswer}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Pontuação */}
                          <div className="flex items-center gap-2 text-sm text-gray-600 ml-4">
                            <span className="font-medium">Pontuação:</span>
                            <span className={question.isCorrect ? 'text-green-600 font-semibold' : 'text-red-600'}>
                              {question.pointsAwarded} pontos
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </div>
  );
}
