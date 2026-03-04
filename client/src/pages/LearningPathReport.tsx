import { useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  Users,
  Trophy,
  BookOpen,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type ExerciseGrade = {
  exerciseId: number;
  percentage: number | null;
  attempts: number;
};

type StudentData = {
  studentId: number;
  studentName: string;
  studentRegistration: string;
  exerciseGrades: ExerciseGrade[];
  avgPercentage: number | null;
  rank: number | null;
};

type ExerciseData = {
  id: number;
  title: string;
  moduleId: number | null;
  totalPoints: number;
  difficulty: string;
};

type ClassAvg = {
  exerciseId: number;
  classAverage: number | null;
  studentsCompleted: number;
};

// ─── Helpers de cor ──────────────────────────────────────────────────────────

function getPercentageColor(pct: number | null): string {
  if (pct === null) return "text-muted-foreground";
  if (pct >= 70) return "text-green-600 dark:text-green-400";
  if (pct >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getPercentageBg(pct: number | null): string {
  if (pct === null) return "bg-muted";
  if (pct >= 70) return "bg-green-100 dark:bg-green-900/30";
  if (pct >= 50) return "bg-yellow-100 dark:bg-yellow-900/30";
  return "bg-red-100 dark:bg-red-900/30";
}

function PercentageBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getPercentageBg(pct)} ${getPercentageColor(pct)}`}
    >
      {pct}%
    </span>
  );
}

function RankBadge({ rank }: { rank: number | null }) {
  if (rank === null) return <span className="text-muted-foreground text-sm">—</span>;
  if (rank === 1) return <span className="text-yellow-500 font-bold">🥇 1º</span>;
  if (rank === 2) return <span className="text-gray-400 font-bold">🥈 2º</span>;
  if (rank === 3) return <span className="text-amber-600 font-bold">🥉 3º</span>;
  return <span className="text-muted-foreground text-sm font-medium">{rank}º</span>;
}

// ─── Tooltip customizado ─────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-foreground mb-2 truncate max-w-[220px]">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 mt-1">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
          </span>
          <span className="font-bold" style={{ color: entry.color }}>
            {entry.value !== null && entry.value !== undefined ? `${entry.value}%` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Modal de evolução individual ────────────────────────────────────────────

interface StudentEvolutionModalProps {
  open: boolean;
  onClose: () => void;
  student: StudentData | null;
  exercises: ExerciseData[];
  classAverages: ClassAvg[];
  classOverallAverage: number | null;
  totalStudents: number;
}

function StudentEvolutionModal({
  open,
  onClose,
  student,
  exercises,
  classAverages,
  totalStudents,
}: StudentEvolutionModalProps) {
  if (!student) return null;

  // Dados para o gráfico
  const chartData = exercises.map((ex) => {
    const grade = student.exerciseGrades.find((g) => g.exerciseId === ex.id);
    const classAvg = classAverages.find((a) => a.exerciseId === ex.id);
    const shortTitle = ex.title.length > 20 ? ex.title.slice(0, 18) + "…" : ex.title;
    return {
      name: shortTitle,
      fullName: ex.title,
      modulo: ex.moduleId ? `Módulo ${ex.moduleId}` : "—",
      aluno: grade?.percentage ?? null,
      turma: classAvg?.classAverage ?? null,
      tentativas: grade?.attempts ?? 0,
    };
  });

  // Estatísticas
  const gradesWithValue = student.exerciseGrades
    .map((g) => g.percentage)
    .filter((p): p is number => p !== null);

  const maxGrade = gradesWithValue.length > 0 ? Math.max(...gradesWithValue) : null;
  const minGrade = gradesWithValue.length > 0 ? Math.min(...gradesWithValue) : null;
  const completedCount = gradesWithValue.length;

  // Tendência (última - primeira nota com valor)
  let trend: number | null = null;
  if (gradesWithValue.length >= 2) {
    trend = gradesWithValue[gradesWithValue.length - 1] - gradesWithValue[0];
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolução Individual
              </DialogTitle>
              <DialogDescription className="mt-1">
                <span className="font-semibold text-foreground">{student.studentName}</span>
                {student.studentRegistration && (
                  <span className="text-muted-foreground ml-2">
                    · Matrícula: {student.studentRegistration}
                  </span>
                )}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0 mt-0.5"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Cards de estatísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Média do Aluno</p>
              <p className={`text-xl font-bold ${getPercentageColor(student.avgPercentage)}`}>
                {student.avgPercentage !== null ? `${student.avgPercentage}%` : "—"}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Melhor Nota</p>
              <p className={`text-xl font-bold ${getPercentageColor(maxGrade ?? null)}`}>
                {maxGrade !== null ? `${maxGrade}%` : "—"}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Pior Nota</p>
              <p className={`text-xl font-bold ${getPercentageColor(minGrade ?? null)}`}>
                {minGrade !== null ? `${minGrade}%` : "—"}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Concluídas</p>
              <p className="text-xl font-bold text-foreground">
                {completedCount}/{exercises.length}
              </p>
            </div>
          </div>

          {/* Banner de tendência */}
          {trend !== null && (
            <div
              className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg ${
                trend > 0
                  ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                  : trend < 0
                  ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {trend > 0 ? (
                <TrendingUp className="h-4 w-4 flex-shrink-0" />
              ) : trend < 0 ? (
                <TrendingDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Minus className="h-4 w-4 flex-shrink-0" />
              )}
              <span>
                {trend > 0
                  ? `Tendência de melhora: +${trend} p.p. da primeira à última atividade`
                  : trend < 0
                  ? `Tendência de queda: ${trend} p.p. da primeira à última atividade`
                  : "Desempenho estável ao longo das atividades"}
              </span>
            </div>
          )}

          {/* Gráfico de área */}
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <BookOpen className="h-8 w-8 mb-2 opacity-40" />
              <p>Nenhuma atividade encontrada.</p>
            </div>
          ) : (
            <div>
              {/* Legenda do gráfico */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-8 h-0.5 bg-blue-500 rounded" />
                  Nota do aluno
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-8 h-0.5 bg-orange-400 rounded" />
                  Média da turma
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-6 h-px border-t border-dashed border-gray-400" />
                  Referência 70%
                </span>
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 16, left: 0, bottom: 48 }}
                >
                  <defs>
                    <linearGradient id="gradAluno" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradTurma" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={60}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={70}
                    stroke="#9ca3af"
                    strokeDasharray="5 3"
                    label={{
                      value: "70%",
                      position: "insideTopRight",
                      fontSize: 10,
                      fill: "#9ca3af",
                    }}
                  />
                  {/* Média da turma (fundo) */}
                  <Area
                    type="monotone"
                    dataKey="turma"
                    name="Média da turma"
                    stroke="#f97316"
                    strokeWidth={1.5}
                    fill="url(#gradTurma)"
                    dot={{ r: 3, fill: "#f97316" }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                  {/* Nota do aluno (frente) */}
                  <Area
                    type="monotone"
                    dataKey="aluno"
                    name="Nota do aluno"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#gradAluno)"
                    dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabela detalhada */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 text-left">
                  <th className="px-3 py-2 font-semibold text-xs text-muted-foreground">
                    Atividade
                  </th>
                  <th className="px-3 py-2 font-semibold text-xs text-muted-foreground">
                    Módulo
                  </th>
                  <th className="px-3 py-2 font-semibold text-xs text-muted-foreground text-center">
                    Nota
                  </th>
                  <th className="px-3 py-2 font-semibold text-xs text-muted-foreground text-center">
                    Média Turma
                  </th>
                  <th className="px-3 py-2 font-semibold text-xs text-muted-foreground text-center">
                    Tentativas
                  </th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <td
                      className="px-3 py-2 font-medium max-w-[200px] truncate"
                      title={row.fullName}
                    >
                      {row.fullName}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs max-w-[130px] truncate">
                      {row.modulo}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <PercentageBadge pct={row.aluno} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <PercentageBadge pct={row.turma} />
                    </td>
                    <td className="px-3 py-2 text-center text-muted-foreground">
                      {row.tentativas > 0 ? `${row.tentativas}x` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function LearningPathReport() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: subjects } = trpc.subjects.list.useQuery();
  const { data: classes } = trpc.classes.list.useQuery();

  const {
    data: report,
    isLoading,
    error,
  } = trpc.learningPathReport.getClassReport.useQuery(
    { subjectId: selectedSubjectId!, classId: selectedClassId },
    { enabled: !!selectedSubjectId }
  );

  // Exportar PDF
  const handleExportPDF = async () => {
    if (!report) return;
    try {
      toast.info("Gerando PDF...");
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Boletim da Trilha de Aprendizagem", 14, 16);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Disciplina: ${report.subject.name}`, 14, 24);

      const classLabel = selectedClassId
        ? classes?.find((c) => c.id === selectedClassId)?.name ?? "Turma selecionada"
        : "Todas as turmas";
      doc.text(`Turma: ${classLabel}`, 14, 30);
      doc.text(
        `Gerado em: ${new Date(report.generatedAt).toLocaleString("pt-BR")}`,
        14,
        36
      );

      const exerciseTitles = report.exercises.map((e) => e.title);
      const head = [["#", "Aluno", "Matrícula", ...exerciseTitles, "Média", "Ranking"]];

      const body = report.students.map((student, idx) => {
        const grades = report.exercises.map((ex) => {
          const grade = student.exerciseGrades.find((g) => g.exerciseId === ex.id);
          return grade?.percentage !== null && grade?.percentage !== undefined
            ? `${grade.percentage}%`
            : "—";
        });
        return [
          idx + 1,
          student.studentName,
          student.studentRegistration,
          ...grades,
          student.avgPercentage !== null ? `${student.avgPercentage}%` : "—",
          student.rank !== null ? `${student.rank}º` : "—",
        ];
      });

      const classAvgRow = [
        "",
        "Média da Turma",
        "",
        ...report.classExerciseAverages.map((a) =>
          a.classAverage !== null ? `${a.classAverage}%` : "—"
        ),
        report.classOverallAverage !== null ? `${report.classOverallAverage}%` : "—",
        "",
      ];

      autoTable(doc, {
        head,
        body: [...body, classAvgRow],
        startY: 42,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        didParseCell: (data) => {
          if (data.row.index === body.length) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [219, 234, 254];
          }
        },
      });

      doc.save(
        `boletim-trilha-${report.subject.name.replace(/\s+/g, "-").toLowerCase()}.pdf`
      );
      toast.success("PDF exportado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + err.message);
    }
  };

  const selectedSubject = subjects?.find((s) => s.id === selectedSubjectId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 px-4 space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Boletim da Trilha de Aprendizagem
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Análise e Desempenho › Boletim da Trilha
              </p>
            </div>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Selecionar Disciplina e Turma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Disciplina
                  </label>
                  <Select
                    value={selectedSubjectId?.toString() ?? ""}
                    onValueChange={(v) => {
                      setSelectedSubjectId(Number(v));
                      setSelectedClassId(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma disciplina..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Turma (opcional)
                  </label>
                  <Select
                    value={selectedClassId?.toString() ?? "all"}
                    onValueChange={(v) =>
                      setSelectedClassId(v === "all" ? null : Number(v))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as turmas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as turmas</SelectItem>
                      {classes?.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleExportPDF}
                  disabled={!report || isLoading}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Estado inicial */}
          {!selectedSubjectId && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">Selecione uma disciplina</p>
              <p className="text-sm mt-1">
                Escolha a disciplina acima para visualizar o boletim da trilha.
              </p>
            </div>
          )}

          {/* Loading */}
          {selectedSubjectId && isLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
              <Clock className="h-5 w-5 animate-spin" />
              <span>Carregando boletim...</span>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error.message}</span>
            </div>
          )}

          {/* Conteúdo do boletim */}
          {report && !isLoading && (
            <div ref={printRef} className="space-y-6">
              {/* Cards de resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Alunos</p>
                        <p className="text-2xl font-bold">{report.totalStudents}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-8 w-8 text-purple-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Atividades</p>
                        <p className="text-2xl font-bold">{report.exercises.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-8 w-8 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Média Geral</p>
                        <p
                          className={`text-2xl font-bold ${getPercentageColor(report.classOverallAverage)}`}
                        >
                          {report.classOverallAverage !== null
                            ? `${report.classOverallAverage}%`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Módulos</p>
                        <p className="text-2xl font-bold">{report.modules.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela principal */}
              {report.exercises.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Nenhuma atividade encontrada na trilha</p>
                    <p className="text-sm mt-1">
                      Adicione exercícios vinculados aos módulos da trilha de aprendizagem.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
                      <span className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        Notas por Atividade — {selectedSubject?.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {selectedClassId
                            ? classes?.find((c) => c.id === selectedClassId)?.name
                            : "Todas as turmas"}
                        </Badge>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          Clique no nome do aluno para ver a evolução
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-8 text-center">#</TableHead>
                            <TableHead className="min-w-[160px]">Aluno</TableHead>
                            <TableHead className="min-w-[100px]">Matrícula</TableHead>
                            {report.exercises.map((ex) => (
                              <TableHead
                                key={ex.id}
                                className="text-center min-w-[90px] max-w-[120px]"
                                title={ex.title}
                              >
                                <span className="block truncate text-xs">{ex.title}</span>
                              </TableHead>
                            ))}
                            <TableHead className="text-center font-semibold min-w-[80px]">
                              Média
                            </TableHead>
                            <TableHead className="text-center min-w-[70px]">
                              Ranking
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.students.map((student, idx) => (
                            <TableRow key={student.studentId} className="hover:bg-muted/30">
                              <TableCell className="text-center text-muted-foreground text-sm">
                                {idx + 1}
                              </TableCell>
                              {/* Nome clicável */}
                              <TableCell>
                                <button
                                  onClick={() => setSelectedStudent(student)}
                                  className="font-medium text-primary hover:underline text-left flex items-center gap-1.5 group"
                                  title="Ver evolução individual"
                                >
                                  {student.studentName}
                                  <TrendingUp className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
                                </button>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {student.studentRegistration}
                              </TableCell>
                              {report.exercises.map((ex) => {
                                const grade = student.exerciseGrades.find(
                                  (g) => g.exerciseId === ex.id
                                );
                                return (
                                  <TableCell key={ex.id} className="text-center">
                                    <PercentageBadge pct={grade?.percentage ?? null} />
                                    {grade && grade.attempts > 0 && (
                                      <div className="text-xs text-muted-foreground mt-0.5">
                                        {grade.attempts}x
                                      </div>
                                    )}
                                  </TableCell>
                                );
                              })}
                              <TableCell className="text-center">
                                <PercentageBadge pct={student.avgPercentage} />
                              </TableCell>
                              <TableCell className="text-center">
                                <RankBadge rank={student.rank} />
                              </TableCell>
                            </TableRow>
                          ))}

                          {/* Linha de média da turma */}
                          <TableRow className="bg-blue-50 dark:bg-blue-950/30 font-semibold border-t-2 border-blue-200 dark:border-blue-800">
                            <TableCell />
                            <TableCell className="text-blue-700 dark:text-blue-300 font-bold">
                              Média da Turma
                            </TableCell>
                            <TableCell />
                            {report.classExerciseAverages.map((avg) => (
                              <TableCell key={avg.exerciseId} className="text-center">
                                <PercentageBadge pct={avg.classAverage} />
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {avg.studentsCompleted}/{report.totalStudents}
                                </div>
                              </TableCell>
                            ))}
                            <TableCell className="text-center">
                              <PercentageBadge pct={report.classOverallAverage} />
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Legenda */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-300" />
                  <span>≥ 70% — Bom desempenho</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300" />
                  <span>50–69% — Desempenho regular</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300" />
                  <span>&lt; 50% — Atenção necessária</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Clique no nome do aluno para ver a evolução individual</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageWrapper>

      {/* Modal de evolução individual */}
      {report && (
        <StudentEvolutionModal
          open={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          student={selectedStudent}
          exercises={report.exercises}
          classAverages={report.classExerciseAverages}
          classOverallAverage={report.classOverallAverage}
          totalStudents={report.totalStudents}
        />
      )}
    </div>
  );
}
