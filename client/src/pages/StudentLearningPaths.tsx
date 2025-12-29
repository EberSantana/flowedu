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
            <div className="p-3 bg-blue-100 rounded-xl">
              <Map className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Trilhas de Aprendizagem</h1>
              <p className="text-lg text-gray-600">
                Acompanhe seu progresso nos módulos e atividades de cada disciplina
              </p>
            </div>
          </div>
        </div>

        {activeSubjects.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-12 h-12 text-gray-400" />
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
    <Card className="hover:shadow-xl transition-all duration-200 border-l-4 border-l-blue-500 flex flex-col group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-900 leading-tight mb-1">
              {enrollment.subject?.name || 'Disciplina'}
            </CardTitle>
            <p className="text-sm text-gray-500 font-mono">
              {enrollment.subject?.code || ''}
            </p>
          </div>
          {progressPercentage === 100 ? (
            <Badge className="bg-green-600 hover:bg-green-700 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Completo
            </Badge>
          ) : progressPercentage > 0 ? (
            <Badge className="bg-blue-600 hover:bg-blue-700 gap-1">
              <Clock className="w-3 h-3" />
              Em Progresso
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
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
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            <BookOpen className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
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
              <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                <Map className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{totalModules}</p>
                  <p className="text-xs text-gray-600">módulos</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                <BookOpen className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{totalTopics}</p>
                  <p className="text-xs text-gray-600">tópicos</p>
                </div>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Progresso:</span>
                <span className="font-semibold text-gray-900">
                  {completedTopics} / {totalTopics} tópicos
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-gray-500 mt-1 text-right">{progressPercentage}% completo</p>
            </div>
          </div>
        )}

        {/* Botão de Ação */}
        <Link href={`/student/subject/${subjectId}/${professorId}`}>
          <Button
            className="w-full mt-6 h-11 text-base font-semibold group-hover:bg-blue-700"
            disabled={totalModules === 0}
          >
            {totalModules === 0 ? 'Aguardando Trilha' : 'Acessar Trilha'}
            {totalModules > 0 && <ChevronRight className="w-5 h-5 ml-2" />}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
