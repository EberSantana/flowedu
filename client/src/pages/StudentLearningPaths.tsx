import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Map, ChevronRight, AlertCircle, CheckCircle2, Clock, Circle } from "lucide-react";
import StudentLayout from "@/components/StudentLayout";
import { Link } from "wouter";

export default function StudentLearningPaths() {
  // Buscar disciplinas matriculadas
  const { data: enrolledSubjects, isLoading } = trpc.student.getEnrolledSubjects.useQuery();

  const activeSubjects = enrolledSubjects?.filter(e => e.status === 'active') || [];

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando trilhas de aprendizagem...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Map className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Trilhas de Aprendizagem</h1>
              <p className="text-lg text-gray-600 mt-1">
                Acompanhe seu progresso nos módulos e atividades de cada disciplina
              </p>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-700">
                  Disciplinas Ativas
                </CardTitle>
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{activeSubjects.length}</p>
              <p className="text-sm text-gray-600 mt-1">disciplinas matriculadas</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-700">
                  Trilhas Disponíveis
                </CardTitle>
                <Map className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {activeSubjects.filter((e: any) => e.subject?.hasLearningPath).length}
              </p>
              <p className="text-sm text-gray-600 mt-1">prontas para estudar</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-700">
                  Progresso Médio
                </CardTitle>
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {activeSubjects.length > 0 ? Math.round(
                  activeSubjects.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) / activeSubjects.length
                ) : 0}%
              </p>
              <p className="text-sm text-gray-600 mt-1">de conclusão</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Trilhas */}
        {activeSubjects.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">
                Nenhuma disciplina encontrada
              </h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                Você não está matriculado em nenhuma disciplina ativa. Entre em contato com seu professor.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeSubjects.map((enrollment: any) => (
              <LearningPathCard 
                key={enrollment.id} 
                enrollment={enrollment} 
              />
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

function LearningPathCard({ enrollment }: { enrollment: any }) {
  const subjectId = enrollment.subjectId;
  const professorId = enrollment.userId;

  // Buscar trilha de aprendizagem para esta disciplina
  const { data: learningPath, isLoading } = trpc.student.getSubjectLearningPath.useQuery(
    { subjectId, professorId },
    { enabled: !!subjectId && !!professorId }
  );

  // Calcular progresso
  const totalTopics = learningPath?.reduce((sum, module) => sum + (module.topics?.length || 0), 0) || 0;
  const completedTopics = learningPath?.reduce(
    (sum, module) =>
      sum + (module.topics?.filter((t: any) => t.studentProgress?.status === 'completed').length || 0),
    0
  ) || 0;
  const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Contar módulos
  const totalModules = learningPath?.length || 0;

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 flex flex-col group bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-900 leading-tight mb-1 line-clamp-2">
              {enrollment.subject?.name || 'Disciplina'}
            </CardTitle>
            <p className="text-sm text-gray-500 font-mono">
              {enrollment.subject?.code || ''}
            </p>
          </div>
          {progressPercentage === 100 ? (
            <Badge className="bg-green-600 hover:bg-green-700 gap-1 flex-shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              Completo
            </Badge>
          ) : progressPercentage > 0 ? (
            <Badge className="bg-blue-600 hover:bg-blue-700 gap-1 flex-shrink-0">
              <Clock className="w-3 h-3" />
              Em Progresso
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 flex-shrink-0">
              <Circle className="w-3 h-3" />
              Não Iniciado
            </Badge>
          )}
        </div>
        <CardDescription className="text-base text-gray-600 line-clamp-2">
          {enrollment.subject?.description || "Acompanhe sua trilha de aprendizagem"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : totalModules === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <BookOpen className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">
              Trilha ainda não disponível
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Aguarde o professor criar os módulos
            </p>
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                <Map className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{totalModules}</p>
                  <p className="text-xs text-gray-600">módulos</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                <BookOpen className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{totalTopics}</p>
                  <p className="text-xs text-gray-600">tópicos</p>
                </div>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 font-medium">Progresso:</span>
                <span className="font-semibold text-gray-900">
                  {completedTopics} / {totalTopics} tópicos
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2.5" />
              <p className="text-xs text-gray-500 mt-1.5 text-right font-medium">{progressPercentage}% completo</p>
            </div>
          </div>
        )}

        {/* Botão de Ação */}
        <Link href={`/student/subject/${subjectId}/${professorId}`}>
          <Button
            className="w-full mt-6 h-11 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 group-hover:shadow-lg transition-all"
            disabled={totalModules === 0}
          >
            {totalModules === 0 ? 'Aguardando Trilha' : 'Acessar Trilha'}
            {totalModules > 0 && <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
