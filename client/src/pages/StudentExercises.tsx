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
      const score = exercise.lastAttempt.score;
      if (score >= exercise.passingScore) {
        return (
          <Badge className="gap-1.5 px-3 py-1.5 text-sm font-semibold bg-success hover:bg-success/90">
            <CheckCircle2 className="w-4 h-4" />
            Aprovado ({score}%)
          </Badge>
        );
      } else {
        return (
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            Reprovado ({score}%)
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <FileText className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold">Exercícios Disponíveis</h1>
                <p className="text-orange-100 mt-1">
                  Pratique e aprimore seus conhecimentos
                </p>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={isFetching}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? 'Atualizando...' : 'Atualizar'}
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4 max-w-7xl">
          {/* Barra de Busca e Filtros */}
          <div className="mb-8 space-y-4">
            {/* Busca */}
            <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar exercícios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base border-border focus:border-primary focus:ring-primary"
            />
            </div>

            {/* Filtro por Disciplina */}
          {enrollments && enrollments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-5 h-5 text-gray-600" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Filtrar por Disciplina
                </h2>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Button
                  variant={selectedSubject === undefined ? "default" : "outline"}
                  onClick={() => setSelectedSubject(undefined)}
                  className="h-11 px-5 font-medium"
                >
                  Todas as Disciplinas
                </Button>
                {enrollments.map((enrollment: any) => (
                  <Button
                    key={enrollment.subject.id}
                    variant={selectedSubject === enrollment.subject.id ? "default" : "outline"}
                    onClick={() => setSelectedSubject(enrollment.subject.id)}
                    className="h-11 px-5 font-medium"
                  >
                    {enrollment.subject.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          </div>

          {/* Contador de Resultados */}
          {searchQuery && (
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{filteredExercises.length}</span> exercício(s) encontrado(s)
            </p>
          </div>
          )}

          {/* Lista de Exercícios */}
          {filteredExercises && filteredExercises.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="py-20 text-center">
              <div className="mx-auto w-28 h-28 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center mb-8 shadow-inner">
                <BookOpen className="w-14 h-14 text-gray-400" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-gray-900">
                Nenhum exercício disponível
              </h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto mb-8">
                {searchQuery 
                  ? "Nenhum exercício corresponde à sua busca. Tente outros termos."
                  : "Aguarde seu professor publicar novos exercícios para esta disciplina."}
              </p>
              {enrollments && enrollments.length === 0 && (
                <div className="mt-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl max-w-lg mx-auto">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-yellow-900 mb-2 text-lg">Atenção</p>
                      <p className="text-sm text-yellow-800">
                        Você não está matriculado em nenhuma disciplina. Entre em contato com seu professor para se matricular.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredExercises.map((exercise: any) => (
              <Card 
                key={exercise.id} 
                className="hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 flex flex-col group"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <CardTitle className="text-xl font-bold text-gray-900 leading-tight flex-1">
                      {exercise.title}
                    </CardTitle>
                    {getStatusBadge(exercise)}
                  </div>
                  <CardDescription className="text-base text-gray-600 line-clamp-3 min-h-[4.5rem]">
                    {exercise.description || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    {/* Grid de Informações */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 text-sm bg-primary/10 p-4 rounded-xl border border-primary/20">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{exercise.totalQuestions}</p>
                          <p className="text-xs text-gray-600">questões</p>
                        </div>
                      </div>

                      

                      {exercise.timeLimit && (
                        <div className="flex items-center gap-3 text-sm bg-orange-50 p-4 rounded-xl border border-orange-100 col-span-2">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-lg">{exercise.timeLimit} minutos</p>
                            <p className="text-xs text-gray-600">tempo limite</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-sm bg-success/10 p-4 rounded-xl border border-success/20 col-span-2">
                        <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Target className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{exercise.passingScore}%</p>
                          <p className="text-xs text-gray-600">nota mínima para aprovação</p>
                        </div>
                      </div>
                    </div>

                    {/* Tentativas */}
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-semibold text-gray-900">Tentativas</span>
                        </div>
                        <span className="text-sm font-bold text-purple-700">
                          {exercise.attempts} / {exercise.maxAttempts === 0 ? "∞" : exercise.maxAttempts}
                        </span>
                      </div>
                      {exercise.maxAttempts > 0 && (
                        <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(exercise.attempts / exercise.maxAttempts) * 100}%` }}
                          />
                        </div>
                      )}
                      {exercise.canAttempt && exercise.maxAttempts > 0 && (
                        <p className="text-xs text-purple-700 mt-2 font-medium">
                          {exercise.maxAttempts - exercise.attempts} tentativa(s) restante(s)
                        </p>
                      )}
                    </div>

                    {/* Data de Disponibilidade */}
                    {exercise.availableFrom && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Disponível desde {new Date(exercise.availableFrom).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                    <Button
                      onClick={() => handleStartExercise(exercise.id)}
                      disabled={!exercise.canAttempt && exercise.attempts >= exercise.maxAttempts}
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg group-hover:shadow-xl transition-all"
                    >
                      {exercise.lastAttempt?.status === "in_progress" 
                        ? "Continuar Exercício" 
                        : exercise.lastAttempt?.status === "completed"
                        ? "Tentar Novamente"
                        : "Iniciar Exercício"}
                    </Button>
                    
                    {/* Botão de Revisão - só aparece se houver tentativas */}
                    {exercise.attempts > 0 && (
                      <Button
                        onClick={() => setLocation(`/student-exercises/${exercise.id}/review`)}
                        variant="outline"
                        className="w-full h-11 text-sm font-medium border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all"
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
