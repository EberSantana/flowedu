import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, FileText, Users, Clock, CheckCircle, Eye, Pencil, Trash2, Star, Download } from "lucide-react";

type Activity = {
  id: number;
  title: string;
  description: string | null;
  subjectId: number | null;
  classId: number | null;
  dueDate: string | null;
  maxScore: number;
  status: "draft" | "published" | "closed";
  createdAt: string;
  subjectName?: string | null;
  className?: string | null;
  submissionCount?: number;
  gradedCount?: number;
};

type Submission = {
  id: number;
  studentId: number;
  studentName: string;
  fileUrl: string;
  fileName: string;
  fileMimeType: string;
  fileSizeBytes: number;
  comment: string | null;
  status: "submitted" | "graded" | "returned";
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
};

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    subjectId: "" as string,
    classId: "" as string,
    dueDate: "",
    maxScore: "10",
    status: "published" as "draft" | "published",
  });

  const utils = trpc.useUtils();

  // Queries
  const { data: activities = [], isLoading } = trpc.activities.listByProfessor.useQuery(
    filterSubject !== "all" ? { subjectId: parseInt(filterSubject) } : undefined
  );
  const { data: subjects = [] } = trpc.subjects.list.useQuery();
  const { data: classes = [] } = trpc.classes.list.useQuery();
  const { data: submissions = [], isLoading: loadingSubmissions } = trpc.activities.getSubmissions.useQuery(
    { activityId: selectedActivity?.id ?? 0 },
    { enabled: showSubmissions && !!selectedActivity }
  );

  // Mutations
  const createMutation = trpc.activities.create.useMutation({
    onSuccess: () => {
      toast.success("Atividade criada com sucesso!");
      utils.activities.listByProfessor.invalidate();
      setShowCreate(false);
      resetForm();
    },
    onError: (e: any) => toast.error("Erro ao criar atividade: " + e.message),
  });

  const gradeMutation = trpc.activities.gradeSubmission.useMutation({
    onSuccess: () => {
      toast.success("Avaliação salva com sucesso!");
      utils.activities.getSubmissions.invalidate({ activityId: selectedActivity?.id ?? 0 });
      utils.activities.listByProfessor.invalidate();
      setGradingSubmission(null);
    },
    onError: (e: any) => toast.error("Erro ao salvar avaliação: " + e.message),
  });

  const deleteMutation = trpc.activities.delete.useMutation({
    onSuccess: () => {
      toast.success("Atividade excluída!");
      utils.activities.listByProfessor.invalidate();
    },
    onError: (e: any) => toast.error("Erro ao excluir: " + e.message),
  });

  const updateMutation = trpc.activities.update.useMutation({
    onSuccess: () => {
      toast.success("Atividade atualizada!");
      utils.activities.listByProfessor.invalidate();
    },
    onError: (e: any) => toast.error("Erro ao atualizar: " + e.message),
  });

  function resetForm() {
    setForm({ title: "", description: "", subjectId: "", classId: "", dueDate: "", maxScore: "10", status: "published" });
  }

  function handleCreate() {
    if (!form.title.trim()) return toast.error("Título é obrigatório");
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      subjectId: form.subjectId ? parseInt(form.subjectId) : undefined,
      classId: form.classId ? parseInt(form.classId) : undefined,
      dueDate: form.dueDate || undefined,
      maxScore: parseFloat(form.maxScore) || 10,
      status: form.status,
    });
  }

  function handleGrade() {
    if (!gradingSubmission) return;
    const score = parseFloat(gradeScore);
    if (isNaN(score) || score < 0) return toast.error("Nota inválida");
    gradeMutation.mutate({
      submissionId: gradingSubmission.id,
      score,
      feedback: gradeFeedback || undefined,
    });
  }

  function openGrading(sub: Submission) {
    setGradingSubmission(sub);
    setGradeScore(sub.score !== null ? String(sub.score) : "");
    setGradeFeedback(sub.feedback || "");
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function getFileIcon(mime: string) {
    if (mime.includes("pdf")) return "📄";
    if (mime.includes("word") || mime.includes("document")) return "📝";
    if (mime.includes("presentation") || mime.includes("powerpoint")) return "📊";
    return "📎";
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    published: "bg-green-100 text-green-700",
    closed: "bg-red-100 text-red-700",
  };

  const statusLabels: Record<string, string> = {
    draft: "Rascunho",
    published: "Publicada",
    closed: "Encerrada",
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Atividades em Sala</h1>
            <p className="text-gray-500 text-sm mt-1">Crie e gerencie atividades para seus alunos</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Atividade
          </Button>
        </div>

        {/* Filtro por disciplina */}
        <div className="flex gap-3 mb-6">
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Filtrar por disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as disciplinas</SelectItem>
              {subjects.map((s: any) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de atividades */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Carregando atividades...</div>
        ) : (activities as any[]).length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma atividade criada ainda</p>
            <p className="text-gray-400 text-sm mt-1">Clique em "Nova Atividade" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(activities as unknown as Activity[]).map((activity) => (
              <div key={activity.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[activity.status]}`}>
                        {statusLabels[activity.status]}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-gray-500 text-sm mb-2 line-clamp-2">{activity.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {activity.subjectName && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {activity.subjectName}
                        </span>
                      )}
                      {activity.className && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {activity.className}
                        </span>
                      )}
                      {activity.dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Prazo: {new Date(activity.dueDate).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Nota máx.: {activity.maxScore}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Contador de submissões */}
                    <button
                      onClick={() => { setSelectedActivity(activity); setShowSubmissions(true); }}
                      className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{activity.gradedCount ?? 0}/{activity.submissionCount ?? 0} avaliadas</span>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectedActivity(activity); setShowSubmissions(true); }}
                      title="Ver submissões"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newStatus = activity.status === "published" ? "closed" : "published";
                        updateMutation.mutate({ id: activity.id, status: newStatus });
                      }}
                      title={activity.status === "published" ? "Encerrar atividade" : "Reabrir atividade"}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Excluir esta atividade e todas as submissões?")) {
                          deleteMutation.mutate({ id: activity.id });
                        }
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Excluir atividade"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Criar Atividade */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Atividade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Título *</label>
              <Input
                placeholder="Ex: Trabalho sobre Redes de Computadores"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Descrição / Enunciado</label>
              <Textarea
                placeholder="Descreva a atividade, objetivos e instruções..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Disciplina</label>
                <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {subjects.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Turma</label>
                <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {classes.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Prazo de entrega</label>
                <Input
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nota máxima</label>
                <Input
                  type="number"
                  min="0"
                  max="1000"
                  step="0.5"
                  value={form.maxScore}
                  onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Publicar imediatamente</SelectItem>
                  <SelectItem value="draft">Salvar como rascunho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar Atividade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Ver Submissões */}
      <Dialog open={showSubmissions} onOpenChange={setShowSubmissions}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Submissões — {selectedActivity?.title}
            </DialogTitle>
          </DialogHeader>
          {loadingSubmissions ? (
            <div className="text-center py-8 text-gray-400">Carregando submissões...</div>
          ) : (submissions as any[]).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Nenhum aluno enviou atividade ainda</p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {(submissions as Submission[]).map((sub) => (
                <div key={sub.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{sub.studentName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          sub.status === "graded" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {sub.status === "graded" ? "Avaliado" : "Aguardando avaliação"}
                        </span>
                        {sub.score !== null && (
                          <span className="text-sm font-semibold text-blue-700">
                            {sub.score}/{selectedActivity?.maxScore}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <span>{getFileIcon(sub.fileMimeType)}</span>
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {sub.fileName}
                          <Download className="w-3 h-3" />
                        </a>
                        <span className="text-gray-400">({formatFileSize(sub.fileSizeBytes)})</span>
                      </div>
                      {sub.comment && (
                        <p className="text-sm text-gray-600 bg-gray-50 rounded p-2 mb-2">
                          <span className="font-medium">Comentário do aluno:</span> {sub.comment}
                        </p>
                      )}
                      {sub.feedback && (
                        <p className="text-sm text-green-700 bg-green-50 rounded p-2">
                          <span className="font-medium">Seu feedback:</span> {sub.feedback}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Enviado em {new Date(sub.submittedAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={sub.status === "graded" ? "outline" : "default"}
                      onClick={() => openGrading(sub)}
                    >
                      {sub.status === "graded" ? "Editar nota" : "Avaliar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Avaliar Submissão */}
      <Dialog open={!!gradingSubmission} onOpenChange={(open) => !open && setGradingSubmission(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Avaliar Atividade — {gradingSubmission?.studentName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Nota (máximo: {selectedActivity?.maxScore})
              </label>
              <Input
                type="number"
                min="0"
                max={selectedActivity?.maxScore}
                step="0.5"
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                placeholder="Ex: 8.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Feedback para o aluno
              </label>
              <Textarea
                placeholder="Escreva um comentário sobre o trabalho do aluno..."
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradingSubmission(null)}>Cancelar</Button>
            <Button onClick={handleGrade} disabled={gradeMutation.isPending}>
              {gradeMutation.isPending ? "Salvando..." : "Salvar Avaliação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
