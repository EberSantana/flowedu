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
      <div className="container mx-auto py-6 px-4 max-w-5xl">
          {/* Header */}
          <div className="mb-6">
            <Link href="/student-dashboard">
              <Button variant="ghost" size="sm" className="mb-3 hover:bg-gray-100">
                ← Voltar ao Portal
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Trilha de Aprendizagem
            </h1>
            <p className="text-lg text-gray-600">
              Acompanhe seu progresso e acesse os materiais de estudo
            </p>
          </div>

          {/* Progress Summary */}
          <Card className="mb-6 border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Seu Progresso</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {completedTopics} de {totalTopics} tópicos concluídos
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{progressPercentage}%</div>
                  <div className="text-xs text-gray-500">completo</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Progress value={progressPercentage} className="h-3" />
            </CardContent>
          </Card>

          {/* Learning Path Modules */}
          <div className="space-y-5">
            {learningPath.map((module, moduleIndex) => {
              const isExpanded = expandedModules.has(module.id);
              const moduleTopics = module.topics || [];
              const moduleCompleted = moduleTopics.filter((t: any) => t.studentProgress?.status === 'completed').length;
              const moduleProgress = moduleTopics.length > 0 ? Math.round((moduleCompleted / moduleTopics.length) * 100) : 0;

              return (
                <Card key={module.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-50 transition-all pb-4"
                    onClick={() => toggleModule(module.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="h-6 w-6 text-blue-600" />
                            ) : (
                              <ChevronRight className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl font-semibold text-gray-900">
                              Módulo {moduleIndex + 1}: {module.title}
                            </CardTitle>
                            {module.description && (
                              <CardDescription className="mt-2 text-base text-gray-600">
                                {module.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <Badge 
                          variant={moduleProgress === 100 ? "default" : "secondary"}
                          className="text-sm px-3 py-1"
                        >
                          {moduleProgress}%
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {moduleCompleted}/{moduleTopics.length} tópicos
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-4">
                        <Progress value={moduleProgress} className="h-2.5" />
                      </div>
                    )}
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-4">
                      {/* Tópicos do Módulo */}
                      <div className="space-y-4">
                        {moduleTopics.map((topic: any, topicIndex: number) => {
                          const topicStatus = topic.studentProgress?.status || 'not_started';
                          const selfAssessment = topic.studentProgress?.selfAssessment;

                          return (
                            <div
                              key={topic.id}
                              className="border-2 rounded-xl p-5 hover:bg-blue-50/30 hover:border-blue-300 transition-all bg-white"
                            >
                              <div className="flex items-start gap-4">
                                <div className="mt-0.5 flex-shrink-0">
                                  {getStatusIcon(topicStatus)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 text-base">
                                    {moduleIndex + 1}.{topicIndex + 1} {topic.title}
                                  </h4>
                                  {topic.description && (
                                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                      {topic.description}
                                    </p>
                                  )}
                                  {topic.estimatedHours > 0 && (
                                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                                      <Clock className="h-4 w-4" />
                                      {topic.estimatedHours}h estimadas
                                    </p>
                                  )}

                                  {/* Self Assessment */}
                                  {topicStatus !== 'not_started' && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                      <span className="text-sm font-medium text-gray-700 block mb-2">Como você está?</span>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant={selfAssessment === 'understood' ? 'default' : 'outline'}
                                          className="h-8 px-3 text-sm"
                                          onClick={() => handleSelfAssessment(topic.id, 'understood')}
                                        >
                                          <ThumbsUp className="h-4 w-4 mr-1.5" />
                                          Entendi
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant={selfAssessment === 'have_doubts' ? 'default' : 'outline'}
                                          className="h-8 px-3 text-sm"
                                          onClick={() => handleSelfAssessment(topic.id, 'have_doubts')}
                                        >
                                          <HelpCircle className="h-4 w-4 mr-1.5" />
                                          Tenho dúvidas
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant={selfAssessment === 'need_help' ? 'default' : 'outline'}
                                          className="h-8 px-3 text-sm"
                                          onClick={() => handleSelfAssessment(topic.id, 'need_help')}
                                        >
                                          <AlertCircle className="h-4 w-4 mr-1.5" />
                                          Preciso de ajuda
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <Button
                                      size="default"
                                      variant={topicStatus === 'completed' ? 'secondary' : 'default'}
                                      className="h-10"
                                      onClick={() => handleMarkComplete(topic.id, topicStatus)}
                                    >
                                      {topicStatus === 'completed' ? (
                                        <>
                                          <CheckCircle2 className="h-5 w-5 mr-2" />
                                          Concluído
                                        </>
                                      ) : (
                                        <>
                                          <Circle className="h-5 w-5 mr-2" />
                                          Marcar como concluído
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      size="default"
                                      variant="outline"
                                      className="h-10"
                                      onClick={() => openMaterialsDialog(topic)}
                                    >
                                      <FileText className="h-5 w-5 mr-2" />
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
