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
} from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
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

  const utils = trpc.useUtils();

  // Buscar disciplinas
  const { data: subjects } = trpc.subjects.list.useQuery();

  // Buscar provas do professor
  const { data: assessments, isLoading: loadingAssessments } = trpc.learningPath.getTeacherAssessments.useQuery(
    { subjectId: subjectFilter !== "all" ? parseInt(subjectFilter) : undefined },
    { enabled: !!user }
  );

  // Buscar exercícios do professor
  const { data: exercises, isLoading: loadingExercises } = trpc.teacherExercises.list.useQuery(
    { subjectId: subjectFilter !== "all" ? parseInt(subjectFilter) : undefined },
    { enabled: !!user }
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
                  {subjects?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-3 gap-3">
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
            <TabsList className="grid w-full grid-cols-2 max-w-sm">
              <TabsTrigger value="assessments" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Provas ({assessments?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="exercises" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Exercícios ({exercises?.length ?? 0})
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
                      Crie provas em <strong>Trilhas de Aprendizagem</strong> e clique em "Publicar para Alunos"
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {assessments.map((assessment: any) => (
                    <Card key={assessment.id} className="border border-gray-200 hover:border-blue-200 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 truncate">{assessment.title}</h3>
                              {getStatusBadge(assessment.status)}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                              {assessment.subjectName && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3.5 w-3.5" />
                                  {assessment.subjectName}
                                </span>
                              )}
                              {assessment.className && (
                                <span className="flex items-center gap-1">
                                  <BookOpen className="h-3.5 w-3.5" />
                                  {assessment.className}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Hash className="h-3.5 w-3.5" />
                                {assessment.totalQuestions} questões · {assessment.totalPoints} pts
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Criada em {formatDate(assessment.createdAt)}
                              </span>
                              {assessment.applicationDate && (
                                <span className="flex items-center gap-1 text-blue-600">
                                  Aplicação: {formatDate(assessment.applicationDate)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {/* Botão Ver Questões */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-700 border-blue-200 hover:bg-blue-50"
                              onClick={() => {
                                setViewQuestionsId(assessment.id);
                                setViewQuestionsTitle(assessment.title);
                                setExpandedQuestion(null);
                              }}
                            >
                              <ListOrdered className="h-4 w-4 mr-1" />
                              Ver Questões
                            </Button>
                            {assessment.status === "published" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-yellow-700 border-yellow-200 hover:bg-yellow-50"
                                onClick={() => toggleStatusMutation.mutate({ assessmentId: assessment.id, status: "draft" })}
                                disabled={toggleStatusMutation.isPending}
                              >
                                <EyeOff className="h-4 w-4 mr-1" />
                                Despublicar
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-700 border-green-200 hover:bg-green-50"
                                onClick={() => toggleStatusMutation.mutate({ assessmentId: assessment.id, status: "published" })}
                                disabled={toggleStatusMutation.isPending}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Publicar
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
                  {exercises.map((exercise: any) => (
                    <Card key={exercise.id} className="border border-gray-200 hover:border-blue-200 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 truncate">{exercise.title}</h3>
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />Publicado
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Hash className="h-3.5 w-3.5" />
                                {exercise.totalQuestions} questões · {exercise.totalPoints} pts
                              </span>
                              {exercise.maxAttempts && (
                                <span>{exercise.maxAttempts} tentativas máx.</span>
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
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
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
                  ))}
                </div>
              )}
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

        {/* Modal de Visualização de Questões */}
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
                  // Fallback: parse options JSON if available
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
                            {/* Contexto */}
                            {q.context && (
                              <div className="bg-blue-50 rounded p-3 text-sm text-blue-800">
                                <strong>Contexto:</strong> {q.context}
                              </div>
                            )}
                            {/* Alternativas */}
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
                            {/* Gabarito para questões sem alternativas */}
                            {parsedOptions.length === 0 && q.correctAnswer && (
                              <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                                <strong>Gabarito:</strong> {q.correctAnswer}
                              </div>
                            )}
                            {/* Explicação */}
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
