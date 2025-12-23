import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  FileText,
  Upload,
  X,
  Network,
  Dumbbell,
  ClipboardList,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import ExamGeneratorModal from "@/components/ExamGeneratorModal";
import ExerciseGeneratorModal from "@/components/ExerciseGeneratorModal";

type TopicStatus = "not_started" | "in_progress" | "completed";

export default function LearningPaths() {
  const { data: subjects, isLoading: isLoadingSubjects } =
    trpc.subjects.list.useQuery();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    null
  );
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set()
  );

  // Module dialog state
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");

  // Topic dialog state
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [topicEstimatedHours, setTopicEstimatedHours] = useState<number>(0);

  // AI dialog states
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [syllabusText, setSyllabusText] = useState("");
  const [workload, setWorkload] = useState<number>(60);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isInfographicDialogOpen, setIsInfographicDialogOpen] = useState(false);
  const [infographicUrl, setInfographicUrl] = useState<string | null>(null);
  const [isLessonPlanDialogOpen, setIsLessonPlanDialogOpen] = useState(false);
  const [selectedTopicForPlan, setSelectedTopicForPlan] = useState<any>(null);
  const [lessonPlan, setLessonPlan] = useState<any>(null);

  // New modal states
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [selectedModuleForExercise, setSelectedModuleForExercise] = useState<{ id: number; title: string } | null>(null);

  const { data: learningPath, isLoading: isLoadingPath } =
    trpc.learningPath.getBySubject.useQuery(
      { subjectId: selectedSubjectId! },
      { enabled: !!selectedSubjectId }
    );

  const { data: progress } = trpc.learningPath.getProgress.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId }
  );

  const utils = trpc.useUtils();

  const createModuleMutation = trpc.learningPath.createModule.useMutation({
    onSuccess: () => {
      utils.learningPath.getBySubject.invalidate();
      utils.learningPath.getProgress.invalidate();
      toast.success("Módulo criado com sucesso!");
      closeModuleDialog();
    },
    onError: error => {
      toast.error("Erro ao criar módulo: " + error.message);
    },
  });

  const updateModuleMutation = trpc.learningPath.updateModule.useMutation({
    onSuccess: () => {
      utils.learningPath.getBySubject.invalidate();
      toast.success("Módulo atualizado!");
      closeModuleDialog();
    },
    onError: error => {
      toast.error("Erro ao atualizar módulo: " + error.message);
    },
  });

  const deleteModuleMutation = trpc.learningPath.deleteModule.useMutation({
    onSuccess: () => {
      utils.learningPath.getBySubject.invalidate();
      utils.learningPath.getProgress.invalidate();
      toast.success("Módulo removido!");
    },
    onError: error => {
      toast.error("Erro ao remover módulo: " + error.message);
    },
  });

  const createTopicMutation = trpc.learningPath.createTopic.useMutation({
    onSuccess: () => {
      utils.learningPath.getBySubject.invalidate();
      utils.learningPath.getProgress.invalidate();
      toast.success("Tópico criado com sucesso!");
      closeTopicDialog();
    },
    onError: error => {
      toast.error("Erro ao criar tópico: " + error.message);
    },
  });

  const updateTopicMutation = trpc.learningPath.updateTopic.useMutation({
    onSuccess: () => {
      utils.learningPath.getBySubject.invalidate();
      utils.learningPath.getProgress.invalidate();
      toast.success("Tópico atualizado!");
      closeTopicDialog();
    },
    onError: error => {
      toast.error("Erro ao atualizar tópico: " + error.message);
    },
  });

  const deleteTopicMutation = trpc.learningPath.deleteTopic.useMutation({
    onSuccess: () => {
      utils.learningPath.getBySubject.invalidate();
      utils.learningPath.getProgress.invalidate();
      toast.success("Tópico removido!");
    },
    onError: error => {
      toast.error("Erro ao remover tópico: " + error.message);
    },
  });

  const generateFromAIMutation = trpc.learningPath.generateFromAI.useMutation({
    onSuccess: data => {
      utils.learningPath.getBySubject.invalidate();
      utils.learningPath.getProgress.invalidate();
      toast.success(
        `Trilha gerada com sucesso! ${data.modulesCreated} módulos criados.`
      );
      setIsAIDialogOpen(false);
      setSyllabusText("");
    },
    onError: error => {
      toast.error("Erro ao gerar trilha: " + error.message);
    },
  });

  const generateInfographicMutation =
    trpc.learningPath.generateInfographic.useMutation({
      onSuccess: data => {
        setInfographicUrl(data.imageUrl || null);
        setIsInfographicDialogOpen(true);
        toast.success("Infográfico gerado com sucesso!");
      },
      onError: error => {
        toast.error("Erro ao gerar infográfico: " + error.message);
      },
    });

  const suggestLessonPlanMutation =
    trpc.learningPath.suggestLessonPlans.useMutation({
      onSuccess: data => {
        setLessonPlan(data);
        setIsLessonPlanDialogOpen(true);
        toast.success("Sugestões geradas com sucesso!");
      },
      onError: error => {
        toast.error("Erro ao gerar sugestões: " + error.message);
      },
    });

  const generateModuleInfographicMutation =
    trpc.learningPath.generateModuleInfographic.useMutation({
      onSuccess: data => {
        utils.learningPath.getBySubject.invalidate();
        toast.success("Infográfico do módulo gerado com sucesso!");
        // Abrir infográfico em nova aba
        if (data.imageUrl) {
          window.open(data.imageUrl, '_blank');
        }
      },
      onError: error => {
        toast.error("Erro ao gerar infográfico: " + error.message);
      },
    });

  const handleGenerateModuleInfographic = (moduleId: number) => {
    toast.info("Gerando infográfico do módulo...");
    generateModuleInfographicMutation.mutate({ moduleId });
  };



  // Função para fazer upload de arquivo (DOCX, TXT) e extrair texto
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Por favor, selecione um arquivo DOCX ou TXT');
      return;
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB');
      return;
    }

    setIsUploadingFile(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/extract-pdf-text', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao processar arquivo');
      }

      const data = await response.json();
      
      if (data.success && data.text) {
        setSyllabusText(data.text);
        
        // Mensagem personalizada baseada no tipo de arquivo
        let successMessage = 'Texto extraído com sucesso!';
        if (data.metadata.fileType === 'PDF' && data.metadata.pages) {
          successMessage += ` (${data.metadata.pages} páginas)`;
        } else if (data.metadata.fileType === 'DOCX') {
          successMessage += ' (Documento Word)';
        } else if (data.metadata.fileType === 'TXT') {
          successMessage += ' (Arquivo de texto)';
        }
        
        toast.success(successMessage);
      } else {
        throw new Error('Não foi possível extrair texto do arquivo');
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload do arquivo:', error);
      toast.error(error.message || 'Erro ao processar arquivo');
    } finally {
      setIsUploadingFile(false);
      setUploadProgress(0);
      // Limpar input para permitir upload do mesmo arquivo novamente
      event.target.value = '';
    }
  };

  const toggleModule = (moduleId: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const openModuleDialog = (module?: any) => {
    if (module) {
      setEditingModule(module);
      setModuleTitle(module.title);
      setModuleDescription(module.description || "");
    } else {
      setEditingModule(null);
      setModuleTitle("");
      setModuleDescription("");
    }
    setIsModuleDialogOpen(true);
  };

  const closeModuleDialog = () => {
    setIsModuleDialogOpen(false);
    setEditingModule(null);
    setModuleTitle("");
    setModuleDescription("");
  };

  const openTopicDialog = (moduleId: number, topic?: any) => {
    setSelectedModuleId(moduleId);
    if (topic) {
      setEditingTopic(topic);
      setTopicTitle(topic.title);
      setTopicDescription(topic.description || "");
      setTopicEstimatedHours(topic.estimatedHours || 0);
    } else {
      setEditingTopic(null);
      setTopicTitle("");
      setTopicDescription("");
      setTopicEstimatedHours(0);
    }
    setIsTopicDialogOpen(true);
  };

  const closeTopicDialog = () => {
    setIsTopicDialogOpen(false);
    setEditingTopic(null);
    setSelectedModuleId(null);
    setTopicTitle("");
    setTopicDescription("");
    setTopicEstimatedHours(0);
  };

  const handleSaveModule = () => {
    if (!moduleTitle.trim()) {
      toast.error("Título do módulo é obrigatório");
      return;
    }

    if (editingModule) {
      updateModuleMutation.mutate({
        id: editingModule.id,
        title: moduleTitle,
        description: moduleDescription || undefined,
      });
    } else {
      if (!selectedSubjectId) return;
      createModuleMutation.mutate({
        subjectId: selectedSubjectId,
        title: moduleTitle,
        description: moduleDescription || undefined,
      });
    }
  };

  const handleSaveTopic = () => {
    if (!topicTitle.trim()) {
      toast.error("Título do tópico é obrigatório");
      return;
    }

    if (editingTopic) {
      updateTopicMutation.mutate({
        id: editingTopic.id,
        title: topicTitle,
        description: topicDescription || undefined,
        estimatedHours: topicEstimatedHours || undefined,
      });
    } else {
      if (!selectedModuleId) return;
      createTopicMutation.mutate({
        moduleId: selectedModuleId,
        title: topicTitle,
        description: topicDescription || undefined,
        estimatedHours: topicEstimatedHours || undefined,
      });
    }
  };

  const handleDeleteModule = (moduleId: number) => {
    if (
      confirm(
        "Tem certeza que deseja remover este módulo? Todos os tópicos serão removidos também."
      )
    ) {
      deleteModuleMutation.mutate({ id: moduleId });
    }
  };

  const handleDeleteTopic = (topicId: number) => {
    if (confirm("Tem certeza que deseja remover este tópico?")) {
      deleteTopicMutation.mutate({ id: topicId });
    }
  };

  const handleUpdateTopicStatus = (
    topicId: number,
    currentStatus: TopicStatus
  ) => {
    const statusCycle: TopicStatus[] = [
      "not_started",
      "in_progress",
      "completed",
    ];
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

    updateTopicMutation.mutate({
      id: topicId,
      status: nextStatus,
    });
  };

  const getStatusIcon = (status: TopicStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TopicStatus) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Concluído</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-600">Em Andamento</Badge>;
      default:
        return <Badge variant="outline">Não Iniciado</Badge>;
    }
  };

  if (isLoadingSubjects) {
    return (
      <>
        <Sidebar />
        <PageWrapper className="min-h-screen bg-gray-50">
          <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Carregando disciplinas...</p>
            </div>
          </div>
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Trilhas de Aprendizagem</h1>
            <p className="text-muted-foreground">
              Organize o conteúdo programático de cada disciplina em módulos e
              tópicos
            </p>
          </div>

          {/* Subject Selection */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Selecione uma Disciplina
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects?.map((subject: any) => (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubjectId(subject.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedSubjectId === subject.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subject.color || "#3b82f6" }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{subject.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {subject.code}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Learning Path Content */}
          {selectedSubjectId && (
            <>
              {/* Progress Card */}
              {progress && progress.totalTopics > 0 && (
                <Card className="p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">
                      Progresso da Trilha
                    </h2>
                    <span className="text-2xl font-bold text-primary">
                      {progress.percentage}%
                    </span>
                  </div>
                  <Progress value={progress.percentage} className="mb-4" />
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">
                        {progress.totalTopics}
                      </p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {progress.completedTopics}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Concluídos
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {progress.inProgressTopics}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Em Andamento
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-400">
                        {progress.notStartedTopics}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Não Iniciados
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Modules and Topics */}
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-bold">Módulos e Tópicos</h2>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {/* Botões de IA */}
                    <div className="flex gap-2 flex-1 sm:flex-initial flex-wrap">
                      <Button
                        variant="outline"
                        onClick={() => setIsAIDialogOpen(true)}
                        className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 flex-1 sm:flex-initial"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar com IA
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (!selectedSubjectId) return;
                          if (!learningPath || learningPath.length === 0) {
                            toast.error("Crie módulos primeiro para criar prova");
                            return;
                          }
                          setIsExamModalOpen(true);
                        }}
                        disabled={!learningPath || learningPath.length === 0}
                        className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 flex-1 sm:flex-initial"
                        title={!learningPath || learningPath.length === 0 ? "Crie módulos primeiro" : "Criar prova com IA"}
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Criar Prova
                      </Button>
                    </div>
                    {/* Botão de criar módulo */}
                    <Button
                      onClick={() => openModuleDialog()}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Módulo
                    </Button>
                  </div>
                </div>

                {isLoadingPath ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">
                      Carregando trilha...
                    </span>
                  </div>
                ) : !learningPath || learningPath.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="max-w-md mx-auto">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full opacity-50"></div>
                        </div>
                        <BookOpen className="h-16 w-16 mx-auto text-purple-500 relative z-10" />
                      </div>

                      <h3 className="text-xl font-semibold mb-2">
                        Nenhuma trilha criada ainda
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Organize o conteúdo programático da sua disciplina em
                        módulos e tópicos estruturados
                      </p>

                      {/* Destaque da IA */}
                      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                          <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div className="text-left">
                            <p className="font-medium text-purple-900 mb-1">
                              Deixe a IA fazer o trabalho pesado!
                            </p>
                            <p className="text-sm text-purple-700">
                              Cole a ementa da disciplina e a IA criará
                              automaticamente módulos, tópicos e distribuição de
                              atividades.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Botões de ação */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          onClick={() => setIsAIDialogOpen(true)}
                          className="bg-purple-600 hover:bg-purple-700"
                          size="lg"
                        >
                          <Sparkles className="h-5 w-5 mr-2" />
                          Gerar com IA
                        </Button>
                        <Button
                          onClick={() => openModuleDialog()}
                          variant="outline"
                          size="lg"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Criar Manualmente
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {learningPath.map((module, moduleIndex) => (
                      <div key={module.id} className="border rounded-lg">
                        {/* Module Header */}
                        <div className="p-4 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <button
                                onClick={() => toggleModule(module.id)}
                                className="p-1 hover:bg-muted rounded"
                              >
                                {expandedModules.has(module.id) ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                              </button>
                              <div className="flex-1">
                                <h3 className="font-semibold">
                                  Módulo {moduleIndex + 1}: {module.title}
                                </h3>
                                {module.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {module.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {module.topics?.length || 0} tópico(s)
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedModuleForExercise({ id: module.id, title: module.title });
                                  setIsExerciseModalOpen(true);
                                }}
                                title="Criar Exercícios do Módulo"
                              >
                                <Dumbbell className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openModuleDialog(module)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteModule(module.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Topics */}
                        {expandedModules.has(module.id) && (
                          <div className="p-4 space-y-3">
                            {module.topics && module.topics.length > 0 ? (
                              module.topics.map((topic, topicIndex) => (
                                <div
                                  key={topic.id}
                                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                                >
                                  <button
                                    onClick={() =>
                                      handleUpdateTopicStatus(
                                        topic.id,
                                        topic.status
                                      )
                                    }
                                    className="flex-shrink-0"
                                  >
                                    {getStatusIcon(topic.status)}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium">
                                      {moduleIndex + 1}.{topicIndex + 1}{" "}
                                      {topic.title}
                                    </h4>
                                    {topic.description && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {topic.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      {getStatusBadge(topic.status)}
                                      {(topic.estimatedHours || 0) > 0 && (
                                        <span className="text-xs text-muted-foreground font-medium">
                                          {topic.estimatedHours}h total
                                        </span>
                                      )}
                                      {/* Badges de distribuição de atividades */}
                                      {(topic.theoryHours || 0) > 0 && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                        >
                                          📚 {topic.theoryHours}h teoria
                                        </Badge>
                                      )}
                                      {(topic.practiceHours || 0) > 0 && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-green-50 text-green-700 border-green-200"
                                        >
                                          🔧 {topic.practiceHours}h prática
                                        </Badge>
                                      )}
                                      {(topic.individualWorkHours || 0) > 0 && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                        >
                                          👤 {topic.individualWorkHours}h
                                          individual
                                        </Badge>
                                      )}
                                      {(topic.teamWorkHours || 0) > 0 && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                                        >
                                          👥 {topic.teamWorkHours}h equipe
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Link
                                      href={`/learning-paths/${selectedSubjectId}/topic/${topic.id}/materials`}
                                    >
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        title="Gerenciar Materiais"
                                      >
                                        <FileText className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setSelectedTopicForPlan(topic);
                                        suggestLessonPlanMutation.mutate({
                                          topicId: topic.id,
                                        });
                                      }}
                                      disabled={
                                        suggestLessonPlanMutation.isPending
                                      }
                                      className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                      title="Sugestões de Aula"
                                    >
                                      {suggestLessonPlanMutation.isPending &&
                                      selectedTopicForPlan?.id === topic.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Lightbulb className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        openTopicDialog(module.id, topic)
                                      }
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        handleDeleteTopic(topic.id)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center text-muted-foreground py-4">
                                Nenhum tópico neste módulo
                              </p>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openTopicDialog(module.id)}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Tópico
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}

          {/* Module Dialog */}
          <Dialog
            open={isModuleDialogOpen}
            onOpenChange={setIsModuleDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingModule ? "Editar Módulo" : "Novo Módulo"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Título do Módulo *
                  </label>
                  <Input
                    value={moduleTitle}
                    onChange={e => setModuleTitle(e.target.value)}
                    placeholder="Ex: Introdução à Programação"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Descrição (opcional)
                  </label>
                  <Textarea
                    value={moduleDescription}
                    onChange={e => setModuleDescription(e.target.value)}
                    placeholder="Descreva o conteúdo deste módulo..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeModuleDialog}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveModule}>
                  {editingModule ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Topic Dialog */}
          <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTopic ? "Editar Tópico" : "Novo Tópico"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Título do Tópico *
                  </label>
                  <Input
                    value={topicTitle}
                    onChange={e => setTopicTitle(e.target.value)}
                    placeholder="Ex: Variáveis e Tipos de Dados"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Descrição (opcional)
                  </label>
                  <Textarea
                    value={topicDescription}
                    onChange={e => setTopicDescription(e.target.value)}
                    placeholder="Descreva o conteúdo deste tópico..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Horas Estimadas (opcional)
                  </label>
                  <Input
                    type="number"
                    value={topicEstimatedHours}
                    onChange={e =>
                      setTopicEstimatedHours(parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeTopicDialog}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveTopic}>
                  {editingTopic ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* AI Generation Dialog */}
          <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Gerar Trilha com IA
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Cole a ementa da disciplina abaixo. A IA irá analisar e criar
                  automaticamente módulos e tópicos organizados pedagogicamente.
                </p>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Carga Horária Total (horas) *
                  </label>
                  <Input
                    type="number"
                    value={workload}
                    onChange={e => setWorkload(parseInt(e.target.value) || 60)}
                    placeholder="60"
                    min={1}
                    max={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A IA distribuirá as horas proporcionalmente entre módulos e
                    tópicos
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Ementa da Disciplina *
                  </label>
                  
                  {/* Botão de Upload de Arquivo */}
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      type="file"
                      accept=".docx,.txt"
                      onChange={handleFileUpload}
                      disabled={isUploadingFile}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="pdf-upload">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingFile}
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="cursor-pointer"
                      >
                        {isUploadingFile ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Fazer Upload de Arquivo
                          </>
                        )}
                      </Button>
                    </label>
                    <span className="text-xs text-muted-foreground">
                      (DOCX ou TXT) ou cole o texto manualmente
                    </span>
                  </div>

                  {/* Barra de progresso */}
                  {isUploadingFile && uploadProgress > 0 && (
                    <div className="mb-3">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Extraindo texto do arquivo... {uploadProgress}%
                      </p>
                    </div>
                  )}
                  
                  <Textarea
                    value={syllabusText}
                    onChange={e => setSyllabusText(e.target.value)}
                    placeholder="Cole aqui o conteúdo da ementa (objetivos, conteúdo programático, bibliografia, etc.)..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAIDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    console.log('[Gerar Trilha] Botão clicado');
                    console.log('[Gerar Trilha] selectedSubjectId:', selectedSubjectId);
                    console.log('[Gerar Trilha] syllabusText length:', syllabusText.length);
                    console.log('[Gerar Trilha] workload:', workload);
                    
                    if (!selectedSubjectId) {
                      console.error('[Gerar Trilha] Erro: Nenhuma disciplina selecionada');
                      toast.error("Selecione uma disciplina primeiro");
                      return;
                    }
                    if (!syllabusText.trim()) {
                      console.error('[Gerar Trilha] Erro: Ementa vazia');
                      toast.error("Digite a ementa da disciplina");
                      return;
                    }
                    
                    console.log('[Gerar Trilha] Iniciando geração...');
                    generateFromAIMutation.mutate({
                      subjectId: selectedSubjectId,
                      syllabusText: syllabusText.trim(),
                      workload: workload,
                    });
                  }}
                  disabled={generateFromAIMutation.isPending}
                >
                  {generateFromAIMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar Trilha
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Infographic Dialog */}
          <Dialog
            open={isInfographicDialogOpen}
            onOpenChange={setIsInfographicDialogOpen}
          >
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-500" />
                  Infográfico da Trilha de Aprendizagem
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {infographicUrl ? (
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={infographicUrl}
                      alt="Infográfico da Trilha"
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Gerando infográfico...
                  </p>
                )}
              </div>
              <DialogFooter>
                {infographicUrl && (
                  <Button asChild>
                    <a
                      href={infographicUrl}
                      download="trilha-aprendizagem.png"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Baixar Imagem
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsInfographicDialogOpen(false)}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Lesson Plan Dialog */}
          <Dialog
            open={isLessonPlanDialogOpen}
            onOpenChange={setIsLessonPlanDialogOpen}
          >
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Sugestões de Plano de Aula
                </DialogTitle>
              </DialogHeader>
              {lessonPlan && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">
                      Objetivos de Aprendizagem
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {lessonPlan.objectives?.map(
                        (obj: string, idx: number) => (
                          <li key={idx}>{obj}</li>
                        )
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Metodologia Sugerida</h3>
                    <p className="text-sm text-muted-foreground">
                      {lessonPlan.methodology}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Atividades</h3>
                    <div className="space-y-3">
                      {lessonPlan.activities?.map(
                        (activity: any, idx: number) => (
                          <Card key={idx} className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{activity.title}</h4>
                              <Badge variant="outline">
                                {activity.duration} min
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {activity.description}
                            </p>
                          </Card>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Recursos Necessários</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {lessonPlan.resources?.map(
                        (resource: string, idx: number) => (
                          <li key={idx}>{resource}</li>
                        )
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Avaliação</h3>
                    <p className="text-sm text-muted-foreground">
                      {lessonPlan.assessment}
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsLessonPlanDialogOpen(false)}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Exam Generator Modal */}
          {selectedSubjectId && subjects && (
            <ExamGeneratorModal
              isOpen={isExamModalOpen}
              onClose={() => setIsExamModalOpen(false)}
              subjectId={selectedSubjectId}
              subjectName={subjects.find(s => s.id === selectedSubjectId)?.name || ""}
              modules={learningPath?.map(m => ({ id: m.id, title: m.title })) || []}
            />
          )}



          {/* Exercise Generator Modal */}
          {selectedModuleForExercise && (
            <ExerciseGeneratorModal
              isOpen={isExerciseModalOpen}
              onClose={() => {
                setIsExerciseModalOpen(false);
                setSelectedModuleForExercise(null);
              }}
              moduleId={selectedModuleForExercise.id}
              moduleTitle={selectedModuleForExercise.title}
            />
          )}
        </div>
      </PageWrapper>
    </>
  );
}
