import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import StudentLayout from "@/components/StudentLayout";
import {
  BookOpen,
  Trophy,
  Target,
  Brain,
  ArrowLeft,
  ExternalLink,
  Calendar,
  Award,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  Circle,
  Star,
} from "lucide-react";

export default function StudentSubjectDetails() {
  const [, params] = useRoute("/student/subject-details/:subjectId/:professorId");
  const subjectId = params?.subjectId ? parseInt(params.subjectId) : 0;
  const professorId = params?.professorId ? parseInt(params.professorId) : 0;
  const [activeTab, setActiveTab] = useState("overview");

  // Query para buscar informações da disciplina
  const { data: subject, isLoading: subjectLoading } = trpc.subjects.getById.useQuery(
    { id: subjectId },
    { enabled: !!subjectId }
  );

  // Query para buscar trilha de aprendizagem
  const { data: learningPath, isLoading: pathLoading } = trpc.student.getSubjectLearningPath.useQuery(
    { subjectId, professorId },
    { enabled: !!subjectId && !!professorId }
  );

  // Query para buscar exercícios da disciplina
  const { data: exercises, isLoading: exercisesLoading } = trpc.studentExercises.listBySubject.useQuery(
    { subjectId },
    { enabled: !!subjectId }
  );

  const isLoading = subjectLoading || pathLoading;

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!subject) {
    return (
      <StudentLayout>
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">Disciplina não encontrada</p>
              <Link href="/student-dashboard">
                <Button className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  // Calcular estatísticas
  const totalTopics = learningPath?.reduce((sum, module) => sum + (module.topics?.length || 0), 0) || 0;
  const completedTopics = learningPath?.reduce(
    (sum, module) =>
      sum + (module.topics?.filter((t: any) => t.studentProgress?.status === 'completed').length || 0),
    0
  ) || 0;
  const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <StudentLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/student-dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        {/* Header da Disciplina */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: subject.color || "#3B82F6" }}
                  />
                  <CardTitle className="text-3xl">{subject.name}</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Código: {subject.code}
                </CardDescription>
                {subject.description && (
                  <p className="text-gray-600 mt-2">{subject.description}</p>
                )}
              </div>
              
              {/* Links Rápidos */}
              <div className="flex gap-2">
                {subject.googleClassroomUrl && (
                  <a
                    href={subject.googleClassroomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Classroom
                    </Button>
                  </a>
                )}
                {subject.googleDriveUrl && (
                  <a
                    href={subject.googleDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Drive
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Sistema de Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Módulos</span>
            </TabsTrigger>
            <TabsTrigger value="exercises" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Exercícios</span>
            </TabsTrigger>
            {subject.computationalThinkingEnabled && (
              <TabsTrigger value="ct" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">PC</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab: Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewTab 
              subjectId={subjectId} 
              subject={subject} 
              progressPercentage={progressPercentage}
              completedTopics={completedTopics}
              totalTopics={totalTopics}
            />
          </TabsContent>

          {/* Tab: Módulos */}
          <TabsContent value="modules">
            <ModulesTab subjectId={subjectId} professorId={professorId} />
          </TabsContent>

          {/* Tab: Exercícios */}
          <TabsContent value="exercises">
            <ExercisesTab 
              subjectId={subjectId} 
              exercises={exercises || []}
              isLoading={exercisesLoading}
            />
          </TabsContent>

          {/* Tab: Pensamento Computacional */}
          {subject.computationalThinkingEnabled && (
            <TabsContent value="ct">
              <ComputationalThinkingTab subjectId={subjectId} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </StudentLayout>
  );
}

// Componente da Tab Visão Geral
function OverviewTab({ 
  subjectId, 
  subject, 
  progressPercentage,
  completedTopics,
  totalTopics 
}: { 
  subjectId: number; 
  subject: any;
  progressPercentage: number;
  completedTopics: number;
  totalTopics: number;
}) {
  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card de Progresso */}
        <Card className="border-l-4 border-l-blue-500 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Progresso Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Módulos concluídos</span>
                <span className="font-semibold">{completedTopics} / {totalTopics}</span>
              </div>
              <Progress value={progressPercentage} className="h-2.5" />
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">{progressPercentage}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Gamificação */}
        <Card className="border-l-4 border-l-green-500 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-green-500" />
              Gamificação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pontos</span>
                <span className="font-semibold text-green-600">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Faixa Atual</span>
                <Badge className="bg-gray-200 text-gray-800">Branca</Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>Continue estudando para subir de faixa!</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Atividades */}
        <Card className="border-l-4 border-l-purple-500 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-purple-500" />
              Próximas Atividades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Nenhuma atividade pendente no momento</p>
          </CardContent>
        </Card>
      </div>

      {/* Informações Adicionais */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Plano de Curso */}
        {subject.syllabus && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Plano de Curso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {subject.generalObjective && (
                  <div>
                    <span className="font-semibold text-gray-700">Objetivo Geral:</span>
                    <p className="text-gray-600 mt-1">{subject.generalObjective}</p>
                  </div>
                )}
                {subject.specificObjective && (
                  <div className="mt-3">
                    <span className="font-semibold text-gray-700">Objetivo Específico:</span>
                    <p className="text-gray-600 mt-1">{subject.specificObjective}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recursos Externos */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-green-600" />
              Recursos Externos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subject.googleClassroomUrl && (
                <a
                  href={subject.googleClassroomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Google Classroom
                </a>
              )}
              {subject.googleDriveUrl && (
                <a
                  href={subject.googleDriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Google Drive
                </a>
              )}
              {!subject.googleClassroomUrl && !subject.googleDriveUrl && (
                <p className="text-sm text-gray-500">Nenhum recurso externo disponível</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente da Tab Módulos
function ModulesTab({ subjectId, professorId }: { subjectId: number; professorId: number }) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Trilha de Aprendizagem</CardTitle>
        <CardDescription>
          Acesse a trilha completa de módulos e tópicos desta disciplina
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href={`/student/subject/${subjectId}/${professorId}`}>
          <Button className="w-full sm:w-auto">
            <BookOpen className="h-5 w-5 mr-2" />
            Acessar Trilha Completa
          </Button>
        </Link>
        <p className="text-sm text-gray-500 mt-4">
          A trilha de aprendizagem contém todos os módulos, tópicos, materiais didáticos e acompanhamento de progresso.
        </p>
      </CardContent>
    </Card>
  );
}

// Componente da Tab Exercícios
function ExercisesTab({ 
  subjectId, 
  exercises,
  isLoading 
}: { 
  subjectId: number;
  exercises: any[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando exercícios...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!exercises || exercises.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Exercícios Disponíveis</CardTitle>
          <CardDescription>
            Pratique e teste seus conhecimentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum exercício disponível no momento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Exercícios Disponíveis</CardTitle>
          <CardDescription>
            {exercises.length} {exercises.length === 1 ? 'exercício disponível' : 'exercícios disponíveis'}
          </CardDescription>
        </CardHeader>
      </Card>

      {exercises.map((exercise) => (
        <Card key={exercise.id} className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl">{exercise.title}</CardTitle>
                {exercise.description && (
                  <CardDescription className="mt-2">{exercise.description}</CardDescription>
                )}
              </div>
              <Badge variant={exercise.status === 'published' ? 'default' : 'secondary'}>
                {exercise.status === 'published' ? 'Disponível' : 'Rascunho'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{exercise.questionCount || 0} questões</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                <span>{exercise.totalPoints || 0} pontos</span>
              </div>
              {exercise.dueDate && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Prazo: {new Date(exercise.dueDate).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
            <Link href={`/student-exercises/${exercise.id}`}>
              <Button>
                Resolver Exercício
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Componente da Tab Pensamento Computacional
function ComputationalThinkingTab({ subjectId }: { subjectId: number }) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          Pensamento Computacional
        </CardTitle>
        <CardDescription>
          Desenvolva suas habilidades de raciocínio lógico e resolução de problemas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Brain className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            O perfil de Pensamento Computacional para esta disciplina estará disponível em breve.
          </p>
          <p className="text-sm text-gray-400">
            Aqui você poderá visualizar suas habilidades em Decomposição, Reconhecimento de Padrões, Abstração e Algoritmos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
