import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ClipboardList, Plus, Pencil, Trash2, Search, X,
  Calendar, FileText, Users, Download, MessageSquare, Star,
} from "lucide-react";

export default function ActivitiesTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [viewingSubmissions, setViewingSubmissions] = useState<any>(null);
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [exportingActivity, setExportingActivity] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);

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
  const { data: activitiesData, isLoading } = trpc.activities.listByProfessor.useQuery({
    subjectId: filterSubject !== "all" ? Number(filterSubject) : undefined,
    classId: filterClass !== "all" ? Number(filterClass) : undefined,
  });
  const { data: subjectsList } = trpc.subjects.list.useQuery();
  const { data: classesList } = trpc.classes.list.useQuery();
  const { data: submissionsData } = trpc.activities.getSubmissions.useQuery(
    { activityId: viewingSubmissions?.id ?? 0 },
    { enabled: !!viewingSubmissions }
  );
  const { data: exportData, isFetching: isFetchingExport } = trpc.activities.exportSubmissions.useQuery(
    { activityId: exportingActivity?.id ?? 0 },
    { enabled: !!exportingActivity }
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
      setDeleteConfirm(null);
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
    if (!formData.title.trim()) { toast.error("O título é obrigatório!"); return; }
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
    if (!gradeData.score) { toast.error("Informe a nota!"); return; }
    gradeMutation.mutate({
      submissionId: gradingSubmission.id,
      score: Number(gradeData.score),
      feedback: gradeData.feedback || undefined,
    });
  };
  const getSubjectName = (id: number | null) => {
    if (!id || !subjectsList) return null;
    return (subjectsList as any[]).find((s: any) => s.id === id)?.name ?? null;
  };
  const getClassName = (id: number | null) => {
    if (!id || !classesList) return null;
    return (classesList as any[]).find((c: any) => c.id === id)?.name ?? null;
  };
  const getSubjectColor = (id: number | null) => {
    if (!id || !subjectsList) return "#6b7280";
    return (subjectsList as any[]).find((s: any) => s.id === id)?.color ?? "#6b7280";
  };
  const formatDate = (date: string | Date | null) => {
    if (!date) return "Sem prazo";
    return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };
  const isOverdue = (date: string | Date | null) => date ? new Date(date) < new Date() : false;

  // Export Excel
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

  const filteredActivities = useMemo(() => {
    if (!activitiesData) return [];
    if (!searchTerm) return activitiesData as any[];
    const term = searchTerm.toLowerCase();
    return (activitiesData as any[]).filter((a: any) =>
      a.title.toLowerCase().includes(term) ||
      (a.description && a.description.toLowerCase().includes(term))
    );
  }, [activitiesData, searchTerm]);

  const isDialogOpen = isCreateOpen || !!editingActivity;

  return (
    <div className="mt-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          size="sm"
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Atividade
        </Button>
        <div className="flex-1 flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar atividade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {(subjectsList as any[] ?? []).map((s: any) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Turma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {(classesList as any[] ?? []).map((c: any) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando atividades...</div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma atividade encontrada</p>
          <p className="text-sm mt-1">Crie sua primeira atividade de sala clicando em Nova Atividade.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredActivities.map((activity: any) => {
            const overdue = isOverdue(activity.dueDate);
            const subjectColor = getSubjectColor(activity.subjectId);
            const subjectName = getSubjectName(activity.subjectId);
            const className_ = getClassName(activity.classId);
            const pendingStudents = Math.max(0, ((activity as any).totalStudents ?? 0) - (activity.submissionCount ?? 0));
            const overdueWithPending = overdue && pendingStudents > 0;
            return (
              <Card key={activity.id} className={`shadow-md transition-all duration-200 flex flex-col h-full ${
                overdueWithPending ? 'bg-red-50 border-2 border-red-300'
                  : overdue ? 'bg-amber-50 border border-amber-200'
                  : 'bg-white'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: subjectColor }} />
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-gray-900 truncate">{activity.title}</h3>
                        {subjectName && <p className="text-xs text-gray-500">Disciplina: {subjectName}</p>}
                        {className_ && <p className="text-xs text-gray-500">Turma: {className_}</p>}
                      </div>
                    </div>
                    <Badge className={`flex-shrink-0 text-xs ${
                      (activity.submissionCount ?? 0) > 0
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-orange-100 text-orange-700 border-orange-200'
                    }`}>
                      <Users className="w-3 h-3 mr-1" />
                      {activity.submissionCount ?? 0}{(activity as any).totalStudents > 0 ? `/${(activity as any).totalStudents}` : ''} enviaram
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-2">
                  {activity.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {activity.dueDate ? (
                        <span className={overdue ? "text-red-600 font-medium" : ""}>
                          {formatDate(activity.dueDate)}{overdue && " (Vencida)"}
                        </span>
                      ) : "Sem prazo"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" />
                      Máx: {activity.maxScore}
                    </span>
                  </div>
                  <Badge variant={activity.status === "published" ? "default" : "secondary"} className="w-fit text-xs">
                    {activity.status === "published" ? "Publicada" : "Rascunho"}
                  </Badge>
                  {overdueWithPending && (
                    <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-100 rounded px-2 py-1">
                      <span className="font-semibold">⚠️ {pendingStudents} aluno{pendingStudents !== 1 ? 's' : ''} não enviou!</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5 mt-auto pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setViewingSubmissions(activity)}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-xs"
                    >
                      <FileText className="mr-1.5 h-3 w-3" />
                      Ver Submissões ({activity.submissionCount ?? 0}{(activity as any).totalStudents > 0 ? `/${(activity as any).totalStudents}` : ''})
                    </Button>
                    <div className="flex gap-1.5">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setExportingActivity(activity)}
                        disabled={exportingActivity?.id === activity.id && isFetchingExport}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 text-xs"
                        title="Exportar Excel"
                      >
                        {exportingActivity?.id === activity.id && isFetchingExport
                          ? <span className="animate-spin">⏳</span>
                          : <Download className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(activity)}
                        className="flex-1 text-xs"
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(activity)}
                        className="text-red-600 border-red-200 hover:bg-red-50 px-2"
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
      )}

      {/* ── Dialog: Criar / Editar Atividade ─────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setEditingActivity(null); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingActivity ? "Editar Atividade" : "Nova Atividade de Sala"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="act-title">Título *</Label>
              <Input id="act-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Redação sobre o tema..." />
            </div>
            <div>
              <Label htmlFor="act-desc">Descrição</Label>
              <Textarea id="act-desc" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Instruções para os alunos..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Disciplina</Label>
                <Select value={formData.subjectId || "none"} onValueChange={(v) => setFormData({ ...formData, subjectId: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {(subjectsList as any[] ?? []).map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Turma</Label>
                <Select value={formData.classId || "none"} onValueChange={(v) => setFormData({ ...formData, classId: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {(classesList as any[] ?? []).map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="act-due">Prazo de entrega</Label>
                <Input id="act-due" type="datetime-local" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="act-score">Nota máxima</Label>
                <Input id="act-score" type="number" min="1" max="100" value={formData.maxScore} onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as "draft" | "published" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Publicada</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditingActivity(null); resetForm(); }}>Cancelar</Button>
            <LoadingButton loading={createMutation.isPending || updateMutation.isPending} onClick={handleSave}>
              {editingActivity ? "Salvar Alterações" : "Criar Atividade"}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Confirmar Exclusão ────────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Atividade</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir "{deleteConfirm?.title}"? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <LoadingButton loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate({ id: deleteConfirm.id })} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Ver Submissões ────────────────────────────────── */}
      <Dialog open={!!viewingSubmissions} onOpenChange={(open) => { if (!open) setViewingSubmissions(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submissões — {viewingSubmissions?.title}</DialogTitle>
            <DialogDescription>
              {(submissionsData as any)?.submissions?.length ?? 0} submissão(ões) recebida(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {!submissionsData || (submissionsData as any)?.submissions?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma submissão recebida ainda</p>
              </div>
            ) : (
              ((submissionsData as any)?.submissions ?? []).map((sub: any) => (
                <Card key={sub.id} className="bg-white border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{sub.studentName || `Aluno #${sub.studentId}`}</p>
                        <p className="text-sm text-gray-500">Enviado em: {formatDate(sub.submittedAt)}</p>
                        {sub.fileUrl && (
                          <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1">
                            <Download className="w-3.5 h-3.5" />
                            {sub.fileName || "Baixar arquivo"}
                          </a>
                        )}
                        {sub.score !== null && sub.score !== undefined && (
                          <div className="mt-2 p-2 bg-emerald-50 rounded border border-emerald-200">
                            <p className="text-sm font-medium text-emerald-700">Nota: {sub.score}/{viewingSubmissions?.maxScore}</p>
                            {sub.feedback && <p className="text-sm text-gray-600 mt-1">Feedback: {sub.feedback}</p>}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => { setGradingSubmission(sub); setGradeData({ score: sub.score !== null && sub.score !== undefined ? String(sub.score) : "", feedback: sub.feedback || "" }); }}
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
            <DialogDescription>Aluno: {gradingSubmission?.studentName || `#${gradingSubmission?.studentId}`}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="grade-score">Nota (máx: {viewingSubmissions?.maxScore})</Label>
              <Input id="grade-score" type="number" min="0" max={viewingSubmissions?.maxScore || 10} step="0.1" value={gradeData.score} onChange={(e) => setGradeData({ ...gradeData, score: e.target.value })} placeholder="Ex: 8.5" />
            </div>
            <div>
              <Label htmlFor="grade-feedback">Feedback</Label>
              <Textarea id="grade-feedback" value={gradeData.feedback} onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })} placeholder="Escreva seu feedback para o aluno..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setGradingSubmission(null); setGradeData({ score: "", feedback: "" }); }}>Cancelar</Button>
            <LoadingButton loading={gradeMutation.isPending} onClick={handleGrade} className="bg-purple-600 hover:bg-purple-700 text-white">
              Salvar Avaliação
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
