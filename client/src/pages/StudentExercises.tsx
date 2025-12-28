import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Trophy, CheckCircle2, XCircle, AlertCircle, Calendar, Target } from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import StudentLayout from "@/components/StudentLayout";

export default function StudentExercises() {
  const [, setLocation] = useLocation();
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>();

  // Buscar exercícios disponíveis
  const { data: exercises = [], isLoading } = trpc.studentExercises.listAvailable.useQuery(
    { subjectId: selectedSubject },
    { refetchOnWindowFocus: false }
  );

  // Buscar disciplinas do aluno
  const { data: enrollments = [] } = trpc.student.getEnrolledSubjects.useQuery();

  const getStatusBadge = (exercise: any) => {
    if (!exercise.canAttempt && exercise.attempts >= exercise.maxAttempts) {
      return (
        <Badge variant="destructive" className="gap-1.5 px-3 py-1">
          <XCircle className="w-3.5 h-3.5" />
          Esgotado
        </Badge>
      );
    }

    if (exercise.lastAttempt?.status === "completed") {
      const score = exercise.lastAttempt.score;
      if (score >= exercise.passingScore) {
        return (
          <Badge className="gap-1.5 px-3 py-1 bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprovado ({score}%)
          </Badge>
        );
      } else {
        return (
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Reprovado ({score}%)
          </Badge>
        );
      }
    }

    if (exercise.lastAttempt?.status === "in_progress") {
      return (
        <Badge variant="outline" className="gap-1.5 px-3 py-1 border-blue-300 text-blue-700">
          <Clock className="w-3.5 h-3.5" />
          Em Andamento
        </Badge>
      );
    }

    return (
      <Badge className="gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700">
        <BookOpen className="w-3.5 h-3.5" />
        Disponível
      </Badge>
    );
  };

  const handleStartExercise = (exerciseId: number) => {
    setLocation(`/student-exercises/${exerciseId}/attempt`);
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="space-y-6">
            <Skeleton className="h-16 w-96" />
            <Skeleton className="h-12 w-full max-w-2xl" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 text-gray-900">Exercícios Disponíveis</h1>
          <p className="text-lg text-gray-600">
            Complete os exercícios para ganhar pontos e subir no ranking da turma!
          </p>
        </div>

        {/* Filtro por Disciplina */}
        {enrollments && enrollments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Filtrar por Disciplina
            </h2>
            <div className="flex gap-3 flex-wrap">
              <Button
                variant={selectedSubject === undefined ? "default" : "outline"}
                onClick={() => setSelectedSubject(undefined)}
                className="h-10"
              >
                Todas as Disciplinas
              </Button>
              {enrollments.map((enrollment: any) => (
                <Button
                  key={enrollment.subject.id}
                  variant={selectedSubject === enrollment.subject.id ? "default" : "outline"}
                  onClick={() => setSelectedSubject(enrollment.subject.id)}
                  className="h-10"
                >
                  {enrollment.subject.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Exercícios */}
        {exercises && exercises.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">
                Nenhum exercício disponível
              </h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto mb-6">
                Aguarde seu professor publicar novos exercícios para esta disciplina.
              </p>
              {enrollments && enrollments.length === 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-yellow-800">
                    <strong>Atenção:</strong> Você não está matriculado em nenhuma disciplina.
                    Entre em contato com seu professor.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exercises.map((exercise: any) => (
              <Card 
                key={exercise.id} 
                className="hover:shadow-xl transition-all duration-200 border-l-4 border-l-blue-500 flex flex-col"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <CardTitle className="text-xl font-bold text-gray-900 leading-tight">
                      {exercise.title}
                    </CardTitle>
                    {getStatusBadge(exercise)}
                  </div>
                  <CardDescription className="text-base text-gray-600 line-clamp-2">
                    {exercise.description || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    {/* Grid de Informações */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                        <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900">{exercise.totalQuestions}</p>
                          <p className="text-xs text-gray-600">questões</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                        <Trophy className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900">{exercise.totalPoints}</p>
                          <p className="text-xs text-gray-600">pontos</p>
                        </div>
                      </div>

                      {exercise.timeLimit && (
                        <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                          <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900">{exercise.timeLimit}</p>
                            <p className="text-xs text-gray-600">minutos</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                        <Target className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900">{exercise.passingScore}%</p>
                          <p className="text-xs text-gray-600">para passar</p>
                        </div>
                      </div>
                    </div>

                    {/* Tentativas */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tentativas:</span>
                        <span className="font-semibold text-gray-900">
                          {exercise.attempts} / {exercise.maxAttempts === 0 ? "∞" : exercise.maxAttempts}
                        </span>
                      </div>
                    </div>

                    {/* Melhor Resultado */}
                    {exercise.lastAttempt?.status === "completed" && (
                      <div className="pt-3 border-t bg-blue-50 -mx-6 px-6 py-3 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 mb-1">
                          Melhor resultado: {exercise.lastAttempt.score}%
                        </p>
                        <p className="text-xs text-blue-700">
                          {exercise.lastAttempt.correctAnswers} de {exercise.lastAttempt.totalQuestions} acertos
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Botão de Ação */}
                  <Button
                    className="w-full mt-6 h-11 text-base font-semibold"
                    onClick={() => handleStartExercise(exercise.id)}
                    disabled={!exercise.canAttempt}
                  >
                    {exercise.lastAttempt?.status === "in_progress"
                      ? "Continuar Exercício"
                      : exercise.lastAttempt?.status === "completed"
                      ? "Tentar Novamente"
                      : "Iniciar Exercício"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
