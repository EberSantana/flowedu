import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  Target,
  Search,
  Filter,
  Award,
  FileText,
  RefreshCw
} from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import StudentLayout from "@/components/StudentLayout";

export default function StudentExercises() {
  const [, setLocation] = useLocation();
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar exercícios disponíveis
  const { data: exercises = [], isLoading, refetch, isFetching } = trpc.studentExercises.listAvailable.useQuery(
    { subjectId: selectedSubject },
    { 
      refetchOnWindowFocus: true,  // Atualizar ao voltar para a página
      refetchOnMount: true,         // Atualizar ao montar o componente
    }
  );
  
  const handleRefresh = () => {
    refetch();
  };

  // Buscar disciplinas do aluno
  const { data: enrollments = [] } = trpc.student.getEnrolledSubjects.useQuery();

  const getStatusBadge = (exercise: any) => {
    if (!exercise.canAttempt && exercise.attempts >= exercise.maxAttempts) {
      return (
        <Badge variant="destructive" className="gap-1.5 px-3 py-1.5 text-sm font-semibold">
          <XCircle className="w-4 h-4" />
          Esgotado
        </Badge>
      );
    }

    if (exercise.lastAttempt?.status === "completed") {
      const score = exercise.lastAttempt.score; // 0-100
      const grade = (score / 10).toFixed(1); // 0-10
      if (score >= exercise.passingScore) {
        return (
          <Badge className="gap-1.5 px-3 py-1.5 text-sm font-semibold bg-success hover:bg-success/90">
            <CheckCircle2 className="w-4 h-4" />
            Aprovado ({grade})
          </Badge>
        );
      } else {
        return (
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            Reprovado ({grade})
          </Badge>
        );
      }
    }

    if (exercise.lastAttempt?.status === "in_progress") {
      return (
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm font-semibold border-primary/50 text-primary">
          <Clock className="w-4 h-4" />
          Em Andamento
        </Badge>
      );
    }

    return (
      <Badge className="gap-1.5 px-3 py-1.5 text-sm font-semibold bg-primary hover:bg-primary/90">
        <BookOpen className="w-4 h-4" />
        Disponível
      </Badge>
    );
  };

  const handleStartExercise = (exerciseId: number) => {
    setLocation(`/student-exercises/${exerciseId}/attempt`);
  };

  // Filtrar exercícios por busca
  const filteredExercises = exercises.filter((exercise: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      exercise.title?.toLowerCase().includes(query) ||
      exercise.description?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="space-y-8">
            <Skeleton className="h-20 w-full max-w-2xl" />
            <Skeleton className="h-14 w-full max-w-md" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-96" />
              ))}
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Exercícios Disponíveis</h1>
              <p className="text-muted-foreground mt-1">Pratique e aprimore seus conhecimentos</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isFetching}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
          {/* Barra de Busca e Filtros */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar exercícios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              {enrollments && enrollments.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedSubject === undefined ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSubject(undefined)}
                  >
                    Todas
                  </Button>
                  {enrollments.map((enrollment: any) => (
                    <Button
                      key={enrollment.subject.id}
                      variant={selectedSubject === enrollment.subject.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSubject(enrollment.subject.id)}
                    >
                      {enrollment.subject.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {searchQuery && (
            <p className="text-sm text-muted-foreground mb-4">
              <span className="font-semibold text-foreground">{filteredExercises.length}</span> exercício(s) encontrado(s)
            </p>
          )}

          {filteredExercises && filteredExercises.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">Nenhum exercício disponível</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery 
                  ? "Nenhum exercício corresponde à sua busca."
                  : "Aguarde seu professor publicar novos exercícios."}
              </p>
              {enrollments && enrollments.length === 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800 text-left">
                      Você não está matriculado em nenhuma disciplina. Entre em contato com seu professor.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredExercises.map((exercise: any) => (
              <Card 
                key={exercise.id} 
                className="hover:shadow-md transition-all duration-200 flex flex-col"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <CardTitle className="text-base font-semibold text-foreground leading-tight flex-1">
                      {exercise.title}
                    </CardTitle>
                    {getStatusBadge(exercise)}
                  </div>
                  <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                    {exercise.description || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    {/* Informações compactas */}
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {exercise.totalQuestions} questões
                      </span>
                      {exercise.timeLimit && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {exercise.timeLimit} min
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" />
                        Mínimo: {(exercise.passingScore / 10).toFixed(1)}
                      </span>
                    </div>

                    {/* Tentativas */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        Tentativas:
                      </span>
                      <span className="font-medium text-foreground">
                        {exercise.attempts} / {exercise.maxAttempts === 0 ? "∞" : exercise.maxAttempts}
                      </span>
                    </div>
                    {exercise.maxAttempts > 0 && (
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${Math.min((exercise.attempts / exercise.maxAttempts) * 100, 100)}%` }}
                        />
                      </div>
                    )}

                    {exercise.availableFrom && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        Disponível desde {new Date(exercise.availableFrom).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="mt-4 pt-3 border-t space-y-2">
                    <Button
                      onClick={() => handleStartExercise(exercise.id)}
                      disabled={!exercise.canAttempt && exercise.attempts >= exercise.maxAttempts}
                      className="w-full"
                      size="sm"
                    >
                      {exercise.lastAttempt?.status === "in_progress" 
                        ? "Continuar Exercício" 
                        : exercise.lastAttempt?.status === "completed"
                        ? "Tentar Novamente"
                        : "Iniciar Exercício"}
                    </Button>
                    {exercise.attempts > 0 && (
                      <Button
                        onClick={() => setLocation(`/student-exercises/${exercise.id}/review`)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Revisar Questões
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
