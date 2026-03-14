import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Activity,
  GraduationCap,
  UserCheck,
  RefreshCw,
  TrendingUp,
  Flame,
  Download,
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
  CalendarIcon,
  Archive,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Monitor, Smartphone, Globe } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Dias da semana em PT-BR (0=Dom, 1=Seg, ..., 6=Sáb)
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAYS_FULL = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
// Horas do dia (0..23)
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getHeatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-gray-100";
  const ratio = value / max;
  if (ratio < 0.15) return "bg-blue-100";
  if (ratio < 0.30) return "bg-blue-200";
  if (ratio < 0.45) return "bg-blue-300";
  if (ratio < 0.60) return "bg-blue-400";
  if (ratio < 0.75) return "bg-orange-400";
  if (ratio < 0.90) return "bg-orange-500";
  return "bg-red-500";
}

function getHeatTextColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "text-gray-300";
  const ratio = value / max;
  return ratio >= 0.60 ? "text-white" : "text-gray-700";
}

export default function AccessLogsPage() {
  const [, setLocation] = useLocation();
  const [days, setDays] = useState(30);
  const [filterType, setFilterType] = useState<"all" | "teacher" | "student">("all");
  const [heatmapDays, setHeatmapDays] = useState(90);
  const [heatmapUserType, setHeatmapUserType] = useState<"all" | "teacher" | "student">("all");
  const [isExporting, setIsExporting] = useState(false);
  // Filtro por período personalizado
  const [filterMode, setFilterMode] = useState<"days" | "period">("days");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  // Logs por turma e disciplina
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(undefined);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());

  const toggleClassExpand = (classId: number) => {
    setExpandedClasses(prev => {
      const next = new Set(prev);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  };
  const [clearBeforeDate, setClearBeforeDate] = useState(() => {
    // Padrão: 90 dias atrás
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  });
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [archiveLabel, setArchiveLabel] = useState("");
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [archiveBeforeDelete, setArchiveBeforeDelete] = useState(true); // padrão: arquivar antes de limpar
  const [clearArchiveLabel, setClearArchiveLabel] = useState("");       // nome do arquivo gerado na limpeza
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [historyDays, setHistoryDays] = useState(30);

  const utils = trpc.useUtils();

  const archiveLogsMutation = trpc.accessLogs.archiveLogs.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`${data.recordCount} registros arquivados com sucesso! Arquivo: ${data.fileName}`);
        setShowArchiveDialog(false);
        setArchiveLabel("");
        utils.accessLogs.listArchives.invalidate();
      } else {
        toast.info((data as any).message || 'Nenhum registro para arquivar.');
      }
    },
    onError: (e) => toast.error("Erro ao arquivar: " + e.message),
  });

  const deleteArchiveMutation = trpc.accessLogs.deleteArchive.useMutation({
    onSuccess: () => {
      toast.success("Arquivo removido.");
      utils.accessLogs.listArchives.invalidate();
    },
    onError: (e) => toast.error("Erro ao remover arquivo: " + e.message),
  });

  const { data: archivesData } = trpc.accessLogs.listArchives.useQuery();

  // Histórico individual do aluno
  const { data: studentHistoryData, isLoading: studentHistoryLoading } = trpc.accessLogs.getStudentAccessHistory.useQuery(
    { studentId: selectedStudentId!, days: historyDays },
    { enabled: selectedStudentId !== null, refetchOnWindowFocus: false }
  );

  const clearLogsMutation = trpc.accessLogs.clearLogs.useMutation({
    onSuccess: (data) => {
      const count = data.deletedCount ?? 0;
      if (count === 0) {
        toast.info("Nenhum registro encontrado para o período selecionado.");
      } else {
          const archiveInfo = (data as any).archiveResult;
        if (archiveInfo) {
          toast.success(`💾 ${archiveInfo.recordCount} registros arquivados em "${archiveInfo.fileName}"`);
        }
        toast.success(`${count} registro${count !== 1 ? 's' : ''} removido${count !== 1 ? 's' : ''} com sucesso!`);
      }
      setShowClearDialog(false);
      setClearBeforeDate("");
      setClearArchiveLabel("");
      // Invalida TODAS as queries do router accessLogs de uma vez
      utils.accessLogs.invalidate();
    },
    onError: (e) => toast.error("Erro ao limpar: " + e.message),
  });

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const exportInput = filterMode === "period"
        ? { days, userType: filterType, dateFrom, dateTo }
        : { days, userType: filterType };
      const result = await utils.accessLogs.exportCSV.fetch(exportInput);
      if (!result?.csv) {
        toast.error("Nenhum dado para exportar.");
        return;
      }
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `log-acessos-${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`CSV exportado com ${result.total} registros.`);
    } catch (e) {
      toast.error("Erro ao exportar CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const queryInput = filterMode === "period"
    ? { days, dateFrom, dateTo }
    : { days };

  const { data, isLoading, refetch, isFetching } = trpc.accessLogs.getSummary.useQuery(
    queryInput,
    { refetchOnWindowFocus: false }
  );

  const { data: heatmapData, isLoading: heatmapLoading } = trpc.accessLogs.getHeatmap.useQuery(
    { days: heatmapDays, userType: heatmapUserType },
    { refetchOnWindowFocus: false }
  );

  // Queries para logs por turma e disciplina
  const { data: classList } = trpc.accessLogs.getClassList.useQuery(undefined, { refetchOnWindowFocus: false });
  const { data: subjectList } = trpc.accessLogs.getSubjectList.useQuery(undefined, { refetchOnWindowFocus: false });
  const classByClassInput = filterMode === "period"
    ? { days, dateFrom, dateTo, classId: selectedClassId, subjectId: selectedSubjectId }
    : { days, classId: selectedClassId, subjectId: selectedSubjectId };
  const { data: classLogsData, isLoading: classLogsLoading } = trpc.accessLogs.getLogsByClass.useQuery(
    classByClassInput,
    { refetchOnWindowFocus: false }
  );
  // Estado para exportar CSV por turma
  const [exportingClassId, setExportingClassId] = useState<number | null>(null);
  const exportClassInput = exportingClassId
    ? (filterMode === "period" ? { classId: exportingClassId, days, dateFrom, dateTo } : { classId: exportingClassId, days })
    : { classId: 0, days };
  const { data: classCSVData } = trpc.accessLogs.exportClassCSV.useQuery(
    exportClassInput,
    { enabled: exportingClassId !== null, refetchOnWindowFocus: false }
  );
  // Efeito para baixar CSV quando dados chegarem
  const prevExportingClassId = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (exportingClassId && classCSVData && exportingClassId !== prevExportingClassId.current) {
      prevExportingClassId.current = exportingClassId;
      const cls = classLogsData?.classes.find(c => c.classId === exportingClassId);
      const clsName = cls?.className || `turma-${exportingClassId}`;
      const blob = new Blob(['\uFEFF' + classCSVData.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `acessos-${clsName.replace(/[^a-z0-9]/gi, '-')}.csv`;
      a.click(); URL.revokeObjectURL(url);
      setExportingClassId(null);
      prevExportingClassId.current = null;
    }
  }, [classCSVData, exportingClassId, classLogsData]);

  // Usar todayTeachers/todayStudents do backend (já calculado em BRT)
  const todayTotal = data?.todayTotal ?? 0;
  // Total de acessos (cliques) hoje - sem deduplicação
  const todayTotalAccesses = data?.todayTotalAccesses ?? 0;
  const todayTeacherAccesses = data?.todayTeacherAccesses ?? 0;
  const todayStudentAccesses = data?.todayStudentAccesses ?? 0;

  const filteredLogs = (data?.recentLogs ?? []).filter((log) => {
    if (filterType === "all") return true;
    return log.userType === filterType;
  });

  // Calcular o valor máximo da matriz para normalizar as cores
  const matrix = heatmapData?.matrix ?? [];
  const maxValue = matrix.length > 0
    ? Math.max(...matrix.flatMap((row) => row))
    : 0;

  // Encontrar o pico de acesso
  let peakDay = -1, peakHour = -1, peakVal = 0;
  matrix.forEach((row, d) => {
    row.forEach((val, h) => {
      if (val > peakVal) { peakVal = val; peakDay = d; peakHour = h; }
    });
  });

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4">
          {/* Botão Voltar */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>

          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Administração" },
              { label: "Log de Acessos" },
            ]}
          />

          {/* Header */}
          <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Activity className="w-8 h-8 text-primary" />
                Log de Acessos
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitore os acessos de professores e alunos ao sistema
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Alternador de modo de filtro */}
              <div className="flex items-center border rounded-md overflow-hidden">
                <button
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    filterMode === "days"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setFilterMode("days")}
                >
                  Últimos dias
                </button>
                <button
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    filterMode === "period"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setFilterMode("period")}
                >
                  Período
                </button>
              </div>

              {filterMode === "days" ? (
                <Select
                  value={days.toString()}
                  onValueChange={(v) => setDays(Number(v))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                    <SelectItem value="180">Últimos 180 dias</SelectItem>
                    <SelectItem value="365">Últimos 365 dias</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">De:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-36 justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(new Date(dateFrom + 'T00:00:00'), 'dd/MM/yyyy') : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom ? new Date(dateFrom + 'T00:00:00') : undefined}
                        onSelect={(d) => d && setDateFrom(d.toISOString().slice(0, 10))}
                        disabled={(d) => d > new Date()}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Até:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-36 justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(new Date(dateTo + 'T00:00:00'), 'dd/MM/yyyy') : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo ? new Date(dateTo + 'T00:00:00') : undefined}
                        onSelect={(d) => d && setDateTo(d.toISOString().slice(0, 10))}
                        disabled={(d) => d > new Date() || (dateFrom ? d < new Date(dateFrom + 'T00:00:00') : false)}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={isExporting}
              >
                <Download className={`h-4 w-4 mr-2 ${isExporting ? "animate-pulse" : ""}`} />
                {isExporting ? "Exportando..." : "Exportar CSV"}
              </Button>
              <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Registros
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Limpar Log de Acessos</DialogTitle>
                    <DialogDescription>
                      Escolha uma data para excluir registros <strong>até aquele dia</strong> (inclusive), ou use "Limpar Tudo" para remover todos. Recomendamos arquivar antes de deletar.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    {/* Arquivamento automático antes de deletar */}
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="archiveBeforeDelete"
                          checked={archiveBeforeDelete}
                          onChange={(e) => setArchiveBeforeDelete(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 accent-amber-600"
                        />
                        <label htmlFor="archiveBeforeDelete" className="text-sm font-medium text-amber-800 cursor-pointer">
                          💾 Arquivar automaticamente antes de deletar
                        </label>
                      </div>
                      {archiveBeforeDelete && (
                        <div className="space-y-1 pl-6">
                          <p className="text-xs text-amber-700">Os registros serão salvos em CSV no servidor antes da exclusão.</p>
                          <input
                            type="text"
                            placeholder="Nome do arquivo (ex: Março 2026)"
                            value={clearArchiveLabel}
                            onChange={(e) => setClearArchiveLabel(e.target.value)}
                            className="w-full text-sm border border-amber-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Excluir registros até a data (inclusive):</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {clearBeforeDate ? format(new Date(clearBeforeDate + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecionar data'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={clearBeforeDate ? new Date(clearBeforeDate + 'T00:00:00') : undefined}
                            onSelect={(d) => d && setClearBeforeDate(d.toISOString().slice(0, 10))}
                            disabled={(d) => d > new Date()}
                            locale={ptBR}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">
                        💡 Dica: para manter os últimos 90 dias, selecione {format(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), "dd/MM/yyyy")} como data de corte.
                      </p>
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium text-red-600 mb-2">Zona de perigo</p>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => clearLogsMutation.mutate({
                          clearAll: true,
                          archiveBeforeDelete,
                          archiveLabel: clearArchiveLabel || undefined,
                        })}
                        disabled={clearLogsMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {clearLogsMutation.isPending ? (archiveBeforeDelete ? "Arquivando e limpando..." : "Limpando...") : "Limpar TODOS os registros"}
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setShowClearDialog(false); setClearBeforeDate(""); }}>Cancelar</Button>
                    <Button
                      variant="destructive"
                      onClick={() => clearLogsMutation.mutate({
                        beforeDate: clearBeforeDate,
                        archiveBeforeDelete,
                        archiveLabel: clearArchiveLabel || undefined,
                      })}
                      disabled={clearLogsMutation.isPending || !clearBeforeDate}
                    >
                      {clearLogsMutation.isPending
                        ? (archiveBeforeDelete ? "Arquivando e limpando..." : "Limpando...")
                        : (archiveBeforeDelete ? "💾 Arquivar e Limpar" : "Confirmar por Data")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Usuários Ativos
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "—" : data?.totalAll ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">usuários únicos no período</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Professores Ativos
                </CardTitle>
                <UserCheck className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {isLoading ? "—" : data?.totalTeacher ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">professores únicos no período</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Alunos Ativos
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {isLoading ? "—" : data?.totalStudent ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">alunos únicos no período</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Acessos Hoje
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {isLoading ? "—" : todayTotalAccesses}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {todayTeacherAccesses} acessos prof. · {todayStudentAccesses} acessos alunos
                </p>
                <p className="text-xs text-muted-foreground">
                  {data?.todayTeachers ?? 0} prof. únicos · {data?.todayStudents ?? 0} alunos únicos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ===== MAPA DE CALOR SEMANAL ===== */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Mapa de Calor — Acessos por Dia e Horário
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Identifique os momentos de maior engajamento para planejar comunicados • Horários em BRT (UTC−3)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={heatmapUserType}
                    onValueChange={(v) => setHeatmapUserType(v as "all" | "teacher" | "student")}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="teacher">Professores</SelectItem>
                      <SelectItem value="student">Alunos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={heatmapDays.toString()}
                    onValueChange={(v) => setHeatmapDays(Number(v))}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="180">180 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {heatmapLoading ? (
                <p className="text-muted-foreground text-sm py-4 text-center">Carregando mapa de calor...</p>
              ) : !heatmapData || heatmapData.total === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  Nenhum acesso registrado no período selecionado.
                </p>
              ) : (
                <>
                  {/* Pico de acesso */}
                  {peakDay >= 0 && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
                      <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                      <span>
                        <strong>Pico de acessos:</strong> {DAYS_FULL[peakDay]} às {peakHour}h–{peakHour + 1}h (BRT)
                        com <strong>{peakVal} {peakVal === 1 ? 'acesso' : 'acessos'}</strong> — melhor momento para enviar comunicados!
                      </span>
                    </div>
                  )}

                  {/* Grade do mapa de calor */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                      {/* Cabeçalho de horas */}
                      <div className="flex mb-1">
                        <div className="w-10 shrink-0" />
                        {HOURS.map((h) => (
                          <div
                            key={h}
                            className="flex-1 text-center text-[10px] text-muted-foreground font-mono"
                          >
                            {h % 3 === 0 ? `${h}h` : ""}
                          </div>
                        ))}
                      </div>

                      {/* Linhas por dia da semana */}
                      {DAYS.map((day, d) => (
                        <div key={d} className="flex items-center mb-1">
                          <div className="w-10 shrink-0 text-xs font-medium text-muted-foreground text-right pr-2">
                            {day}
                          </div>
                          {HOURS.map((h) => {
                            const val = matrix[d]?.[h] ?? 0;
                            return (
                              <div
                                key={h}
                                title={`${DAYS_FULL[d]} às ${h}h–${h+1}h (BRT): ${val} ${val !== 1 ? 'acessos' : 'acesso'}`}
                                className={`flex-1 h-7 mx-px rounded-sm flex items-center justify-center cursor-default transition-opacity hover:opacity-80 ${getHeatColor(val, maxValue)}`}
                              >
                                {val > 0 && (
                                  <span className={`text-[9px] font-bold ${getHeatTextColor(val, maxValue)}`}>
                                    {val}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}

                      {/* Legenda */}
                      <div className="flex items-center gap-2 mt-3 justify-end">
                        <span className="text-xs text-muted-foreground">Menos</span>
                        {["bg-gray-100", "bg-blue-100", "bg-blue-200", "bg-blue-300", "bg-blue-400", "bg-orange-400", "bg-orange-500", "bg-red-500"].map((c, i) => (
                          <div key={i} className={`w-5 h-4 rounded-sm ${c}`} />
                        ))}
                        <span className="text-xs text-muted-foreground">Mais</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Ranking de Usuários */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserCheck className="h-5 w-5 text-blue-500" />
                  Top Professores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Carregando...</p>
                ) : !data?.topTeachers?.length ? (
                  <p className="text-muted-foreground text-sm">Nenhum acesso registrado.</p>
                ) : (
                  <div className="space-y-2">
                    {data.topTeachers.map((t, i) => (
                      <div key={t.name} className="flex items-center justify-between py-1 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}º</span>
                          <span className="text-sm font-medium">{t.name}</span>
                        </div>
                        <Badge variant="secondary">{t.count} acessos</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="h-5 w-5 text-green-500" />
                  Top Alunos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Carregando...</p>
                ) : !data?.topStudents?.length ? (
                  <p className="text-muted-foreground text-sm">Nenhum acesso registrado.</p>
                ) : (
                  <div className="space-y-2">
                    {data.topStudents.map((s, i) => (
                      <div key={s.name} className="flex items-center justify-between py-1 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}º</span>
                          <span className="text-sm font-medium">{s.name}</span>
                        </div>
                        <Badge variant="secondary">{s.count} acessos</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Acessos Recentes */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5" />
                  Acessos Recentes
                </CardTitle>
                <Select
                  value={filterType}
                  onValueChange={(v) => setFilterType(v as "all" | "teacher" | "student")}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    <SelectItem value="teacher">Somente Professores</SelectItem>
                    <SelectItem value="student">Somente Alunos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground text-sm py-4 text-center">Carregando...</p>
              ) : !filteredLogs.length ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  Nenhum acesso encontrado para o filtro selecionado.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Tipo</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-32">Navegador</TableHead>
                        <TableHead className="w-32">Sistema</TableHead>
                        <TableHead className="w-36">IP</TableHead>
                        <TableHead className="w-36">Data / Hora (BRT)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge
                              variant={log.userType === "teacher" ? "default" : "secondary"}
                              className={
                                log.userType === "teacher"
                                  ? "bg-blue-100 text-blue-700 border-blue-200"
                                  : "bg-green-100 text-green-700 border-green-200"
                              }
                            >
                              {log.userType === "teacher" ? "Professor" : "Aluno"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{log.userName ?? "—"}</TableCell>
                          <TableCell className="text-sm">
                            <span className="inline-flex items-center gap-1">
                              {(log as any).browser === 'Google Chrome' && <span title="Chrome">🟢</span>}
                              {(log as any).browser === 'Mozilla Firefox' && <span title="Firefox">🟠</span>}
                              {(log as any).browser === 'Microsoft Edge' && <span title="Edge">🔵</span>}
                              {(log as any).browser === 'Safari' && <span title="Safari">🟡</span>}
                              {(log as any).browser === 'Opera' && <span title="Opera">🔴</span>}
                              <span className="text-muted-foreground">{(log as any).browser ?? '—'}</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {(log as any).os ?? '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm font-mono text-xs">
                            {log.ipAddress ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(log.accessedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          {/* ===== ACESSOS POR TURMA ===== */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5 text-purple-500" />
                    Acessos por Turma
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Visualize o engajamento de cada turma no período selecionado
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={selectedClassId ? selectedClassId.toString() : "all"}
                    onValueChange={(v) => { setSelectedClassId(v === "all" ? undefined : Number(v)); setSelectedSubjectId(undefined); }}
                  >
                    <SelectTrigger className="w-72">
                      <SelectValue placeholder="Todas as turmas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as turmas</SelectItem>
                      {classList?.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          Turma {cls.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {classLogsLoading ? (
                <p className="text-muted-foreground text-sm py-4 text-center">Carregando...</p>
              ) : !classLogsData?.classes?.length ? (
                <div className="py-8 text-center">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-muted-foreground text-sm">Nenhum acesso de aluno com turma cadastrada no período.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Gráfico comparativo entre turmas */}
                  {!selectedClassId && classLogsData.classes.length > 1 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-3">Comparativo de Acessos por Turma</p>
                      <div className="space-y-2">
                        {(() => {
                          const maxAccesses = Math.max(...classLogsData.classes.map(c => c.totalAccesses), 1);
                          return classLogsData.classes.map((cls) => (
                            <div key={cls.classId} className="flex items-center gap-3">
                              <div className="w-48 text-xs text-right text-muted-foreground truncate"
                                title={(cls as any).subjectName ? `${(cls as any).subjectName} – ${cls.className}` : cls.className}>
                                {(cls as any).subjectName ? `${(cls as any).subjectName} – ${cls.className}` : cls.className}
                              </div>
                              <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 rounded-full flex items-center justify-end pr-2"
                                  style={{ width: `${Math.max((cls.totalAccesses / maxAccesses) * 100, 2)}%` }}
                                >
                                  <span className="text-xs text-white font-medium">{cls.totalAccesses}</span>
                                </div>
                              </div>
                              <div className="w-20 text-xs text-muted-foreground text-right">
                                {cls.uniqueStudents}/{cls.totalEnrolled ?? '?'} alunos
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Cabeçalho da tabela */}
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground border-b">
                    <div className="col-span-1"></div>
                    <div className="col-span-4">Turma</div>
                    <div className="col-span-2 text-center">Total Acessos</div>
                    <div className="col-span-2 text-center">Ativos/Total</div>
                    <div className="col-span-1 text-center">Média</div>
                    <div className="col-span-2 text-center">CSV</div>
                  </div>
                  {classLogsData.classes.map((cls) => (
                    <div key={cls.classId} className="rounded-lg border overflow-hidden">
                      {/* Linha da turma */}
                      <div className="grid grid-cols-12 gap-2 px-3 py-3 hover:bg-muted/50">
                        <button
                          className="col-span-1 flex items-center"
                          onClick={() => toggleClassExpand(cls.classId)}
                        >
                          {expandedClasses.has(cls.classId)
                            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </button>
                        <button
                          className="col-span-4 text-left"
                          onClick={() => toggleClassExpand(cls.classId)}
                        >
                          {(cls as any).subjectName ? (
                            <>
                              <div className="font-medium text-sm">
                                <span className="text-purple-700">{(cls as any).subjectName}</span>
                                <span className="text-muted-foreground mx-1">–</span>
                                <span>{cls.className}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">Cód. {cls.classCode}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium text-sm">{cls.className}</div>
                              <div className="text-xs text-muted-foreground">{cls.classCode}</div>
                            </>
                          )}
                        </button>
                        <div className="col-span-2 flex items-center justify-center">
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            {cls.totalAccesses}
                          </Badge>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <span className="text-sm">
                            <span className="font-medium text-green-600">{cls.uniqueStudents}</span>
                            <span className="text-muted-foreground">/{cls.totalEnrolled ?? '?'}</span>
                          </span>
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">
                            {cls.uniqueStudents > 0 ? (cls.totalAccesses / cls.uniqueStudents).toFixed(1) : "0"}
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setExportingClassId(cls.classId)}
                            disabled={exportingClassId === cls.classId}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            {exportingClassId === cls.classId ? "..." : "CSV"}
                          </Button>
                        </div>
                      </div>
                      {/* Detalhamento de alunos */}
                      {expandedClasses.has(cls.classId) && (
                        <div className="border-t bg-muted/20 px-4 py-3 space-y-3">
                          {/* Alunos com acesso */}
                          {cls.students.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-green-700 mb-2">✓ Alunos com acesso ({cls.students.length})</p>
                              <div className="space-y-1">
                                {cls.students.map((s, i) => (
                                  <div key={i} className="flex items-center justify-between py-1 border-b last:border-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground w-5">{i + 1}º</span>
                                      <button
                                        className="text-sm text-left hover:text-primary hover:underline cursor-pointer transition-colors font-medium"
                                        onClick={() => {
                                          setSelectedStudentId((s as any).studentId ?? null);
                                          setSelectedStudentName(s.name);
                                        }}
                                        title="Clique para ver histórico completo de acessos"
                                      >
                                        {s.name}
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-muted-foreground">
                                        Último: {new Date(s.lastAccess).toLocaleDateString('pt-BR')}
                                      </span>
                                      <Badge variant="outline" className="text-xs">{s.count} acessos</Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Alunos sem acesso */}
                          {cls.studentsWithoutAccess && cls.studentsWithoutAccess.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-red-600 mb-2">✗ Sem acesso no período ({cls.studentsWithoutAccess.length})</p>
                              <div className="flex flex-wrap gap-1">
                                {cls.studentsWithoutAccess.map((name, i) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {cls.students.length === 0 && (!cls.studentsWithoutAccess || cls.studentsWithoutAccess.length === 0) && (
                            <p className="text-xs text-muted-foreground">Nenhum aluno matriculado.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {classLogsData.noClassCount > 0 && (
                    <p className="text-xs text-muted-foreground pt-2 text-center">
                      + {classLogsData.noClassCount} acesso(s) de alunos sem turma cadastrada
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção de Histórico de Arquivos */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Archive className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base">Histórico de Arquivos</CardTitle>
                </div>
                <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Archive className="h-4 w-4 mr-2" />
                      Arquivar Logs Atuais
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Arquivar Log de Acessos</DialogTitle>
                      <DialogDescription>
                        Salva todos os registros atuais em um arquivo CSV no servidor para consulta futura. Os registros <strong>não serão deletados</strong> — use "Limpar Registros" para isso.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                      <Label>Nome descritivo do arquivo (opcional):</Label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2 text-sm"
                        placeholder="Ex: Março 2026, Semestre 1..."
                        value={archiveLabel}
                        onChange={(e) => setArchiveLabel(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        O arquivo será salvo com todos os registros atuais (navegador, SO, IP, data/hora em BRT).
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>Cancelar</Button>
                      <Button
                        onClick={() => archiveLogsMutation.mutate({ label: archiveLabel || undefined })}
                        disabled={archiveLogsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {archiveLogsMutation.isPending ? "Arquivando..." : "Confirmar Arquivo"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Arquivos CSV gerados anteriormente para análise histórica</p>
            </CardHeader>
            <CardContent>
              {!archivesData || archivesData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum arquivo arquivado ainda.</p>
                  <p className="text-xs mt-1">Use "Arquivar Logs Atuais" para salvar um snapshot dos registros.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {archivesData.map((archive) => (
                    <div key={archive.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{archive.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {archive.recordCount} registros
                            {archive.periodStart && archive.periodEnd && (
                              <> &bull; {new Date(archive.periodStart).toLocaleDateString('pt-BR')} a {new Date(archive.periodEnd).toLocaleDateString('pt-BR')}</>
                            )}
                            {archive.fileSizeBytes && archive.fileSizeBytes > 0 && (
                              <> &bull; {(archive.fileSizeBytes / 1024).toFixed(1)} KB</>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">Criado em {new Date(archive.createdAt).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => window.open(archive.fileUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Baixar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteArchiveMutation.mutate({ id: archive.id })}
                          disabled={deleteArchiveMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </PageWrapper>

      {/* Sheet lateral: Histórico individual do aluno */}
      <Sheet open={selectedStudentId !== null} onOpenChange={(open) => { if (!open) setSelectedStudentId(null); }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Histórico de Acessos
            </SheetTitle>
            <SheetDescription>
              {selectedStudentName && <span className="font-semibold text-foreground">{selectedStudentName}</span>}
            </SheetDescription>
          </SheetHeader>

          {/* Filtro de período */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Período:</span>
            <Select value={String(historyDays)} onValueChange={(v) => setHistoryDays(Number(v))}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="15">15 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
              </SelectContent>
            </Select>
            {studentHistoryData && (
              <Badge variant="secondary" className="text-xs">
                {studentHistoryData.totalAccesses} acesso{studentHistoryData.totalAccesses !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {studentHistoryLoading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!studentHistoryLoading && studentHistoryData && studentHistoryData.logs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum acesso registrado nos últimos {historyDays} dias.</p>
            </div>
          )}

          {!studentHistoryLoading && studentHistoryData && studentHistoryData.logs.length > 0 && (
            <div className="space-y-2">
              {studentHistoryData.logs.map((log) => {
                const brtDate = new Date(log.accessedAtBRT);
                const dateStr = brtDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const timeStr = brtDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const isDesktop = /Windows|Mac|Linux/.test(log.os);
                const isMobile = /Android|iOS/.test(log.os);
                return (
                  <div key={log.id} className="flex items-start justify-between py-2 px-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isDesktop ? (
                          <Monitor className="h-4 w-4 text-blue-500" />
                        ) : isMobile ? (
                          <Smartphone className="h-4 w-4 text-green-500" />
                        ) : (
                          <Globe className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{dateStr} às {timeStr} <span className="text-xs text-muted-foreground">(BRT)</span></p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {log.browser !== 'Desconhecido' ? log.browser : ''}
                          {log.browser !== 'Desconhecido' && log.os !== 'Desconhecido' ? ' • ' : ''}
                          {log.os !== 'Desconhecido' ? log.os : ''}
                          {log.browser === 'Desconhecido' && log.os === 'Desconhecido' ? 'Dispositivo desconhecido' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
