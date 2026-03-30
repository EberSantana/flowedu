import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ClipboardList,
  BookOpen,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  Hash,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  Settings,
  RotateCcw,
} from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import ActivitiesTab from "@/components/ActivitiesTab";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AssessmentsManager() {
  const { user } = useAuth();
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string; type: "assessment" | "exercise" } | null>(null);
  const [viewQuestionsId, setViewQuestionsId] = useState<number | null>(null);
  const [viewQuestionsTitle, setViewQuestionsTitle] = useState<string>("");
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [editMaxAttemptsId, setEditMaxAttemptsId] = useState<number | null>(null);
  const [editMaxAttemptsValue, setEditMaxAttemptsValue] = useState<string>("1");

  // Estado para o modal de alunos pendentes de PROVA
  const [viewAssessmentStudentsId, setViewAssessmentStudentsId] = useState<number | null>(null);
  const [viewAssessmentStudentsTitle, setViewAssessmentStudentsTitle] = useState<string>("");

  // Estado para o modal de configurações de exercício
  const [editExerciseId, setEditExerciseId] = useState<number | null>(null);
  const [editExerciseTitle, setEditExerciseTitle] = useState<string>("");
  const [editExerciseMaxAttempts, setEditExerciseMaxAttempts] = useState<string>("3");
  const [resetConfirmStudent, setResetConfirmStudent] = useState<{ studentId: number; name: string } | null>(null);
  const [exerciseModalTab, setExerciseModalTab] = useState<"pending" | "config">("pending");

  const utils = trpc.useUtils();

  // Buscar disciplinas com turmas vinculadas
  const { data: subjectsWithClass } = trpc.subjects.listWithClass.useQuery();

  // Extrair subjectId do filtro (formato "subjectId" ou "subjectId:classId")
  const filterSubjectId = subjectFilter !== "all" ? parseInt(subjectFilter.split(":")[0]) : undefined;

  // Buscar provas do professor
  const { data: assessments, isLoading: loadingAssessments } = trpc.learningPath.getTeacherAssessments.useQuery(
    { subjectId: filterSubjectId },
    { enabled: !!user }
  );

  // Buscar exercícios do professor
  const { data: exercises, isLoading: loadingExercises } = trpc.teacherExercises.list.useQuery(
    { subjectId: filterSubjectId },
    { enabled: !!user }
  );

  // Buscar contador de conclusão por exercício
  const { data: completionStats } = trpc.teacherExercises.getCompletionStats.useQuery(
    { subjectId: filterSubjectId },
    { enabled: !!user }
  );

  // Buscar alunos pendentes e concluídos (para o modal de edição)
  const { data: pendingStudentsData, isLoading: loadingPending } = trpc.teacherExercises.getPendingStudents.useQuery(
    { exerciseId: editExerciseId ?? 0 },
    {
      enabled: editExerciseId !== null && editExerciseId !== undefined && editExerciseId > 0,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );

  // Buscar lista de alunos com tentativas (para o modal de edição)
  const { data: studentAttemptsList, isLoading: loadingAttempts, error: attemptsError } = trpc.teacherExercises.getStudentAttemptsList.useQuery(
    { exerciseId: editExerciseId ?? 0 },
    { 
      enabled: editExerciseId !== null && editExerciseId !== undefined && editExerciseId > 0,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );

  // Buscar alunos pendentes/concluídos para a prova selecionada
  const { data: assessmentStudentsData, isLoading: loadingAssessmentStudents } = trpc.learningPath.getPendingStudentsForAssessment.useQuery(
    { assessmentId: viewAssessmentStudentsId ?? 0 },
    {
      enabled: viewAssessmentStudentsId !== null && viewAssessmentStudentsId > 0,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );

  // Buscar questões da prova selecionada
  const { data: assessmentQuestions, isLoading: loadingQuestions } = trpc.learningPath.getAssessmentQuestions.useQuery(
    { assessmentId: viewQuestionsId! },
    { enabled: viewQuestionsId !== null }
  );

  // Mutation para deletar prova
  const deleteAssessmentMutation = trpc.learningPath.deleteAssessment.useMutation({
    onSuccess: () => {
      toast.success("Prova excluída com sucesso!");
      utils.learningPath.getTeacherAssessments.invalidate();
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error("Erro ao excluir prova: " + err.message);
      setDeleteTarget(null);
    },
  });

  // Mutation para deletar exercício
  const deleteExerciseMutation = trpc.teacherExercises.delete.useMutation({
    onSuccess: () => {
      toast.success("Exercício excluído com sucesso!");
      utils.teacherExercises.list.invalidate();
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error("Erro ao excluir exercício: " + err.message);
      setDeleteTarget(null);
    },
  });

  // Mutation para atualizar maxAttempts de PROVA
  const updateMaxAttemptsMutation = trpc.learningPath.updateAssessmentMaxAttempts.useMutation({
    onSuccess: () => {
      toast.success("Número máximo de tentativas atualizado!");
      utils.learningPath.getTeacherAssessments.invalidate();
      setEditMaxAttemptsId(null);
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  // Mutation para atualizar maxAttempts de EXERCÍCIO
  const updateExerciseMaxAttemptsMutation = trpc.teacherExercises.updateExerciseMaxAttempts.useMutation({
    onSuccess: () => {
      toast.success("Número máximo de tentativas atualizado!");
      utils.teacherExercises.list.invalidate();
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  // Mutation para resetar tentativas de um aluno
  const resetStudentAttemptsMutation = trpc.teacherExercises.resetStudentAttempts.useMutation({
    onSuccess: (data) => {
      toast.success(`Tentativas resetadas! ${data.deleted} tentativa(s) removida(s).`);
      utils.teacherExercises.getStudentAttemptsList.invalidate({ exerciseId: editExerciseId! });
      utils.teacherExercises.getCompletionStats.invalidate();
      setResetConfirmStudent(null);
    },
    onError: (err) => {
      toast.error("Erro ao resetar tentativas: " + err.message);
      setResetConfirmStudent(null);
    },
  });

  // Mutation para alterar status da prova
  const toggleStatusMutation = trpc.learningPath.toggleAssessmentStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.status === "published" ? "Prova publicada! Alunos foram notificados." : "Prova despublicada!");
      utils.learningPath.getTeacherAssessments.invalidate();
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "assessment") {
      deleteAssessmentMutation.mutate({ assessmentId: deleteTarget.id });
    } else {
      deleteExerciseMutation.mutate({ exerciseId: deleteTarget.id });
    }
  };

  const openEditExercise = (exercise: any) => {
    setEditExerciseId(exercise.id);
    setEditExerciseTitle(exercise.title);
    setEditExerciseMaxAttempts(String(exercise.maxAttempts ?? 3));
    setExerciseModalTab("pending");
  };

  const handleSaveExerciseMaxAttempts = () => {
    const val = parseInt(editExerciseMaxAttempts);
    if (isNaN(val) || val < 1) {
      toast.error("Informe um número válido de tentativas (mínimo 1)");
      return;
    }
    updateExerciseMaxAttemptsMutation.mutate({ exerciseId: editExerciseId!, maxAttempts: val });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "—";
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "published") {
      return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Publicada</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Rascunho</Badge>;
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      multiple_choice: "Múltipla Escolha",
      true_false: "V ou F",
      essay: "Dissertativa",
      short_answer: "Resposta Curta",
      fill_blank: "Lacunas",
      matching: "Associação",
    };
    return labels[type] || type;
  };

  const getDifficultyBadge = (difficulty: string) => {
    if (difficulty === "easy") return <Badge className="bg-green-100 text-green-700 text-xs">Fácil</Badge>;
    if (difficulty === "hard") return <Badge className="bg-red-100 text-red-700 text-xs">Difícil</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Médio</Badge>;
  };

  const totalPublished = assessments?.filter((a: any) => a.status === 'published').length ?? 0;
  const totalDraft = assessments?.filter((a: any) => a.status !== 'published').length ?? 0;

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <Breadcrumb items={[{ label: "Recursos Pedagógicos" }, { label: "Banco de Provas e Exercícios" }]} />
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Banco de Provas e Exercícios</h1>
              <p className="text-muted-foreground">Gerencie todas as suas provas e exercícios publicados</p>
            </div>
            {/* Filtro por disciplina */}
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Filtrar por disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as disciplinas</SelectItem>
                  {subjectsWithClass?.map((s) => (
                    <SelectItem key={s.filterKey} value={s.filterKey}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{assessments?.length ?? 0}</p>
                <p className="text-xs text-gray-500">Total de Provas</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{totalPublished}</p>
                <p className="text-xs text-gray-500">Publicadas</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{totalDraft}</p>
                <p className="text-xs text-gray-500">Rascunhos</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="assessments">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="assessments" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                <ClipboardList className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Provas</span>
                <span className="hidden sm:inline">({assessments?.length ?? 0})</span>
              </TabsTrigger>
              <TabsTrigger value="exercises" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Exercícios</span>
                <span className="hidden sm:inline">({exercises?.length ?? 0})</span>
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Atividades de Sala</span>
                <span className="sm:hidden">Atividades</span>
              </TabsTrigger>
            </TabsList>

            {/* ABA PROVAS */}
            <TabsContent value="assessments" className="mt-4">
              {loadingAssessments ? (
                <div className="text-center py-12 text-gray-400">Carregando provas...</div>
              ) : !assessments || assessments.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Nenhuma prova encontrada</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Crie provas em <strong>Trilhas de Aprendizagem</strong> e publique para os alunos
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {assessments.map((assessment: any) => (
                    <Card key={assessment.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 truncate">{assessment.title}</h3>
                              {getStatusBadge(assessment.status)}
                              {assessment.shuffleQuestions ? (
                                <span
                                  title="Anti-cola ativo: questões e alternativas embaralhadas para cada aluno"
                                  className="inline-flex items-center gap-1 text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 rounded-full px-2 py-0.5 cursor-default"
                                >
                                  🎲 Anti-cola
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Hash className="h-3.5 w-3.5" />
                                {assessment.totalQuestions} questões · {assessment.totalPoints} pts
                              </span>
                              {/* Edição inline de tentativas máximas */}
                              {editMaxAttemptsId === assessment.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    min={1}
                                    max={99}
                                    className="w-16 h-6 text-xs px-1 py-0"
                                    value={editMaxAttemptsValue}
                                    onChange={(e) => setEditMaxAttemptsValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        const val = parseInt(editMaxAttemptsValue);
                                        if (val >= 1)
                                          updateMaxAttemptsMutation.mutate({ assessmentId: assessment.id, maxAttempts: val });
                                      }
                                      if (e.key === "Escape") setEditMaxAttemptsId(null);
                                    }}
                                    autoFocus
                                  />
                                  <Button size="sm" className="h-6 px-2 text-xs" onClick={() => {
                                    const val = parseInt(editMaxAttemptsValue);
                                    if (val >= 1)
                                      updateMaxAttemptsMutation.mutate({ assessmentId: assessment.id, maxAttempts: val });
                                  }}>OK</Button>
                                  <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => setEditMaxAttemptsId(null)}>✕</Button>
                                </div>
                              ) : (
                                <button
                                  className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                                  onClick={() => {
                                    setEditMaxAttemptsId(assessment.id);
                                    setEditMaxAttemptsValue(String(assessment.maxAttempts ?? 1));
                                  }}
                                  title="Clique para editar o número máximo de tentativas"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  {assessment.maxAttempts ?? 1} tentativa{(assessment.maxAttempts ?? 1) !== 1 ? "s" : ""} máx.
                                </button>
                              )}
                              {assessment.availableFrom && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  Disponível: {formatDate(assessment.availableFrom)}
                                  {assessment.availableTo && ` até ${formatDate(assessment.availableTo)}`}
                                </span>
                              )}
                            </div>
                            {assessment.description && (
                              <p className="text-sm text-gray-400 mt-1 truncate">{assessment.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-purple-600 border-purple-200 hover:bg-purple-50"
                              onClick={() => {
                                setViewAssessmentStudentsId(assessment.id);
                                setViewAssessmentStudentsTitle(assessment.title);
                              }}
                            >
                              <Users className="h-4 w-4 mr-1" />
                              Alunos
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setViewQuestionsId(assessment.id);
                                setViewQuestionsTitle(assessment.title);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Ver Questões
                            </Button>
                            {assessment.status !== "published" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => toggleStatusMutation.mutate({ assessmentId: assessment.id, status: "published" })}
                                disabled={toggleStatusMutation.isPending}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Publicar
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                                onClick={() => toggleStatusMutation.mutate({ assessmentId: assessment.id, status: "draft" })}
                                disabled={toggleStatusMutation.isPending}
                              >
                                <EyeOff className="h-4 w-4 mr-1" />
                                Despublicar
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => setDeleteTarget({ id: assessment.id, title: assessment.title, type: "assessment" })}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ABA EXERCÍCIOS */}
            <TabsContent value="exercises" className="mt-4">
              {loadingExercises ? (
                <div className="text-center py-12 text-gray-400">Carregando exercícios...</div>
              ) : !exercises || exercises.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Nenhum exercício encontrado</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Crie exercícios em <strong>Trilhas de Aprendizagem</strong> e publique para os alunos
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {exercises.map((exercise: any) => {
                    const stats = completionStats?.[exercise.id];
                    const done = stats?.done ?? 0;
                    const total = stats?.total ?? 0;
                    const pending = stats?.pending ?? 0;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                    <Card key={exercise.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 truncate">{exercise.title}</h3>
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />Publicado
                              </Badge>
                              {exercise.shuffleQuestions ? (
                                <span
                                  title="Anti-cola ativo: questões e alternativas embaralhadas para cada aluno"
                                  className="inline-flex items-center gap-1 text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 rounded-full px-2 py-0.5 cursor-default"
                                >
                                  🎲 Anti-cola
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Hash className="h-3.5 w-3.5" />
                                {exercise.totalQuestions} questões · {exercise.totalQuestions > 0 ? Math.round(exercise.totalPoints / exercise.totalQuestions) : exercise.totalPoints} pts/questão
                              </span>
                              {exercise.maxAttempts && (
                                <span className="flex items-center gap-1">
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  {exercise.maxAttempts} tentativa{exercise.maxAttempts !== 1 ? "s" : ""} máx.
                                </span>
                              )}
                              {exercise.availableFrom && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  Disponível: {formatDate(exercise.availableFrom)}
                                  {exercise.availableTo && ` até ${formatDate(exercise.availableTo)}`}
                                </span>
                              )}
                            </div>
                            {exercise.description && (
                              <p className="text-sm text-gray-400 mt-1 truncate">{exercise.description}</p>
                            )}
                            {/* Contador de conclusão */}
                            <div className="mt-3 flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2.5 py-1 text-xs font-medium text-green-700">
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>{done} fizeram</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-1 text-xs font-medium text-orange-700">
                                <UserX className="h-3.5 w-3.5" />
                                <span>{pending} faltam</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 text-xs font-medium text-gray-600">
                                <Users className="h-3.5 w-3.5" />
                                <span>{total} total</span>
                              </div>
                              {total > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-green-500 rounded-full transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">{pct}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => openEditExercise(exercise)}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => setDeleteTarget({ id: exercise.id, title: exercise.title, type: "exercise" })}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ABA ATIVIDADES DE SALA */}
            <TabsContent value="activities" className="mt-4">
              <ActivitiesTab />
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir{" "}
                <strong>"{deleteTarget?.title}"</strong>?
                {deleteTarget?.type === "assessment"
                  ? " Todas as questões associadas serão removidas permanentemente."
                  : " Todas as tentativas e respostas dos alunos serão removidas permanentemente."}
                {" "}Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de Configurações do Exercício */}
        <Dialog open={editExerciseId !== null} onOpenChange={(open) => { if (!open) { setEditExerciseId(null); setResetConfirmStudent(null); } }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                {editExerciseTitle}
              </DialogTitle>
            </DialogHeader>

            {/* Abas do modal */}
            <div className="flex border-b border-gray-200 mt-2 mb-4">
              <button
                onClick={() => setExerciseModalTab("pending")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  exerciseModalTab === "pending"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  Alunos
                  {pendingStudentsData && pendingStudentsData.pending.length > 0 && (
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {pendingStudentsData.pending.length}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setExerciseModalTab("config")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  exerciseModalTab === "config"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Settings className="h-4 w-4" />
                  Configurações
                </span>
              </button>
            </div>

            {/* ABA: ALUNOS */}
            {exerciseModalTab === "pending" && (
              <div className="space-y-4">
                {loadingPending ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Carregando alunos...</div>
                ) : !pendingStudentsData ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Nenhum dado disponível.</div>
                ) : (
                  <>
                    {/* Resumo */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-orange-600">{pendingStudentsData.pending.length}</p>
                        <p className="text-xs text-orange-700 mt-0.5">Faltam fazer</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">{pendingStudentsData.done.length}</p>
                        <p className="text-xs text-green-700 mt-0.5">Concluíram</p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-gray-600">{pendingStudentsData.total}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Total</p>
                      </div>
                    </div>

                    {/* Lista de pendentes */}
                    {pendingStudentsData.pending.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-1.5">
                          <UserX className="h-4 w-4" />
                          Ainda não fizeram ({pendingStudentsData.pending.length})
                        </h4>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {pendingStudentsData.pending.map((s) => (
                            <div key={s.studentId} className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg">
                              <UserX className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                              <span className="text-sm text-gray-800">{s.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lista de concluídos */}
                    {pendingStudentsData.done.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1.5">
                          <UserCheck className="h-4 w-4" />
                          Já concluíram ({pendingStudentsData.done.length})
                        </h4>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {pendingStudentsData.done.map((s) => (
                            <div key={s.studentId} className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
                              <UserCheck className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                              <span className="text-sm text-gray-800">{s.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {pendingStudentsData.total === 0 && (
                      <div className="text-center py-6 text-gray-400">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nenhum aluno matriculado nesta disciplina.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ABA: CONFIGURAÇÕES */}
            {exerciseModalTab === "config" && (
            <div className="space-y-6">
              {/* Seção: Número máximo de tentativas */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                  Número Máximo de Tentativas
                </h4>
                <p className="text-sm text-gray-500 mb-3">
                  Defina quantas vezes cada aluno pode tentar este exercício. Alterar aqui afeta todos os alunos.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 max-w-xs">
                    <Label htmlFor="maxAttempts" className="text-sm font-medium">Tentativas máximas</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      min={1}
                      max={99}
                      value={editExerciseMaxAttempts}
                      onChange={(e) => setEditExerciseMaxAttempts(e.target.value)}
                      className="mt-1 w-32"
                    />
                  </div>
                  <Button
                    className="mt-6"
                    onClick={handleSaveExerciseMaxAttempts}
                    disabled={updateExerciseMaxAttemptsMutation.isPending}
                  >
                    {updateExerciseMaxAttemptsMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>

              {/* Seção: Resetar tentativas por aluno */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-orange-500" />
                  Resetar Tentativas de Aluno
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  Use esta opção para liberar uma nova tentativa a um aluno específico que teve problemas técnicos (ex: fechou o aplicativo acidentalmente).
                </p>

                {loadingAttempts ? (
                  <div className="text-center py-6 text-gray-400 text-sm">Carregando alunos...</div>
                ) : attemptsError ? (
                  <div className="text-center py-6 text-red-400">
                    <p className="text-sm">Erro ao carregar alunos: {attemptsError.message}</p>
                  </div>
                ) : !studentAttemptsList?.students || studentAttemptsList.students.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Nenhum aluno fez tentativas neste exercício ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {studentAttemptsList.students.map((student) => (
                      <div key={student.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <p className="font-medium text-sm text-gray-800">{student.name}</p>
                          <p className="text-xs text-gray-500">
                            {student.attemptCount} tentativa{student.attemptCount !== 1 ? "s" : ""}
                            {student.status === 'completed' ? (
                              <span className="ml-2 text-green-600 font-medium">· Completou</span>
                            ) : (
                              <span className="ml-2 text-orange-500 font-medium">· Em andamento/Incompleto</span>
                            )}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          onClick={() => setResetConfirmStudent({ studentId: student.studentId, name: student.name })}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          Resetar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Confirmação de reset de tentativas */}
        <AlertDialog open={!!resetConfirmStudent} onOpenChange={(open) => !open && setResetConfirmStudent(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-orange-500" />
                Resetar tentativas
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja resetar todas as tentativas de{" "}
                <strong>{resetConfirmStudent?.name}</strong> neste exercício?
                <br /><br />
                O aluno poderá recomeçar do zero. As respostas anteriores serão removidas permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => {
                  if (resetConfirmStudent && editExerciseId) {
                    resetStudentAttemptsMutation.mutate({
                      exerciseId: editExerciseId,
                      studentId: resetConfirmStudent.studentId,
                    });
                  }
                }}
                disabled={resetStudentAttemptsMutation.isPending}
              >
                {resetStudentAttemptsMutation.isPending ? "Resetando..." : "Resetar Tentativas"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de Visualização de Questões */}
        {/* Modal: Alunos Pendentes de Prova */}
        <Dialog open={viewAssessmentStudentsId !== null} onOpenChange={(open) => { if (!open) { setViewAssessmentStudentsId(null); setViewAssessmentStudentsTitle(""); } }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Alunos — {viewAssessmentStudentsTitle}
              </DialogTitle>
            </DialogHeader>
            {loadingAssessmentStudents ? (
              <div className="text-center py-8 text-gray-400">Carregando alunos...</div>
            ) : !assessmentStudentsData ? (
              <div className="text-center py-8 text-gray-400">Nenhum dado encontrado.</div>
            ) : (
              <div className="space-y-4">
                {/* Resumo */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">{assessmentStudentsData.pending.length}</p>
                    <p className="text-xs text-orange-700 mt-1">Faltam fazer</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{assessmentStudentsData.done.length}</p>
                    <p className="text-xs text-green-700 mt-1">Concluíram</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{assessmentStudentsData.total}</p>
                    <p className="text-xs text-blue-700 mt-1">Total</p>
                  </div>
                </div>
                {/* Listas lado a lado */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Pendentes */}
                  <div>
                    <h4 className="text-sm font-semibold text-orange-700 flex items-center gap-1.5 mb-2">
                      <UserX className="h-4 w-4" /> Faltam fazer ({assessmentStudentsData.pending.length})
                    </h4>
                    <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                      {assessmentStudentsData.pending.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2 text-center">Todos já fizeram!</p>
                      ) : (
                        assessmentStudentsData.pending.map((s: any) => (
                          <div key={s.studentId} className="flex items-center gap-2 p-2 bg-orange-50 rounded text-sm">
                            <UserX className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                            <span className="truncate text-gray-700">{s.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  {/* Concluídos */}
                  <div>
                    <h4 className="text-sm font-semibold text-green-700 flex items-center gap-1.5 mb-2">
                      <UserCheck className="h-4 w-4" /> Concluíram ({assessmentStudentsData.done.length})
                    </h4>
                    <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                      {assessmentStudentsData.done.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2 text-center">Nenhum ainda.</p>
                      ) : (
                        assessmentStudentsData.done.map((s: any) => (
                          <div key={s.studentId} className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                            <UserCheck className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            <span className="truncate text-gray-700">{s.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={viewQuestionsId !== null} onOpenChange={(open) => !open && setViewQuestionsId(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5 text-blue-600" />
                Questões: {viewQuestionsTitle}
              </DialogTitle>
            </DialogHeader>

            {loadingQuestions ? (
              <div className="text-center py-8 text-gray-400">Carregando questões...</div>
            ) : !assessmentQuestions || assessmentQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma questão encontrada para esta prova.</p>
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                <p className="text-sm text-gray-500">{assessmentQuestions.length} questão(ões) no total</p>
                {assessmentQuestions.map((q: any, idx: number) => {
                  const isExpanded = expandedQuestion === idx;
                  const statement = q.statement || q.questionText || "";
                  const options = [];
                  if (q.optionA) options.push({ label: "A", text: q.optionA });
                  if (q.optionB) options.push({ label: "B", text: q.optionB });
                  if (q.optionC) options.push({ label: "C", text: q.optionC });
                  if (q.optionD) options.push({ label: "D", text: q.optionD });
                  if (q.optionE) options.push({ label: "E", text: q.optionE });
                  let parsedOptions: { label: string; text: string }[] = options;
                  if (options.length === 0 && q.options) {
                    try {
                      const parsed = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                      if (Array.isArray(parsed)) {
                        parsedOptions = parsed.map((o: string, i: number) => ({
                          label: String.fromCharCode(65 + i),
                          text: o,
                        }));
                      }
                    } catch {}
                  }

                  return (
                    <Card key={q.id || idx} className="border border-gray-200">
                      <CardContent className="p-0">
                        <button
                          className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">
                              {q.questionNumber || idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 line-clamp-2">{statement}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-gray-400">{getQuestionTypeLabel(q.questionType || "multiple_choice")}</span>
                                {getDifficultyBadge(q.difficulty || "medium")}
                                <span className="text-xs text-gray-400">{q.points || 1} pt(s)</span>
                              </div>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                            {q.context && (
                              <div className="bg-blue-50 rounded p-3 text-sm text-blue-800">
                                <strong>Contexto:</strong> {q.context}
                              </div>
                            )}
                            {parsedOptions.length > 0 && (
                              <div className="space-y-1.5">
                                {parsedOptions.map((opt) => (
                                  <div
                                    key={opt.label}
                                    className={`flex items-start gap-2 p-2 rounded text-sm ${
                                      q.correctAnswer === opt.label
                                        ? "bg-green-50 border border-green-200 text-green-800"
                                        : "bg-gray-50 text-gray-700"
                                    }`}
                                  >
                                    <span className={`font-bold flex-shrink-0 ${q.correctAnswer === opt.label ? "text-green-700" : "text-gray-500"}`}>
                                      {opt.label})
                                    </span>
                                    <span>{opt.text}</span>
                                    {q.correctAnswer === opt.label && (
                                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 ml-auto" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {parsedOptions.length === 0 && q.correctAnswer && (
                              <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                                <strong>Gabarito:</strong> {q.correctAnswer}
                              </div>
                            )}
                            {(q.answerExplanation || q.explanation) && (
                              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
                                <strong>Explicação:</strong> {q.answerExplanation || q.explanation}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </PageWrapper>
    </>
  );
}
