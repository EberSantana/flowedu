import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ClipboardList, Plus, Pencil, Trash2, ArrowLeft, Search, X, Calendar, FileText, Users, Download, MessageSquare, Star } from "lucide-react";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function ActivitiesPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [viewingSubmissions, setViewingSubmissions] = useState<any>(null);
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [exportingActivity, setExportingActivity] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subjectId: "",
    classId: "",
    dueDate: "",
    maxScore: "10",
    status: "published" as "draft" | "published",
  });

  // Grading form
  const [gradeData, setGradeData] = useState({ score: "", feedback: "" });

  const utils = trpc.useUtils();

  // Queries
  const { data: activitiesData, isLoading } = trpc.activities.listByProfessor.useQuery(
    {
      subjectId: filterSubject !== "all" ? Number(filterSubject) : undefined,
      classId: filterClass !== "all" ? Number(filterClass) : undefined,
    }
  );
  const { data: subjectsList } = trpc.subjects.list.useQuery();
  const { data: classesList } = trpc.classes.list.useQuery();

  // Submissions query (only when viewing)
  const { data: submissionsData } = trpc.activities.getSubmissions.useQuery(
    { activityId: viewingSubmissions?.id ?? 0 },
    { enabled: !!viewingSubmissions }
  );

  // Mutations
  const createMutation = trpc.activities.create.useMutation({
    onSuccess: () => {
      toast.success("Atividade criada com sucesso!");
      setIsCreateOpen(false);
      resetForm();
      utils.activities.listByProfessor.invalidate();
    },
    onError: (err) => toast.error("Erro ao criar atividade: " + err.message),
  });

  const updateMutation = trpc.activities.update.useMutation({
    onSuccess: () => {
      toast.success("Atividade atualizada com sucesso!");
      setEditingActivity(null);
      resetForm();
      utils.activities.listByProfessor.invalidate();
    },
    onError: (err) => toast.error("Erro ao atualizar: " + err.message),
  });

  const deleteMutation = trpc.activities.delete.useMutation({
    onSuccess: () => {
      toast.success("Atividade excluída!");
      utils.activities.listByProfessor.invalidate();
    },
    onError: (err) => toast.error("Erro ao excluir: " + err.message),
  });

  const gradeMutation = trpc.activities.gradeSubmission.useMutation({
    onSuccess: () => {
      toast.success("Avaliação salva com sucesso!");
      setGradingSubmission(null);
      setGradeData({ score: "", feedback: "" });
      utils.activities.getSubmissions.invalidate({ activityId: viewingSubmissions?.id ?? 0 });
      utils.activities.listByProfessor.invalidate();
    },
    onError: (err) => toast.error("Erro ao avaliar: " + err.message),
  });

  // Helpers
  const resetForm = () => {
    setFormData({ title: "", description: "", subjectId: "", classId: "", dueDate: "", maxScore: "10", status: "published" });
  };

  const openEdit = (activity: any) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description || "",
      subjectId: activity.subjectId ? String(activity.subjectId) : "",
      classId: activity.classId ? String(activity.classId) : "",
      dueDate: activity.dueDate ? new Date(activity.dueDate).toISOString().slice(0, 16) : "",
      maxScore: String(activity.maxScore),
      status: activity.status,
    });
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error("O título é obrigatório!");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      subjectId: formData.subjectId ? Number(formData.subjectId) : undefined,
      classId: formData.classId ? Number(formData.classId) : undefined,
      dueDate: formData.dueDate || undefined,
      maxScore: Number(formData.maxScore) || 10,
      status: formData.status,
    };

    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleGrade = () => {
    if (!gradeData.score) {
      toast.error("Informe a nota!");
      return;
    }
    gradeMutation.mutate({
      submissionId: gradingSubmission.id,
      score: Number(gradeData.score),
      feedback: gradeData.feedback || undefined,
    });
  };

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (!activitiesData) return [];
    if (!searchTerm) return activitiesData as any[];
    const term = searchTerm.toLowerCase();
    return (activitiesData as any[]).filter((a: any) =>
      a.title.toLowerCase().includes(term) ||
      (a.description && a.description.toLowerCase().includes(term))
    );
  }, [activitiesData, searchTerm]);

  // Subject/Class name helpers
  const getSubjectName = (id: number | null) => {
    if (!id || !subjectsList) return null;
    const s = (subjectsList as any[]).find((s: any) => s.id === id);
    return s ? s.name : null;
  };

  const getClassName = (id: number | null) => {
    if (!id || !classesList) return null;
    const c = (classesList as any[]).find((c: any) => c.id === id);
    return c ? c.name : null;
  };

  const getSubjectColor = (id: number | null) => {
    if (!id || !subjectsList) return "#6b7280";
    const s = (subjectsList as any[]).find((s: any) => s.id === id);
    return s?.color || "#6b7280";
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Sem prazo";
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const isOverdue = (date: string | Date | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  // Export query
  const { data: exportData, isFetching: isFetchingExport } = trpc.activities.exportSubmissions.useQuery(
    { activityId: exportingActivity?.id ?? 0 },
    { enabled: !!exportingActivity }
  );

  const handleExportExcel = (activity: any) => {
    setExportingActivity(activity);
  };

  // useEffect to generate and download Excel when data arrives
  useEffect(() => {
    if (!exportData || !exportingActivity || isFetchingExport) return;
    import('xlsx').then((XLSX) => {
      const rows = (exportData as any).rows;
      const wsData = [
        ['Nome do Aluno', 'Matrícula', 'Status', 'Data de Envio', 'Nota', 'Feedback'],
        ...rows.map((r: any) => [r.nome, r.matricula, r.status, r.dataEnvio, r.nota, r.feedback]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 40 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Submissões');
      XLSX.writeFile(wb, `submissoes-${(exportData as any).activityTitle.replace(/[^a-zA-Z0-9]/g, '-')}.xlsx`);
      toast.success('Excel exportado com sucesso!');
    }).catch(() => toast.error('Erro ao gerar Excel'));
    setExportingActivity(null);
  }, [exportData, exportingActivity, isFetchingExport]);

  const isDialogOpen = isCreateOpen || !!editingActivity;

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4">
          {/* Botão Voltar */}
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>

          <Breadcrumb items={[{ label: "Gestão Acadêmica" }, { label: "Atividades em Sala" }]} />

          {/* Header */}
          <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <ClipboardList className="w-8 h-8 text-primary" />
                Atividades em Sala
              </h1>
              <p className="text-gray-600 mt-1">
                Crie atividades, receba submissões e avalie seus alunos
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button
                onClick={() => { resetForm(); setIsCreateOpen(true); }}
                size="lg"
                className="w-full sm:w-auto min-h-[44px]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Atividade
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar atividades por título ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Disciplinas</SelectItem>
                {(subjectsList as any[] || []).map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Turmas</SelectItem>
                {(classesList as any[] || []).map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {searchTerm && (
            <p className="text-sm text-muted-foreground mb-4">
              {filteredActivities.length} resultado{filteredActivities.length !== 1 ? "s" : ""} encontrado{filteredActivities.length !== 1 ? "s" : ""}
            </p>
          )}

          {/* Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white shadow-md animate-pulse">
                  <CardHeader className="pb-3"><div className="h-6 bg-gray-200 rounded w-3/4" /><div className="h-4 bg-gray-100 rounded w-1/2 mt-2" /></CardHeader>
                  <CardContent><div className="h-20 bg-gray-100 rounded" /></CardContent>
                </Card>
              ))}
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredActivities.map((activity: any) => {
                const subjectName = getSubjectName(activity.subjectId);
                const className_ = getClassName(activity.classId);
                const subjectColor = getSubjectColor(activity.subjectId);
                const overdue = isOverdue(activity.dueDate);

                // Prazo vencido com alunos pendentes
                const totalStudents = (activity as any).totalStudents ?? 0;
                const pendingStudents = totalStudents - (activity.submissionCount ?? 0);
                const overdueWithPending = overdue && pendingStudents > 0;

                return (
                  <Card key={activity.id} className={`shadow-md hover:shadow-lg transition-all duration-200 flex flex-col h-full ${
                    overdueWithPending
                      ? 'bg-red-50 border-2 border-red-300'
                      : overdue
                      ? 'bg-amber-50 border border-amber-200'
                      : 'bg-white'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: subjectColor }} />
                          <div className="min-w-0">
                            <h3 className="font-bold text-lg text-gray-900 truncate">{activity.title}</h3>
                            {subjectName && <p className="text-sm text-gray-500">Disciplina: {subjectName}</p>}
                            {className_ && <p className="text-sm text-gray-500">Turma: {className_}</p>}
                          </div>
                        </div>
                        <Badge className={`flex-shrink-0 ${
                          (activity.submissionCount ?? 0) > 0
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-orange-100 text-orange-700 border-orange-200'
                        }`}>
                          <Users className="w-3 h-3 mr-1" />
                          {activity.submissionCount ?? 0}{(activity as any).totalStudents > 0 ? `/${(activity as any).totalStudents}` : ''} enviaram
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 gap-3">
                      {activity.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {activity.dueDate ? (
                            <span className={overdue ? "text-red-600 font-medium" : ""}>
                              {formatDate(activity.dueDate)}
                              {overdue && " (Vencida)"}
                            </span>
                          ) : "Sem prazo"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5" />
                          Nota máx: {activity.maxScore}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={activity.status === "published" ? "default" : "secondary"}>
                          {activity.status === "published" ? "Publicada" : "Rascunho"}
                        </Badge>
                      </div>

                      {/* Alerta de prazo vencido com pendentes */}
                      {overdueWithPending && (
                        <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-100 rounded px-2 py-1">
                          <span className="font-semibold">⚠️ {pendingStudents} aluno{pendingStudents !== 1 ? 's' : ''} ainda não enviou!</span>
                        </div>
                      )}

                      {/* Action Buttons - Padrão FlowEdu */}
                      <div className="flex flex-col gap-2 mt-auto pt-3">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setViewingSubmissions(activity)}
                          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white"
                        >
                          <FileText className="mr-2 h-3 w-3" />
                          Ver Submissões ({activity.submissionCount ?? 0}{(activity as any).totalStudents > 0 ? `/${(activity as any).totalStudents}` : ''})
                        </Button>

                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleExportExcel(activity)}
                            disabled={exportingActivity?.id === activity.id && isFetchingExport}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3"
                            title="Exportar lista de submissões em Excel"
                          >
                            {exportingActivity?.id === activity.id && isFetchingExport
                              ? <span className="animate-spin">&#8987;</span>
                              : <Download className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openEdit(activity)}
                            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
                          >
                            <Pencil className="mr-2 h-3 w-3" />
                            Editar
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja excluir esta atividade?")) {
                                deleteMutation.mutate({ id: activity.id });
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-3"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="Nenhuma atividade encontrada"
              description={searchTerm ? "Tente buscar com outros termos" : "Crie sua primeira atividade clicando no botão acima"}
            />
          )}
        </div>

        {/* ── Dialog: Criar / Editar Atividade ────────────────────────── */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setEditingActivity(null); resetForm(); } }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingActivity ? "Editar Atividade" : "Nova Atividade"}</DialogTitle>
              <DialogDescription>
                {editingActivity ? "Atualize os dados da atividade" : "Preencha os dados para criar uma nova atividade"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Trabalho sobre Redes de Computadores" />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descreva a atividade, instruções, critérios de avaliação..." rows={4} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Disciplina</Label>
                  <Select value={formData.subjectId} onValueChange={(v) => setFormData({ ...formData, subjectId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {(subjectsList as any[] || []).map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Turma</Label>
                  <Select value={formData.classId} onValueChange={(v) => setFormData({ ...formData, classId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {(classesList as any[] || []).map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Prazo de Entrega</Label>
                  <Input id="dueDate" type="datetime-local" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="maxScore">Nota Máxima</Label>
                  <Input id="maxScore" type="number" min="0" max="1000" value={formData.maxScore} onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as "draft" | "published" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Publicada (visível para alunos)</SelectItem>
                    <SelectItem value="draft">Rascunho (não visível)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditingActivity(null); resetForm(); }}>
                Cancelar
              </Button>
              <LoadingButton
                loading={createMutation.isPending || updateMutation.isPending}
                onClick={handleSave}
              >
                {editingActivity ? "Salvar Alterações" : "Criar Atividade"}
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Dialog: Ver Submissões ────────────────────────────────── */}
        <Dialog open={!!viewingSubmissions} onOpenChange={(open) => { if (!open) setViewingSubmissions(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submissões: {viewingSubmissions?.title}</DialogTitle>
              <DialogDescription>
                Nota máxima: {viewingSubmissions?.maxScore} | {(submissionsData as any)?.submissions?.length ?? 0} submissão(ões)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              {!submissionsData || !(submissionsData as any)?.submissions?.length ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma submissão recebida ainda</p>
                </div>
              ) : (
                ((submissionsData as any)?.submissions ?? []).map((sub: any) => (
                  <Card key={sub.id} className="bg-white border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{sub.studentName || `Aluno #${sub.studentId}`}</p>
                          <p className="text-sm text-gray-500">
                            Enviado em: {formatDate(sub.submittedAt)}
                          </p>
                          {sub.fileUrl && (
                            <a
                              href={sub.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {sub.fileName || "Baixar arquivo"}
                            </a>
                          )}
                          {sub.score !== null && sub.score !== undefined && (
                            <div className="mt-2 p-2 bg-emerald-50 rounded border border-emerald-200">
                              <p className="text-sm font-medium text-emerald-700">
                                Nota: {sub.score}/{viewingSubmissions?.maxScore}
                              </p>
                              {sub.feedback && (
                                <p className="text-sm text-gray-600 mt-1">Feedback: {sub.feedback}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setGradingSubmission(sub);
                            setGradeData({
                              score: sub.score !== null && sub.score !== undefined ? String(sub.score) : "",
                              feedback: sub.feedback || "",
                            });
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <MessageSquare className="mr-1 h-3 w-3" />
                          {sub.score !== null ? "Reavaliar" : "Avaliar"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Dialog: Avaliar Submissão ─────────────────────────────── */}
        <Dialog open={!!gradingSubmission} onOpenChange={(open) => { if (!open) { setGradingSubmission(null); setGradeData({ score: "", feedback: "" }); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Avaliar Submissão</DialogTitle>
              <DialogDescription>
                Aluno: {gradingSubmission?.studentName || `#${gradingSubmission?.studentId}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="score">Nota (máx: {viewingSubmissions?.maxScore})</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={viewingSubmissions?.maxScore || 10}
                  step="0.1"
                  value={gradeData.score}
                  onChange={(e) => setGradeData({ ...gradeData, score: e.target.value })}
                  placeholder="Ex: 8.5"
                />
              </div>
              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                  placeholder="Escreva seu feedback para o aluno..."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setGradingSubmission(null); setGradeData({ score: "", feedback: "" }); }}>
                Cancelar
              </Button>
              <LoadingButton loading={gradeMutation.isPending} onClick={handleGrade} className="bg-purple-600 hover:bg-purple-700 text-white">
                Salvar Avaliação
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageWrapper>
    </>
  );
}
