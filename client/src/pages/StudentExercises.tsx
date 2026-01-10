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
  TrendingUp,
  Zap
} from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import StudentLayout from "@/components/StudentLayout";

export default function StudentExercises() {
  const [, setLocation] = useLocation();
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

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
        <Badge variant="destructive" className="gap-1.5 px-3 py-1 text-xs font-semibold">
          <XCircle className="w-3.5 h-3.5" />
          Esgotado
        </Badge>
      );
    }

    if (exercise.lastAttempt?.status === "completed") {
      const score = exercise.lastAttempt.score;
      if (score >= exercise.passingScore) {
        return (
          <Badge className="gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprovado {score}%
          </Badge>
        );
      } else {
        return (
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Reprovado {score}%
          </Badge>
        );
      }
    }

    if (exercise.lastAttempt?.status === "in_progress") {
      return (
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs font-semibold border-blue-400 text-blue-700 bg-blue-50">
          <Clock className="w-3.5 h-3.5" />
          Em Andamento
        </Badge>
      );
    }

    return (
      <Badge className="gap-1.5 px-3 py-1 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white">
        <Zap className="w-3.5 h-3.5" />
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
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        {/* Header Moderno */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white py-16 px-4 relative overflow-hidden">
          {/* Elementos decorativos de fundo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30 shadow-xl">
                <FileText className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-5xl font-extrabold tracking-tight">Exercícios Disponíveis</h1>
                <p className="text-blue-100 mt-2 text-lg font-medium">
                  Pratique, aprenda e aprimore seus conhecimentos
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-10 px-4 max-w-7xl">
          {/* Barra de Busca e Filtros - Design Aprimorado */}
          <div className="mb-10 space-y-6">
            {/* Busca com design moderno */}
            <div className="relative max-w-xl">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar exercícios por título ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 h-14 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-sm bg-white"
              />
            </div>

            {/* Filtro por Disciplina com design cards */}
            {enrollments && enrollments.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Filtrar por Disciplina
                  </h2>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    variant={selectedSubject === undefined ? "default" : "outline"}
                    onClick={() => setSelectedSubject(undefined)}
                    className="h-11 px-6 font-semibold rounded-xl transition-all hover:scale-105"
                  >
                    Todas as Disciplinas
                  </Button>
                  {enrollments.map((enrollment: any) => (
                    <Button
                      key={enrollment.subject.id}
                      variant={selectedSubject === enrollment.subject.id ? "default" : "outline"}
                      onClick={() => setSelectedSubject(enrollment.subject.id)}
                      className="h-11 px-6 font-semibold rounded-xl transition-all hover:scale-105"
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
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
              <p className="text-sm text-blue-800">
                <span className="font-bold text-blue-900 text-lg">{filteredExercises.length}</span> exercício(s) encontrado(s) para "{searchQuery}"
              </p>
            </div>
          )}

          {/* Lista de Exercícios */}
          {filteredExercises && filteredExercises.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300 bg-white shadow-lg">
              <CardContent className="py-24 text-center">
                <div className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-8 shadow-inner">
                  <BookOpen className="w-16 h-16 text-blue-500" />
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
                  <div className="mt-8 p-6 bg-amber-50 border-2 border-amber-300 rounded-2xl max-w-lg mx-auto shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <AlertCircle className="w-7 h-7 text-amber-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-amber-900 mb-2 text-lg">Atenção</p>
                        <p className="text-sm text-amber-800">
                          Você não está matriculado em nenhuma disciplina. Entre em contato com seu professor para se matricular.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredExercises.map((exercise: any) => (
                <Card 
                  key={exercise.id} 
                  className="hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-blue-400 flex flex-col group bg-white rounded-2xl overflow-hidden hover:-translate-y-1"
                >
                  <CardHeader className="pb-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <CardTitle className="text-lg font-bold text-gray-900 leading-tight flex-1 line-clamp-2">
                        {exercise.title}
                      </CardTitle>
                      {getStatusBadge(exercise)}
                    </div>
                    <CardDescription className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                      {exercise.description || "Sem descrição"}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col pt-5">
                    <div className="space-y-3 flex-1">
                      {/* Grid de Informações - Design Compacto */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Questões */}
                        <div className="flex items-center gap-2 text-sm bg-blue-50 p-3 rounded-xl border border-blue-100">
                          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <BookOpen className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-base">{exercise.totalQuestions}</p>
                            <p className="text-xs text-gray-600">questões</p>
                          </div>
                        </div>

                        {/* Nota Mínima */}
                        <div className="flex items-center gap-2 text-sm bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Target className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-base">{exercise.passingScore}%</p>
                            <p className="text-xs text-gray-600">nota mín.</p>
                          </div>
                        </div>
                      </div>

                      {/* Tempo Limite */}
                      {exercise.timeLimit && (
                        <div className="flex items-center gap-3 text-sm bg-orange-50 p-3 rounded-xl border border-orange-100">
                          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Clock className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-base">{exercise.timeLimit} minutos</p>
                            <p className="text-xs text-gray-600">tempo limite</p>
                          </div>
                        </div>
                      )}

                      {/* Tentativas */}
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                            <Award className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700">Tentativas</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded-lg shadow-sm">
                          {exercise.attempts} / {exercise.maxAttempts === 0 ? "∞" : exercise.maxAttempts}
                        </span>
                      </div>

                      {/* Data de Disponibilidade */}
                      {exercise.availableFrom && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            Disponível desde {new Date(exercise.availableFrom).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botão de Ação - Design Aprimorado */}
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <Button
                        onClick={() => handleStartExercise(exercise.id)}
                        disabled={!exercise.canAttempt && exercise.attempts >= exercise.maxAttempts}
                        className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all rounded-xl group-hover:scale-[1.02]"
                      >
                        <span className="flex items-center justify-center gap-2">
                          {exercise.lastAttempt?.status === "in_progress" 
                            ? (
                              <>
                                <TrendingUp className="w-5 h-5" />
                                Continuar Exercício
                              </>
                            )
                            : exercise.lastAttempt?.status === "completed"
                            ? (
                              <>
                                <Trophy className="w-5 h-5" />
                                Tentar Novamente
                              </>
                            )
                            : (
                              <>
                                <Zap className="w-5 h-5" />
                                Iniciar Exercício
                              </>
                            )}
                        </span>
                      </Button>
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
