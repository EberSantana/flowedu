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
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AssessmentsManager() {
  const { user } = useAuth();
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string; type: "assessment" | "exercise" } | null>(null);

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
      toast.success(vars.status === "published" ? "Prova publicada!" : "Prova despublicada!");
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <PageWrapper>
        <div className="p-6 space-y-6">
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="h-7 w-7 text-blue-600" />
                Banco de Provas e Exercícios
              </h1>
              <p className="text-gray-500 mt-1">Gerencie todas as suas provas e exercícios publicados</p>
            </div>
            {/* Filtro por disciplina */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
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
                          <div className="flex items-center gap-2 shrink-0">
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
      </PageWrapper>
    </div>
  );
}
