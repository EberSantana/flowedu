import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { 
  BookOpen, ChevronRight, CheckCircle2, Clock, Circle, 
  Lock, Unlock, FileText, Video, FileQuestion, Zap, Brain,
  MessageCircle, BookMarked, ArrowLeft, Play, CheckCircle,
  AlertCircle, HelpCircle, Smile, Meh, Frown, Sparkles
} from "lucide-react";
import StudentLayout from "@/components/StudentLayout";
import { ModuleGuideViewer } from "@/components/ModuleGuideViewer";
import { useRoute, Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function StudentLearningPathDetail() {
  const [, params] = useRoute("/student/learning-path/:subjectId/:professorId");
  const subjectId = params?.subjectId ? parseInt(params.subjectId) : 0;
  const professorId = params?.professorId ? parseInt(params.professorId) : 0;

  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [journalContent, setJournalContent] = useState("");
  const [doubtQuestion, setDoubtQuestion] = useState("");
  const [selectedModuleForGuide, setSelectedModuleForGuide] = useState<any>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Buscar trilha completa
  const { data: learningPath, isLoading, refetch } = trpc.student.getEnhancedLearningPath.useQuery(
    { subjectId, professorId },
    { enabled: subjectId > 0 && professorId > 0 }
  );

  // Mutations
  const updateProgress = trpc.student.updateTopicProgressEnhanced.useMutation({
    onSuccess: () => {
      toast.success("Progresso atualizado!");
      refetch();
    }
  });

  const addJournal = trpc.student.addJournalEntry.useMutation({
    onSuccess: () => {
      toast.success("Entrada adicionada ao diário!");
      setJournalContent("");
      setSelectedTopic(null);
    }
  });

  const submitDoubt = trpc.student.submitDoubt.useMutation({
    onSuccess: () => {
      toast.success("Dúvida enviada ao professor!");
      setDoubtQuestion("");
      setSelectedTopic(null);
    }
  });

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center py-12">
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
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Trilha não encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Esta disciplina ainda não possui uma trilha de aprendizagem configurada.
              </p>
              <Link href="/student/learning-paths">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'hard': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
      default: return 'Médio';
    }
  };

  const getStatusIcon = (status?: string, isUnlocked?: boolean) => {
    if (!isUnlocked) return <Lock className="w-5 h-5 text-gray-400" />;
    
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Play className="w-5 h-5 text-primary" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status?: string, isUnlocked?: boolean) => {
    if (!isUnlocked) return 'bg-gray-100 border-gray-300';
    
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-300 hover:bg-green-100';
      case 'in_progress':
        return 'bg-blue-50 border-blue-300 hover:bg-blue-100';
      default:
        return 'bg-white border-gray-300 hover:bg-gray-50';
    }
  };

  const handleMarkAsComplete = (topicId: number) => {
    updateProgress.mutate({
      topicId,
      status: 'completed'
    });
  };

  const handleMarkAsInProgress = (topicId: number) => {
    updateProgress.mutate({
      topicId,
      status: 'in_progress'
    });
  };

  const handleAddJournalEntry = () => {
    if (!selectedTopic || !journalContent.trim()) {
      toast.error("Escreva algo no diário antes de salvar!");
      return;
    }

    addJournal.mutate({
      topicId: selectedTopic.id,
      content: journalContent,
      mood: 'neutral'
    });
  };

  const handleSubmitDoubt = () => {
    if (!selectedTopic || !doubtQuestion.trim()) {
      toast.error("Escreva sua dúvida antes de enviar!");
      return;
    }

    submitDoubt.mutate({
      topicId: selectedTopic.id,
      professorId,
      question: doubtQuestion,
      isPrivate: true
    });
  };

  // Calcular estatísticas gerais
  const totalTopics = learningPath.reduce((sum, module) => sum + (module.topics?.length || 0), 0);
  const completedTopics = learningPath.reduce((sum, module) => 
    sum + (module.topics?.filter((t: any) => t.progress?.status === 'completed').length || 0), 0
  );
  const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <StudentLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trilha de Aprendizagem</h1>
              <p className="text-gray-600 mt-1">
                {completedTopics} de {totalTopics} tópicos concluídos
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{progressPercentage}%</div>
              <div className="text-sm text-gray-600">Progresso Geral</div>
            </div>
          </div>
          
          <Progress value={progressPercentage} className="h-3 mt-4" />
        </div>

        {/* Mapa Visual da Trilha */}
        <div className="space-y-8">
          {learningPath.map((module, moduleIndex) => {
            const moduleCompletedTopics = module.topics?.filter((t: any) => t.progress?.status === 'completed').length || 0;
            const moduleProgress = module.topics?.length ? Math.round((moduleCompletedTopics / module.topics.length) * 100) : 0;

            return (
              <Card key={module.id} className="bg-white shadow-lg border-l-4 border-l-primary">
                <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {moduleIndex + 1}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{module.title}</CardTitle>
                        {module.description && (
                          <CardDescription className="mt-1">{module.description}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {module.guideTitle && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedModuleForGuide(module);
                            setShowGuideModal(true);
                          }}
                          className="gap-2"
                        >
                          <BookOpen className="w-4 h-4" />
                          Ver Guia
                        </Button>
                      )}
                      <Badge className="bg-primary/20 text-primary">
                        {moduleCompletedTopics}/{module.topics?.length || 0} tópicos
                      </Badge>
                    </div>
                  </div>
                  <Progress value={moduleProgress} className="h-2 mt-3" />
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {module.topics?.map((topic: any, topicIndex: number) => {
                      const isUnlocked = topic.isUnlocked !== false;
                      const status = topic.progress?.status || 'not_started';

                      return (
                        <Card 
                          key={topic.id}
                          className={`transition-all duration-200 border-2 ${getStatusColor(status, isUnlocked)} ${
                            !isUnlocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                          onClick={() => isUnlocked && setSelectedTopic(topic)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(status, isUnlocked)}
                                <CardTitle className="text-sm font-semibold">
                                  {topic.title}
                                </CardTitle>
                              </div>
                              <Badge className={`text-xs ${getDifficultyColor(topic.difficulty)}`}>
                                {getDifficultyLabel(topic.difficulty)}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-2">
                            {topic.description && (
                              <p className="text-xs text-gray-600 line-clamp-2">{topic.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {topic.estimatedHours || 0}h
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {topic.materials?.length || 0} materiais
                              </div>
                            </div>

                            {!isUnlocked && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 pt-2">
                                <Lock className="w-3 h-3" />
                                <span>Complete os pré-requisitos para desbloquear</span>
                              </div>
                            )}

                            {isUnlocked && status === 'not_started' && (
                              <Button 
                                size="sm" 
                                className="w-full mt-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsInProgress(topic.id);
                                }}
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Iniciar
                              </Button>
                            )}

                            {isUnlocked && status === 'in_progress' && (
                              <Button 
                                size="sm" 
                                className="w-full mt-2 bg-green-600 hover:bg-green-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsComplete(topic.id);
                                }}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Concluir
                              </Button>
                            )}

                            {isUnlocked && status === 'completed' && (
                              <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-semibold pt-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Concluído!
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Modal de Detalhes do Tópico */}
        {selectedTopic && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white shadow-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedTopic.title}</CardTitle>
                    {selectedTopic.description && (
                      <CardDescription className="mt-2">{selectedTopic.description}</CardDescription>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedTopic(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {/* Materiais */}
                {selectedTopic.materials && selectedTopic.materials.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Materiais de Estudo
                    </h3>
                    <div className="space-y-2">
                      {selectedTopic.materials.map((material: any) => (
                        <Card key={material.id} className="p-3 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {material.type === 'video' && <Video className="w-4 h-4 text-red-600" />}
                              {material.type === 'pdf' && <FileText className="w-4 h-4 text-primary" />}
                              {material.type === 'link' && <Zap className="w-4 h-4 text-purple-600" />}
                              <span className="text-sm font-medium">{material.title}</span>
                            </div>
                            <Button size="sm" variant="outline" asChild>
                              <a href={material.url} target="_blank" rel="noopener noreferrer">
                                Acessar
                              </a>
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}


              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal do Guia de Animação */}
      {selectedModuleForGuide && (
        <ModuleGuideViewer
          moduleId={selectedModuleForGuide.id}
          moduleName={selectedModuleForGuide.title}
          isOpen={showGuideModal}
          onClose={() => {
            setShowGuideModal(false);
            setSelectedModuleForGuide(null);
          }}
        />
      )}
    </StudentLayout>
  );
}
