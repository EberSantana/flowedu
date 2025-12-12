import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  Loader2
} from "lucide-react";
import { toast } from "sonner";

type TopicStatus = 'not_started' | 'in_progress' | 'completed';

export default function LearningPaths() {
  const { data: subjects, isLoading: isLoadingSubjects } = trpc.subjects.list.useQuery();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  
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
  const [isInfographicDialogOpen, setIsInfographicDialogOpen] = useState(false);
  const [infographicUrl, setInfographicUrl] = useState<string | null>(null);
  const [isLessonPlanDialogOpen, setIsLessonPlanDialogOpen] = useState(false);
  const [selectedTopicForPlan, setSelectedTopicForPlan] = useState<any>(null);
  const [lessonPlan, setLessonPlan] = useState<any>(null);
  
  const { data: learningPath, isLoading: isLoadingPath } = trpc.learningPath.getBySubject.useQuery(
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
    onError: (error) => {
      toast.error("Erro ao criar módulo: " + error.message);
    },
  });
  
  const updateModuleMutation = trpc.learningPath.updateModule.useMutation({
    onSuccess: () => {
      utils.learningPath.getBySubject.invalidate();
      toast.success("Módulo atualizado!");
      closeModuleDialog();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar módulo: " + error.message);
    },
  });
  
  const deleteModuleMutation = trpc.learningPath.deleteModule.useMutation({
    onSuccess: () => {
      utils.learningPath.getBySubject.invalidate();
      utils.learningPath.getProgress.invalidate();
      toast.success("Módulo removido!");
    },
    onError: (error) => {
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
    onError: (error) => {
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
    onError: (error) => {
      toast.error("Erro ao atualizar tópico: " + error.message);
    },
  });
  
  const deleteTopicMutation = trpc.learningPath.deleteTopic.useMutation({
    onSuccess: () => {
      utils.learningPath.getBySubject.invalidate();
      utils.learningPath.getProgress.invalidate();
      toast.success("Tópico removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover tópico: " + error.message);
    },
  });
  
  const generateFromAIMutation = trpc.learningPath.generateFromAI.useMutation({
    onSuccess: (data) => {
      utils.learningPath.getBySubject.invalidate();
      utils.learningPath.getProgress.invalidate();
      toast.success(`Trilha gerada com sucesso! ${data.modulesCreated} módulos criados.`);
      setIsAIDialogOpen(false);
      setSyllabusText("");
    },
    onError: (error) => {
      toast.error("Erro ao gerar trilha: " + error.message);
    },
  });
  
  const generateInfographicMutation = trpc.learningPath.generateInfographic.useMutation({
    onSuccess: (data) => {
      setInfographicUrl(data.imageUrl || null);
      setIsInfographicDialogOpen(true);
      toast.success("Infográfico gerado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar infográfico: " + error.message);
    },
  });
  
  const suggestLessonPlanMutation = trpc.learningPath.suggestLessonPlans.useMutation({
    onSuccess: (data) => {
      setLessonPlan(data);
      setIsLessonPlanDialogOpen(true);
      toast.success("Sugestões geradas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar sugestões: " + error.message);
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
    if (confirm("Tem certeza que deseja remover este módulo? Todos os tópicos serão removidos também.")) {
      deleteModuleMutation.mutate({ id: moduleId });
    }
  };
  
  const handleDeleteTopic = (topicId: number) => {
    if (confirm("Tem certeza que deseja remover este tópico?")) {
      deleteTopicMutation.mutate({ id: topicId });
    }
  };
  
  const handleUpdateTopicStatus = (topicId: number, currentStatus: TopicStatus) => {
    const statusCycle: TopicStatus[] = ['not_started', 'in_progress', 'completed'];
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    
    updateTopicMutation.mutate({
      id: topicId,
      status: nextStatus,
    });
  };
  
  const getStatusIcon = (status: TopicStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };
  
  const getStatusBadge = (status: TopicStatus) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Concluído</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-600">Em Andamento</Badge>;
      default:
        return <Badge variant="outline">Não Iniciado</Badge>;
    }
  };
  
  if (isLoadingSubjects) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando disciplinas...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Trilhas de Aprendizagem</h1>
        <p className="text-muted-foreground">
          Organize o conteúdo programático de cada disciplina em módulos e tópicos
        </p>
      </div>
      
      {/* Subject Selection */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Selecione uma Disciplina</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects?.map((subject: any) => (
            <button
              key={subject.id}
              onClick={() => setSelectedSubjectId(subject.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedSubjectId === subject.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: subject.color || '#3b82f6' }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{subject.name}</h3>
                  <p className="text-sm text-muted-foreground">{subject.code}</p>
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
                <h2 className="text-lg font-semibold">Progresso da Trilha</h2>
                <span className="text-2xl font-bold text-primary">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="mb-4" />
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{progress.totalTopics}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{progress.completedTopics}</p>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{progress.inProgressTopics}</p>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-400">{progress.notStartedTopics}</p>
                  <p className="text-sm text-muted-foreground">Não Iniciados</p>
                </div>
              </div>
            </Card>
          )}
          
          {/* Modules and Topics */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Módulos e Tópicos</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAIDialogOpen(true)}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar com IA
                </Button>
                {learningPath && learningPath.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (!selectedSubjectId) return;
                      generateInfographicMutation.mutate({ subjectId: selectedSubjectId });
                    }}
                    disabled={generateInfographicMutation.isPending}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    {generateInfographicMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4 mr-2" />
                    )}
                    Infográfico
                  </Button>
                )}
                <Button onClick={() => openModuleDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Módulo
                </Button>
              </div>
            </div>
            
            {isLoadingPath ? (
              <p className="text-center text-muted-foreground py-8">Carregando trilha...</p>
            ) : !learningPath || learningPath.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Nenhum módulo criado ainda. Comece criando o primeiro módulo!
                </p>
                <Button onClick={() => openModuleDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Módulo
                </Button>
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
                                onClick={() => handleUpdateTopicStatus(topic.id, topic.status)}
                                className="flex-shrink-0"
                              >
                                {getStatusIcon(topic.status)}
                              </button>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium">
                                  {moduleIndex + 1}.{topicIndex + 1} {topic.title}
                                </h4>
                                {topic.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {topic.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                  {getStatusBadge(topic.status)}
                                  {(topic.estimatedHours || 0) > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {topic.estimatedHours}h estimadas
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedTopicForPlan(topic);
                                    suggestLessonPlanMutation.mutate({ topicId: topic.id });
                                  }}
                                  disabled={suggestLessonPlanMutation.isPending}
                                  className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                  title="Sugestões de Aula"
                                >
                                  {suggestLessonPlanMutation.isPending && selectedTopicForPlan?.id === topic.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Lightbulb className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openTopicDialog(module.id, topic)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteTopic(topic.id)}
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
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingModule ? "Editar Módulo" : "Novo Módulo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Título do Módulo *</label>
              <Input
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                placeholder="Ex: Introdução à Programação"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Descrição (opcional)</label>
              <Textarea
                value={moduleDescription}
                onChange={(e) => setModuleDescription(e.target.value)}
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
              <label className="text-sm font-medium mb-2 block">Título do Tópico *</label>
              <Input
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="Ex: Variáveis e Tipos de Dados"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Descrição (opcional)</label>
              <Textarea
                value={topicDescription}
                onChange={(e) => setTopicDescription(e.target.value)}
                placeholder="Descreva o conteúdo deste tópico..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Horas Estimadas (opcional)</label>
              <Input
                type="number"
                value={topicEstimatedHours}
                onChange={(e) => setTopicEstimatedHours(parseInt(e.target.value) || 0)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Gerar Trilha com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cole a ementa da disciplina abaixo. A IA irá analisar e criar automaticamente módulos e tópicos organizados pedagogicamente.
            </p>
            <div>
              <label className="text-sm font-medium mb-2 block">Ementa da Disciplina *</label>
              <Textarea
                value={syllabusText}
                onChange={(e) => setSyllabusText(e.target.value)}
                placeholder="Cole aqui o conteúdo da ementa (objetivos, conteúdo programático, bibliografia, etc.)..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (!selectedSubjectId) {
                  toast.error("Selecione uma disciplina primeiro");
                  return;
                }
                if (!syllabusText.trim()) {
                  toast.error("Digite a ementa da disciplina");
                  return;
                }
                generateFromAIMutation.mutate({
                  subjectId: selectedSubjectId,
                  syllabusText: syllabusText.trim(),
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
      <Dialog open={isInfographicDialogOpen} onOpenChange={setIsInfographicDialogOpen}>
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
                <a href={infographicUrl} download="trilha-aprendizagem.png" target="_blank" rel="noopener noreferrer">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Baixar Imagem
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsInfographicDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Lesson Plan Dialog */}
      <Dialog open={isLessonPlanDialogOpen} onOpenChange={setIsLessonPlanDialogOpen}>
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
                <h3 className="font-semibold mb-2">Objetivos de Aprendizagem</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {lessonPlan.objectives?.map((obj: string, idx: number) => (
                    <li key={idx}>{obj}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Metodologia Sugerida</h3>
                <p className="text-sm text-muted-foreground">{lessonPlan.methodology}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Atividades</h3>
                <div className="space-y-3">
                  {lessonPlan.activities?.map((activity: any, idx: number) => (
                    <Card key={idx} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{activity.title}</h4>
                        <Badge variant="outline">{activity.duration} min</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Recursos Necessários</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {lessonPlan.resources?.map((resource: string, idx: number) => (
                    <li key={idx}>{resource}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Avaliação</h3>
                <p className="text-sm text-muted-foreground">{lessonPlan.assessment}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLessonPlanDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
