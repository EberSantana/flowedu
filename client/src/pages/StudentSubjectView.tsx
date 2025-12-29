import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StudentLayout from "@/components/StudentLayout";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Link as LinkIcon,
  Video,
  Download,
  MessageSquare,
  ThumbsUp,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

// Componente para exibir exercícios de um módulo
function ModuleExercises({ moduleId }: { moduleId: number }) {
  const { data: exercises, isLoading } = trpc.studentExercises.listByModule.useQuery(
    { moduleId },
    { enabled: !!moduleId }
  );

  if (isLoading) {
    return (
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-600">Carregando exercícios...</p>
      </div>
    );
  }

  if (!exercises || exercises.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-600" />
        Exercícios deste Módulo ({exercises.length})
      </h4>
      <div className="space-y-2">
        {exercises.map((exercise: any) => {
          const hasAttempts = exercise.attempts > 0;
          const lastScore = exercise.lastAttempt?.score || 0;
          const passed = lastScore >= exercise.passingScore;
          
          return (
            <Link key={exercise.id} href={`/student/exercise/${exercise.id}`}>
              <div className="p-3 bg-white rounded-lg border hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{exercise.title}</h5>
                    {exercise.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{exercise.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{exercise.totalQuestions} questões</span>
                      <span>•</span>
                      <span>{exercise.totalPoints} pontos</span>
                      {exercise.timeLimit && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {exercise.timeLimit} min
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    {hasAttempts ? (
                      <div>
                        <Badge variant={passed ? "default" : "secondary"} className="mb-1">
                          {passed ? "✓ Aprovado" : "× Reprovado"}
                        </Badge>
                        <p className="text-xs text-gray-600">
                          Última nota: {lastScore}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {exercise.attempts}/{exercise.maxAttempts === 0 ? '∞' : exercise.maxAttempts} tentativas
                        </p>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                        Novo
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function StudentSubjectView() {
  const [, params] = useRoute("/student/subject/:subjectId/:professorId");
  const subjectId = params?.subjectId ? parseInt(params.subjectId) : 0;
  const professorId = params?.professorId ? parseInt(params.professorId) : 0;

  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [isMaterialsDialogOpen, setIsMaterialsDialogOpen] = useState(false);
  const [studentNotes, setStudentNotes] = useState("");

  const { data: learningPath, isLoading } = trpc.student.getSubjectLearningPath.useQuery(
    { subjectId, professorId },
    { enabled: !!subjectId && !!professorId }
  );

  const { data: materials } = trpc.student.getTopicMaterials.useQuery(
    { topicId: selectedTopic?.id || 0 },
    { enabled: !!selectedTopic?.id }
  );

  const utils = trpc.useUtils();

  const updateProgressMutation = trpc.student.updateTopicProgress.useMutation({
    onSuccess: () => {
      utils.student.getSubjectLearningPath.invalidate();
      toast.success("Progresso atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar progresso: " + error.message);
    },
  });

  const toggleModule = (moduleId: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleMarkComplete = (topicId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
    updateProgressMutation.mutate({
      topicId,
      status: newStatus as any,
    });
  };

  const handleSelfAssessment = (topicId: number, assessment: 'understood' | 'have_doubts' | 'need_help') => {
    updateProgressMutation.mutate({
      topicId,
      selfAssessment: assessment,
    });
  };

  const handleSaveNotes = (topicId: number) => {
    updateProgressMutation.mutate({
      topicId,
      notes: studentNotes,
    });
  };

  const openMaterialsDialog = (topic: any) => {
    setSelectedTopic(topic);
    setStudentNotes(topic.studentProgress?.notes || "");
    setIsMaterialsDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getMaterialIcon = (type: string, large: boolean = false) => {
    const sizeClass = large ? "h-6 w-6" : "h-4 w-4";
    const colorClass = large ? "text-primary" : "";
    const className = `${sizeClass} ${colorClass}`;
    
    switch (type) {
      case 'video':
        return <Video className={className} />;
      case 'pdf':
        return <FileText className={className} />;
      case 'document':
        return <FileText className={className} />;
      case 'presentation':
        return <FileText className={className} />;
      case 'link':
        return <LinkIcon className={className} />;
      default:
        return <Download className={className} />;
    }
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando trilha de aprendizagem...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!learningPath || learningPath.length === 0) {
    return (
      <StudentLayout>
        <Card className="bg-white">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Trilha de aprendizagem não disponível
            </h3>
            <p className="text-gray-600 text-center max-w-md mb-4">
              O professor ainda não criou a trilha de aprendizagem para esta disciplina.
            </p>
            <Link href="/student-dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700">Voltar ao Portal do Aluno</Button>
            </Link>
          </CardContent>
        </Card>
      </StudentLayout>
    );
  }

  const totalTopics = learningPath.reduce((sum, module) => sum + (module.topics?.length || 0), 0);
  const completedTopics = learningPath.reduce(
    (sum, module) =>
      sum + (module.topics?.filter((t: any) => t.studentProgress?.status === 'completed').length || 0),
    0
  );
  const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <StudentLayout>
      <div className="w-full">
          {/* Header */}
          <div className="mb-8">
            <Link href="/student-dashboard">
              <Button variant="ghost" size="sm" className="mb-4">
                ← Voltar ao Portal
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Trilha de Aprendizagem
            </h1>
            <p className="text-gray-600">
              Acompanhe seu progresso e acesse os materiais de estudo
            </p>
          </div>

          {/* Progress Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Seu Progresso</CardTitle>
              <CardDescription>
                {completedTopics} de {totalTopics} tópicos concluídos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-sm text-gray-600 mt-2">{progressPercentage}% completo</p>
            </CardContent>
          </Card>

          {/* Learning Path Modules */}
          <div className="space-y-4">
            {learningPath.map((module, moduleIndex) => {
              const isExpanded = expandedModules.has(module.id);
              const moduleTopics = module.topics || [];
              const moduleCompleted = moduleTopics.filter((t: any) => t.studentProgress?.status === 'completed').length;
              const moduleProgress = moduleTopics.length > 0 ? Math.round((moduleCompleted / moduleTopics.length) * 100) : 0;

              return (
                <Card key={module.id}>
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleModule(module.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                          <div>
                            <CardTitle className="text-lg">
                              Módulo {moduleIndex + 1}: {module.title}
                            </CardTitle>
                            {module.description && (
                              <CardDescription className="mt-1">
                                {module.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <Badge variant={moduleProgress === 100 ? "default" : "secondary"}>
                          {moduleProgress}%
                        </Badge>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-4">
                        <Progress value={moduleProgress} className="h-2" />
                      </div>
                    )}
                  </CardHeader>

                  {isExpanded && (
                    <CardContent>
                      {/* Exercícios do Módulo */}
                      <ModuleExercises moduleId={module.id} />
                      
                      {/* Tópicos do Módulo */}
                      <div className="space-y-3 mt-6">
                        {moduleTopics.map((topic: any, topicIndex: number) => {
                          const topicStatus = topic.studentProgress?.status || 'not_started';
                          const selfAssessment = topic.studentProgress?.selfAssessment;

                          return (
                            <div
                              key={topic.id}
                              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  {getStatusIcon(topicStatus)}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">
                                    {moduleIndex + 1}.{topicIndex + 1} {topic.title}
                                  </h4>
                                  {topic.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {topic.description}
                                    </p>
                                  )}
                                  {topic.estimatedHours > 0 && (
                                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {topic.estimatedHours}h estimadas
                                    </p>
                                  )}

                                  {/* Self Assessment */}
                                  {topicStatus !== 'not_started' && (
                                    <div className="mt-3 flex items-center gap-2">
                                      <span className="text-xs text-gray-600">Como você está?</span>
                                      <Button
                                        size="sm"
                                        variant={selfAssessment === 'understood' ? 'default' : 'outline'}
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleSelfAssessment(topic.id, 'understood')}
                                      >
                                        <ThumbsUp className="h-3 w-3 mr-1" />
                                        Entendi
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={selfAssessment === 'have_doubts' ? 'default' : 'outline'}
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleSelfAssessment(topic.id, 'have_doubts')}
                                      >
                                        <HelpCircle className="h-3 w-3 mr-1" />
                                        Tenho dúvidas
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={selfAssessment === 'need_help' ? 'default' : 'outline'}
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleSelfAssessment(topic.id, 'need_help')}
                                      >
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Preciso de ajuda
                                      </Button>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="mt-3 flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant={topicStatus === 'completed' ? 'secondary' : 'default'}
                                      onClick={() => handleMarkComplete(topic.id, topicStatus)}
                                    >
                                      {topicStatus === 'completed' ? (
                                        <>
                                          <CheckCircle2 className="h-4 w-4 mr-1" />
                                          Concluído
                                        </>
                                      ) : (
                                        <>
                                          <Circle className="h-4 w-4 mr-1" />
                                          Marcar como concluído
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openMaterialsDialog(topic)}
                                    >
                                      <FileText className="h-4 w-4 mr-1" />
                                      Materiais e Anotações
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Materials and Notes Dialog */}
          <Dialog open={isMaterialsDialogOpen} onOpenChange={setIsMaterialsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedTopic?.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Materials Section */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Materiais de Estudo
                  </h3>
                  {!materials || materials.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      Nenhum material disponível para este tópico.
                    </p>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {materials.map((material) => (
                        <a
                          key={material.id}
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative flex flex-col gap-3 p-4 border-2 rounded-xl hover:border-primary hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-gray-50"
                        >
                          {material.isRequired && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-red-500 text-white text-xs font-semibold">
                                ⭐ Obrigatório
                              </Badge>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              {getMaterialIcon(material.type, true)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                                {material.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {material.type === 'pdf' ? 'PDF' :
                                   material.type === 'video' ? 'Vídeo' :
                                   material.type === 'link' ? 'Link' :
                                   material.type === 'document' ? 'Documento' :
                                   material.type === 'presentation' ? 'Apresentação' :
                                   'Outro'}
                                </Badge>
                                {material.fileSize && (
                                  <span className="text-xs text-gray-500">
                                    {(material.fileSize / 1024 / 1024).toFixed(1)} MB
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {material.description && (
                            <p className="text-xs text-gray-600 line-clamp-2 pl-1">
                              {material.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              Abrir material
                            </span>
                            <span className="text-primary text-xs font-medium group-hover:underline">
                              Acessar →
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Student Notes Section */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Minhas Anotações
                  </h3>
                  <Textarea
                    placeholder="Escreva suas anotações sobre este tópico..."
                    value={studentNotes}
                    onChange={(e) => setStudentNotes(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  <Button
                    className="mt-2"
                    size="sm"
                    onClick={() => handleSaveNotes(selectedTopic.id)}
                  >
                    Salvar Anotações
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
    </StudentLayout>
  );
}
