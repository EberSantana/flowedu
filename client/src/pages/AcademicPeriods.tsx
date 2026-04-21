import { useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Clock,
  MapPin,
  Bell,
  BellOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const BIMESTRE_LABELS: Record<number, string> = {
  1: "1º Bimestre",
  2: "2º Bimestre",
  3: "3º Bimestre",
  4: "4º Bimestre",
};

const BIMESTRE_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-800 border-blue-200",
  2: "bg-green-100 text-green-800 border-green-200",
  3: "bg-amber-100 text-amber-800 border-amber-200",
  4: "bg-purple-100 text-purple-800 border-purple-200",
};

// Cores do cabeçalho dos cards de bimestre
const BIMESTRE_HEADER_COLORS: Record<number, string> = {
  1: "#3b82f6", // blue-500
  2: "#22c55e", // green-500
  3: "#f59e0b", // amber-500
  4: "#a855f7", // purple-500
};

const BIMESTRE_PROGRESS_COLORS: Record<number, string> = {
  1: "bg-blue-500",
  2: "bg-green-500",
  3: "bg-amber-500",
  4: "bg-purple-500",
};

const BIMESTRE_ICONS: Record<number, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
};

function formatDate(dateStr: string | Date | null | undefined) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(dateStr: string | Date | null | undefined) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Formulário de Período ─────────────────────────────────────────────────
interface PeriodFormData {
  id?: number;
  schoolYear: number;
  bimestre: number;
  startDate: string;
  endDate: string;
  description: string;
  isActive: boolean;
}

function PeriodForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: Partial<PeriodFormData>;
  onSave: (data: PeriodFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const currentYear = new Date().getFullYear();
  // Garantir que datas sejam sempre strings YYYY-MM-DD (podem vir como Date do banco)
  const toDateStr = (v: any): string => {
    if (!v) return "";
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    try { return new Date(v).toISOString().split("T")[0]; } catch { return ""; }
  };
  const [form, setForm] = useState<PeriodFormData>({
    schoolYear: initial?.schoolYear ?? currentYear,
    bimestre: initial?.bimestre ?? 1,
    startDate: toDateStr(initial?.startDate),
    endDate: toDateStr(initial?.endDate),
    description: initial?.description ?? "",
    isActive: initial?.isActive ?? true,
    id: initial?.id,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      toast.error("Preencha as datas de início e término");
      return;
    }
    if (new Date(form.startDate) >= new Date(form.endDate)) {
      toast.error("A data de início deve ser anterior à data de término");
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Ano Letivo</Label>
          <Input
            type="number"
            min={2020}
            max={2099}
            value={form.schoolYear}
            onChange={(e) => setForm((f) => ({ ...f, schoolYear: parseInt(e.target.value) || currentYear }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Bimestre</Label>
          <Select
            value={String(form.bimestre)}
            onValueChange={(v) => setForm((f) => ({ ...f, bimestre: parseInt(v) }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((b) => (
                <SelectItem key={b} value={String(b)}>
                  {BIMESTRE_LABELS[b]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Data de Início</Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Data de Término</Label>
          <Input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Observação (opcional)</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Ex: Inclui recesso de Carnaval..."
          rows={2}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          className="rounded"
        />
        <Label htmlFor="isActive" className="cursor-pointer">Período ativo</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Formulário de Agendamento ─────────────────────────────────────────────
interface ScheduleFormData {
  assessmentId: number;
  academicPeriodId?: number;
  scheduledDate: string;
  location: string;
  notes: string;
  notifyStudents: boolean;
}

function ScheduleForm({
  periods,
  assessments,
  onSave,
  onCancel,
  isSaving,
}: {
  periods: any[];
  assessments: any[];
  onSave: (data: ScheduleFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<ScheduleFormData>({
    assessmentId: 0,
    academicPeriodId: undefined,
    scheduledDate: "",
    location: "",
    notes: "",
    notifyStudents: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assessmentId) {
      toast.error("Selecione uma prova");
      return;
    }
    if (!form.scheduledDate) {
      toast.error("Informe a data e hora de aplicação");
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Prova</Label>
        <Select
          value={form.assessmentId ? String(form.assessmentId) : ""}
          onValueChange={(v) => setForm((f) => ({ ...f, assessmentId: parseInt(v) }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a prova..." />
          </SelectTrigger>
          <SelectContent>
            {assessments.map((a: any) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.title} — {BIMESTRE_LABELS[a.bimestre] ?? `${a.bimestre}º Bim`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Período Letivo (opcional)</Label>
        <Select
          value={form.academicPeriodId ? String(form.academicPeriodId) : "none"}
          onValueChange={(v) => setForm((f) => ({ ...f, academicPeriodId: v === "none" ? undefined : parseInt(v) }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Vincular a um período..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {periods.map((p: any) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {BIMESTRE_LABELS[p.bimestre]} — {p.schoolYear} ({formatDate(p.startDate)} a {formatDate(p.endDate)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Data e Hora de Aplicação</Label>
        <Input
          type="datetime-local"
          value={form.scheduledDate}
          onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Local (opcional)</Label>
        <Input
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          placeholder="Ex: Sala 201, Laboratório de Informática..."
        />
      </div>
      <div className="space-y-1.5">
        <Label>Observações (opcional)</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Instruções adicionais para os alunos..."
          rows={2}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="notifyStudents"
          checked={form.notifyStudents}
          onChange={(e) => setForm((f) => ({ ...f, notifyStudents: e.target.checked }))}
          className="rounded"
        />
        <Label htmlFor="notifyStudents" className="cursor-pointer">
          Notificar alunos sobre o agendamento
        </Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Agendando..." : "Agendar Prova"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Página Principal ──────────────────────────────────────────────────────
export default function AcademicPeriods() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<any>(null);
  const [deletingPeriodId, setDeletingPeriodId] = useState<number | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Queries
  const periodsQuery = trpc.academicPeriods.list.useQuery({ schoolYear: selectedYear });
  const currentPeriodQuery = trpc.academicPeriods.getCurrent.useQuery();
  const schedulesQuery = trpc.assessmentSchedules.list.useQuery({});
  const assessmentsQuery = trpc.learningPath.getTeacherAssessments.useQuery({});

  // Mutations - Períodos
  const savePeriodMutation = trpc.academicPeriods.save.useMutation({
    onSuccess: () => {
      utils.academicPeriods.list.invalidate();
      utils.academicPeriods.getCurrent.invalidate();
      setShowPeriodDialog(false);
      setEditingPeriod(null);
      toast.success("Período salvo com sucesso!");
    },
    onError: (e) => toast.error("Erro ao salvar período", { description: e.message }),
  });

  const deletePeriodMutation = trpc.academicPeriods.delete.useMutation({
    onSuccess: () => {
      utils.academicPeriods.list.invalidate();
      setDeletingPeriodId(null);
      toast.success("Período removido!");
    },
    onError: (e) => toast.error("Erro ao remover período", { description: e.message }),
  });

  // Mutations - Agendamentos
  const createScheduleMutation = trpc.assessmentSchedules.create.useMutation({
    onSuccess: () => {
      utils.assessmentSchedules.list.invalidate();
      setShowScheduleDialog(false);
      toast.success("Prova agendada com sucesso!");
    },
    onError: (e) => toast.error("Erro ao agendar prova", { description: e.message }),
  });

  const deleteScheduleMutation = trpc.assessmentSchedules.delete.useMutation({
    onSuccess: () => {
      utils.assessmentSchedules.list.invalidate();
      setDeletingScheduleId(null);
      toast.success("Agendamento removido!");
    },
    onError: (e) => toast.error("Erro ao remover agendamento", { description: e.message }),
  });

  const periods = periodsQuery.data ?? [];
  const schedules = schedulesQuery.data ?? [];
  const assessments = (assessmentsQuery.data ?? []).filter((a: any) => a.status !== "archived");
  const currentPeriod = currentPeriodQuery.data;

  // Anos disponíveis para seleção
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear - 1; y <= currentYear + 2; y++) years.push(y);
    return years;
  }, [currentYear]);

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-[calc(100vh-120px)] bg-background flex flex-col">
        <div className="container mx-auto py-6 px-4 flex-1">
          {/* Botão Voltar ao Dashboard */}
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>

          <Breadcrumb items={[{ label: "Planejamento" }, { label: "Períodos Letivos" }]} />

          {/* Header com botão de ação à direita */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <CalendarDays className="w-8 h-8 text-primary" />
                Períodos Letivos
              </h1>
              <p className="text-gray-600 mt-1">
                Configure as datas de cada bimestre e agende provas
              </p>
            </div>
          </div>

          {/* Bimestre atual */}
          {currentPeriod && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-primary/5 border-primary/20 mb-4">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <div>
                <span className="font-medium text-sm">Período atual: </span>
                <span className="text-sm">
                  {BIMESTRE_LABELS[currentPeriod.bimestre]} de {currentPeriod.schoolYear} —{" "}
                  {formatDate(currentPeriod.startDate)} até {formatDate(currentPeriod.endDate)}
                </span>
                {currentPeriod.description && (
                  <span className="text-xs text-muted-foreground ml-2">({currentPeriod.description})</span>
                )}
              </div>
            </div>
          )}
          {!currentPeriod && !currentPeriodQuery.isLoading && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-800 mb-4">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">Nenhum bimestre ativo para hoje. Configure os períodos letivos abaixo.</span>
            </div>
          )}

          <Tabs defaultValue="periods">
            <TabsList>
              <TabsTrigger value="periods">Bimestres</TabsTrigger>
              <TabsTrigger value="schedules">Agendamento de Provas</TabsTrigger>
            </TabsList>

            {/* ── Aba Bimestres ── */}
            <TabsContent value="periods" className="space-y-4 pt-4">
              {/* Filtro de ano + botão Novo Período */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">Ano letivo:</Label>
                  <Select
                    value={String(selectedYear)}
                    onValueChange={(v) => setSelectedYear(parseInt(v))}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => {
                    setEditingPeriod(null);
                    setShowPeriodDialog(true);
                  }}
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Período
                </Button>
              </div>

              {periodsQuery.isLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
            ) : periods.length === 0 ? (
              <Card className="bg-white shadow-lg">
                <CardContent className="text-center py-12">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">Nenhum período configurado para {selectedYear}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique em "Novo Período" para definir as datas de cada bimestre.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {periods.map((p: any) => {
                  const start = new Date(p.startDate);
                  const end = new Date(p.endDate);
                  const today = new Date();
                  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                  const elapsedDays = Math.max(0, Math.min(totalDays, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))));
                  const progressPct = Math.round((elapsedDays / totalDays) * 100);
                  const isCurrentPeriod = currentPeriod?.id === p.id;
                  const isPast = end < today;
                  const isFuture = start > today;
                  const headerColor = BIMESTRE_HEADER_COLORS[p.bimestre] ?? "#6b7280";
                  const progressColor = BIMESTRE_PROGRESS_COLORS[p.bimestre] ?? "bg-gray-500";
                  const romanNum = BIMESTRE_ICONS[p.bimestre] ?? String(p.bimestre);

                  return (
                    <Card key={p.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                      {/* Cabeçalho colorido */}
                      <CardHeader style={{ backgroundColor: headerColor }} className="text-white pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium opacity-80 uppercase tracking-wider">Bimestre</div>
                            <CardTitle className="text-2xl font-bold mt-0.5">{romanNum}</CardTitle>
                          </div>
                          <div className="text-right">
                            {!p.isActive ? (
                              <span className="inline-block bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded-full">Inativo</span>
                            ) : isCurrentPeriod ? (
                              <span className="inline-block bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded-full">Em andamento</span>
                            ) : isPast ? (
                              <span className="inline-block bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded-full">Concluído</span>
                            ) : isFuture ? (
                              <span className="inline-block bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded-full">Futuro</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-sm font-medium opacity-90 mt-1">{BIMESTRE_LABELS[p.bimestre]}</div>
                      </CardHeader>

                      <CardContent className="pt-4 space-y-3">
                        {/* Datas */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Início</span>
                            <span className="font-medium">{formatDate(p.startDate)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Término</span>
                            <span className="font-medium">{formatDate(p.endDate)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Duração</span>
                            <span className="font-medium text-muted-foreground">{totalDays} dias</span>
                          </div>
                        </div>

                        {/* Barra de progresso */}
                        {p.isActive && !isFuture && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Progresso</span>
                              <span>{Math.min(100, progressPct)}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${progressColor}`}
                                style={{ width: `${Math.min(100, progressPct)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Observação */}
                        {p.description && (
                          <p className="text-xs text-muted-foreground border-t pt-2 truncate" title={p.description}>
                            {p.description}
                          </p>
                        )}

                        {/* Botões de ação */}
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setEditingPeriod({
                                ...p,
                                startDate: new Date(p.startDate).toISOString().split("T")[0],
                                endDate: new Date(p.endDate).toISOString().split("T")[0],
                              });
                              setShowPeriodDialog(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingPeriodId(p.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            </TabsContent>

            {/* ── Aba Agendamento de Provas ── */}
            <TabsContent value="schedules" className="space-y-4 pt-4">
              {/* Header da aba de agendamentos */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Provas Agendadas</h2>
                <Button
                  onClick={() => setShowScheduleDialog(true)}
                  size="lg"
                  disabled={assessments.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Prova
                </Button>
              </div>

              {assessments.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg bg-muted/10">
                  Nenhuma prova publicada encontrada. Crie e publique provas no Banco de Provas para agendá-las.
                </div>
              )}

              {schedulesQuery.isLoading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
              ) : schedules.length === 0 ? (
                <Card className="bg-white shadow-lg">
                  <CardContent className="text-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium">Nenhuma prova agendada</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Agende provas para notificar seus alunos com antecedência.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white shadow-lg">
                  <CardContent className="p-0">
                  <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prova</TableHead>
                    <TableHead>Bimestre</TableHead>
                    <TableHead>Data de Aplicação</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Notificação</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">
                        {s.assessmentTitle ?? `Prova #${s.assessmentId}`}
                      </TableCell>
                      <TableCell>
                        {s.assessmentBimestre ? (
                          <Badge
                            variant="outline"
                            className={BIMESTRE_COLORS[s.assessmentBimestre] ?? ""}
                          >
                            {BIMESTRE_LABELS[s.assessmentBimestre] ?? `${s.assessmentBimestre}º Bim`}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(s.scheduledDate)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {s.location}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {s.notifiedAt ? (
                          <span className="flex items-center gap-1 text-green-700 text-xs">
                            <Bell className="h-3 w-3" />
                            Enviada
                          </span>
                        ) : s.notifyStudents ? (
                          <span className="flex items-center gap-1 text-amber-700 text-xs">
                            <Bell className="h-3 w-3" />
                            Pendente
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-muted-foreground text-xs">
                            <BellOff className="h-3 w-3" />
                            Desativada
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                        {s.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletingScheduleId(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PageWrapper>

      {/* Dialog: Criar/Editar Período */}
      <Dialog open={showPeriodDialog} onOpenChange={(open) => { if (!open) { setShowPeriodDialog(false); setEditingPeriod(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPeriod ? "Editar Período Letivo" : "Novo Período Letivo"}</DialogTitle>
          </DialogHeader>
          <PeriodForm
            initial={editingPeriod ?? { schoolYear: selectedYear }}
            onSave={(data) => savePeriodMutation.mutate(data)}
            onCancel={() => { setShowPeriodDialog(false); setEditingPeriod(null); }}
            isSaving={savePeriodMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Agendar Prova */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar Prova</DialogTitle>
          </DialogHeader>
          <ScheduleForm
            periods={periods}
            assessments={assessments}
            onSave={(data) =>
              createScheduleMutation.mutate({
                ...data,
                scheduledDate: new Date(data.scheduledDate).toISOString(),
              })
            }
            onCancel={() => setShowScheduleDialog(false)}
            isSaving={createScheduleMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm: Deletar Período */}
      <Dialog open={!!deletingPeriodId} onOpenChange={(open) => { if (!open) setDeletingPeriodId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover Período?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita. Agendamentos vinculados a este período não serão removidos.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPeriodId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deletePeriodMutation.isPending}
              onClick={() => deletingPeriodId && deletePeriodMutation.mutate({ id: deletingPeriodId })}
            >
              {deletePeriodMutation.isPending ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm: Deletar Agendamento */}
      <Dialog open={!!deletingScheduleId} onOpenChange={(open) => { if (!open) setDeletingScheduleId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover Agendamento?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            O agendamento será removido. Os alunos não serão notificados sobre a remoção.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingScheduleId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteScheduleMutation.isPending}
              onClick={() => deletingScheduleId && deleteScheduleMutation.mutate({ id: deletingScheduleId })}
            >
              {deleteScheduleMutation.isPending ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
