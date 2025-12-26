import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Trophy, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentExercises() {
  const [, setLocation] = useLocation();
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>();

  // Buscar exercícios disponíveis
  // TODO: Implementar após criar rotas tRPC
  const exercises: any[] = [];
  const isLoading = false;

  // Buscar disciplinas do aluno (comentado por enquanto - será implementado)
  // const { data: enrollments } = trpc.student.getEnrollments.useQuery();
  const enrollments: any[] = [];

  const getStatusBadge = (exercise: any) => {
    if (!exercise.canAttempt && exercise.attempts >= exercise.maxAttempts) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          Esgotado
        </Badge>
      );
    }

    if (exercise.lastAttempt?.status === "completed") {
      const score = exercise.lastAttempt.score;
      if (score >= exercise.passingScore) {
        return (
          <Badge className="gap-1 bg-green-600">
            <CheckCircle2 className="w-3 h-3" />
            Aprovado ({score}%)
          </Badge>
        );
      } else {
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Reprovado ({score}%)
          </Badge>
        );
      }
    }

    if (exercise.lastAttempt?.status === "in_progress") {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="w-3 h-3" />
          Em Andamento
        </Badge>
      );
    }

    return (
      <Badge className="gap-1 bg-blue-600">
        <BookOpen className="w-3 h-3" />
        Disponível
      </Badge>
    );
  };

  const handleStartExercise = (exerciseId: number) => {
    setLocation(`/student/exercises/${exerciseId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Exercícios Disponíveis</h1>
        <p className="text-muted-foreground">
          Complete os exercícios para ganhar pontos e subir no ranking!
        </p>
      </div>

      {/* Filtro por Disciplina */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <Button
          variant={selectedSubject === undefined ? "default" : "outline"}
          onClick={() => setSelectedSubject(undefined)}
        >
          Todas as Disciplinas
        </Button>
        {enrollments?.map((enrollment: any) => (
          <Button
            key={enrollment.subject.id}
            variant={selectedSubject === enrollment.subject.id ? "default" : "outline"}
            onClick={() => setSelectedSubject(enrollment.subject.id)}
          >
            {enrollment.subject.name}
          </Button>
        ))}
      </div>

      {/* Lista de Exercícios */}
      {exercises && exercises.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhum exercício disponível</h3>
            <p className="text-muted-foreground">
              Aguarde seu professor publicar novos exercícios.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exercises?.map((exercise: any) => (
            <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg">{exercise.title}</CardTitle>
                  {getStatusBadge(exercise)}
                </div>
                <CardDescription className="line-clamp-2">
                  {exercise.description || "Sem descrição"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Informações do Exercício */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    <span>{exercise.totalQuestions} questões</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="w-4 h-4" />
                    <span>{exercise.totalPoints} pontos</span>
                  </div>

                  {exercise.timeLimit && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{exercise.timeLimit} minutos</span>
                    </div>
                  )}

                  {/* Tentativas */}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Tentativas: {exercise.attempts} / {exercise.maxAttempts === 0 ? "∞" : exercise.maxAttempts}
                    </p>
                  </div>

                  {/* Melhor Resultado */}
                  {exercise.lastAttempt?.status === "completed" && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium">
                        Melhor resultado: {exercise.lastAttempt.score}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {exercise.lastAttempt.correctAnswers} / {exercise.lastAttempt.totalQuestions} acertos
                      </p>
                    </div>
                  )}

                  {/* Botão de Ação */}
                  <Button
                    className="w-full mt-4"
                    onClick={() => handleStartExercise(exercise.id)}
                    disabled={!exercise.canAttempt}
                  >
                    {exercise.lastAttempt?.status === "in_progress"
                      ? "Continuar"
                      : exercise.lastAttempt?.status === "completed"
                      ? "Tentar Novamente"
                      : "Iniciar Exercício"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
