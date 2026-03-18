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

// Converte porcentagem (0-100) para nota (0-10)
function pctToGrade(pct: number | null): number | null {
  if (pct === null) return null;
  return parseFloat((pct / 10).toFixed(1));
}

// Cores baseadas em escala 0-10 (≥7 = verde, 5-6.9 = amarelo, <5 = vermelho)
function getGradeColor(grade: number | null): string {
  if (grade === null) return "text-muted-foreground";
  if (grade >= 7) return "text-green-600 dark:text-green-400";
  if (grade >= 5) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getGradeBg(grade: number | null): string {
  if (grade === null) return "bg-muted";
  if (grade >= 7) return "bg-green-100 dark:bg-green-900/30";
  if (grade >= 5) return "bg-yellow-100 dark:bg-yellow-900/30";
  return "bg-red-100 dark:bg-red-900/30";
}


function GradeBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-muted-foreground text-sm">—</span>;
  const grade = pctToGrade(pct)!;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getGradeBg(grade)} ${getGradeColor(grade)}`}
    >
      {grade.toFixed(1)}
    </span>
  );
}

// Alias para compatibilidade
function PercentageBadge({ pct }: { pct: number | null }) {
  return <GradeBadge pct={pct} />;
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
            {entry.value !== null && entry.value !== undefined ? Number(entry.value).toFixed(1) : "—"}
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
      aluno: grade?.percentage !== null && grade?.percentage !== undefined ? pctToGrade(grade.percentage) : null,
      turma: classAvg?.classAverage !== null && classAvg?.classAverage !== undefined ? pctToGrade(classAvg.classAverage) : null,
      tentativas: grade?.attempts ?? 0,
    };
  });

  // Estatísticas
  const gradesWithValue = student.exerciseGrades
    .map((g) => g.percentage)
    .filter((p): p is number => p !== null);

  const maxGrade = gradesWithValue.length > 0 ? Math.max(...gradesWithValue) : null;
  const minGrade = gradesWithValue.length > 0 ? Math.min(...gradesWithValue) : null;
  const maxGrade10 = pctToGrade(maxGrade);
  const minGrade10 = pctToGrade(minGrade);
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
            {/* Média do Aluno */}
            <div className={`rounded-xl p-4 text-center border-2 ${
              pctToGrade(student.avgPercentage) !== null && pctToGrade(student.avgPercentage)! >= 7
                ? 'border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700'
                : pctToGrade(student.avgPercentage) !== null && pctToGrade(student.avgPercentage)! >= 5
                ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700'
                : student.avgPercentage !== null
                ? 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700'
                : 'border-border bg-muted/30'
            }`}>
              <p className="text-xs font-medium text-muted-foreground mb-1">Média do Aluno</p>
              <p className={`text-2xl font-bold ${getGradeColor(pctToGrade(student.avgPercentage))}`}>
                {student.avgPercentage !== null ? pctToGrade(student.avgPercentage)!.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">de 10,0</p>
            </div>
            {/* Melhor Nota */}
            <div className={`rounded-xl p-4 text-center border-2 ${
              maxGrade10 !== null && maxGrade10 >= 7
                ? 'border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700'
                : maxGrade10 !== null && maxGrade10 >= 5
                ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700'
                : maxGrade10 !== null
                ? 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700'
                : 'border-border bg-muted/30'
            }`}>
              <p className="text-xs font-medium text-muted-foreground mb-1">Melhor Nota</p>
              <p className={`text-2xl font-bold ${getGradeColor(maxGrade10 ?? null)}`}>
                {maxGrade10 !== null ? maxGrade10.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">de 10,0</p>
            </div>
            {/* Pior Nota */}
            <div className={`rounded-xl p-4 text-center border-2 ${
              minGrade10 !== null && minGrade10 >= 7
                ? 'border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700'
                : minGrade10 !== null && minGrade10 >= 5
                ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700'
                : minGrade10 !== null
                ? 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700'
                : 'border-border bg-muted/30'
            }`}>
              <p className="text-xs font-medium text-muted-foreground mb-1">Pior Nota</p>
              <p className={`text-2xl font-bold ${getGradeColor(minGrade10 ?? null)}`}>
                {minGrade10 !== null ? minGrade10.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">de 10,0</p>
            </div>
            {/* Concluídas */}
            <div className="rounded-xl p-4 text-center border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700">
              <p className="text-xs font-medium text-muted-foreground mb-1">Concluídas</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {completedCount}/{exercises.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">atividades</p>
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
                  ? `Tendência de melhora: +${(trend / 10).toFixed(1)} pontos da primeira à última atividade`
                  : trend < 0
                  ? `Tendência de queda: ${(trend / 10).toFixed(1)} pontos da primeira à última atividade`
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
                  Referência 7,0
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
                    domain={[0, 10]}
                    tickFormatter={(v) => v.toFixed(1)}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={7}
                    stroke="#9ca3af"
                    strokeDasharray="5 3"
                    label={{
                      value: "7,0",
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
          <div className="border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary/5 border-b border-border">
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground text-left">
                    Atividade
                  </th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground text-left">
                    Módulo
                  </th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground text-center">
                    Nota (0–10)
                  </th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground text-center">
                    Média Turma
                  </th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground text-center">
                    Tentativas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chartData.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td
                      className="px-4 py-3 font-medium max-w-[200px] truncate"
                      title={row.fullName}
                    >
                      {row.fullName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[130px] truncate">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                        {row.modulo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.aluno !== null ? (
                        <span className={`inline-flex items-center justify-center w-14 py-1 rounded-lg text-sm font-bold ${getGradeBg(row.aluno)} ${getGradeColor(row.aluno)}`}>
                          {row.aluno.toFixed(1)}
                        </span>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.turma !== null ? (
                        <span className={`inline-flex items-center justify-center w-14 py-1 rounded-lg text-sm font-bold ${getGradeBg(row.turma)} ${getGradeColor(row.turma)}`}>
                          {row.turma.toFixed(1)}
                        </span>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.tentativas > 0 ? (
                        <span className="inline-flex items-center justify-center w-10 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                          {row.tentativas}x
                        </span>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
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
  // Seletor único: valor = "subjectId:classId"
  const [selectedCombo, setSelectedCombo] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Combinações únicas disciplina+turma
  const { data: combinations } = trpc.learningPathReport.getSubjectClassCombinations.useQuery();

  // Extrair subjectId e classId do combo selecionado
  const selectedSubjectId = selectedCombo
    ? Number(selectedCombo.split(":")[0])
    : undefined;
  const selectedClassId = selectedCombo
    ? Number(selectedCombo.split(":")[1])
    : null;

  const selectedCombination = combinations?.find(
    (c) => `${c.subjectId}:${c.classId}` === selectedCombo
  );

  // Manter compatibilidade com o código de exportação PDF
  const subjects = combinations
    ? Array.from(new Map(combinations.map((c) => [c.subjectId, { id: c.subjectId, name: c.subjectName, code: c.subjectCode, color: c.subjectColor }])).values())
    : [];
  const classes = combinations?.filter((c) => c.subjectId === selectedSubjectId)
    .map((c) => ({ id: c.classId, name: c.className, code: c.classCode })) ?? [];

  const {
    data: report,
    isLoading,
    error,
  } = trpc.learningPathReport.getClassReport.useQuery(
    { subjectId: selectedSubjectId!, classId: selectedClassId },
    { enabled: !!selectedSubjectId && selectedClassId !== null }
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

      const classLabel = selectedCombination?.classId && selectedCombination.classId > 0
        ? selectedCombination.className
        : "Todos os alunos";
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
          const pct = grade?.percentage;
          return pct !== null && pct !== undefined
            ? pctToGrade(pct)!.toFixed(1)
            : "—";
        });
        return [
          idx + 1,
          student.studentName,
          student.studentRegistration,
          ...grades,
          student.avgPercentage !== null ? pctToGrade(student.avgPercentage)!.toFixed(1) : "—",
          student.rank !== null ? `${student.rank}º` : "—",
        ];
      });

      const classAvgRow = [
        "",
        "Média da Turma",
        "",
        ...report.classExerciseAverages.map((a) =>
          a.classAverage !== null ? pctToGrade(a.classAverage)!.toFixed(1) : "—"
        ),
        report.classOverallAverage !== null ? pctToGrade(report.classOverallAverage)!.toFixed(1) : "—",
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

          {/* Filtro único: Disciplina — Turma */}
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
                    Disciplina — Turma
                  </label>
                  <Select
                    value={selectedCombo}
                    onValueChange={(v) => {
                      setSelectedCombo(v);
                      setSelectedStudent(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a disciplina e turma..." />
                    </SelectTrigger>
                    <SelectContent>
                      {combinations && combinations.length === 0 && (
                        <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                          Nenhuma disciplina com trilha de aprendizagem encontrada.
                        </div>
                      )}
                      {combinations?.map((c) => (
                        <SelectItem
                          key={`${c.subjectId}:${c.classId}`}
                          value={`${c.subjectId}:${c.classId}`}
                        >
                          <span className="font-medium">{c.subjectName}</span>
                          {c.classId > 0 && (
                            <span className="text-muted-foreground ml-1">
                              — {c.className}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCombination && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Disciplina: <span className="font-medium text-foreground">{selectedCombination.subjectName}</span>
                      {selectedCombination.subjectCode && ` (${selectedCombination.subjectCode})`}
                      {selectedCombination.classId > 0 && (
                        <>
                          {" · "}
                          Turma: <span className="font-medium text-foreground">{selectedCombination.className}</span>
                        </>
                      )}
                    </p>
                  )}
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
          {!selectedCombo && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">Selecione a Disciplina e Turma</p>
              <p className="text-sm mt-1 max-w-sm">
                Use o seletor acima para escolher a combinação de disciplina e turma e visualizar o boletim da trilha.
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
                <Card className="border-l-4 border-l-blue-400">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Total de Alunos</p>
                        <p className="text-2xl font-bold">{report.totalStudents}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-400">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Atividades</p>
                        <p className="text-2xl font-bold">{report.exercises.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`border-l-4 ${
                  pctToGrade(report.classOverallAverage) !== null && pctToGrade(report.classOverallAverage)! >= 7
                    ? 'border-l-green-400'
                    : pctToGrade(report.classOverallAverage) !== null && pctToGrade(report.classOverallAverage)! >= 5
                    ? 'border-l-yellow-400'
                    : report.classOverallAverage !== null
                    ? 'border-l-red-400'
                    : 'border-l-gray-300'
                }`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Média Geral da Turma</p>
                        <p className={`text-2xl font-bold ${getGradeColor(pctToGrade(report.classOverallAverage))}`}>
                          {report.classOverallAverage !== null
                            ? pctToGrade(report.classOverallAverage)!.toFixed(1)
                            : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">escala 0–10</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-400">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Módulos</p>
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
                          <TableRow className="bg-primary/5 border-b-2 border-primary/20">
                            <TableHead className="w-8 text-center text-muted-foreground">#</TableHead>
                            <TableHead className="min-w-[180px] font-semibold">Aluno</TableHead>
                            <TableHead className="min-w-[110px] font-semibold">Matrícula</TableHead>
                            {report.exercises.map((ex) => (
                              <TableHead
                                key={ex.id}
                                className="text-center min-w-[90px] max-w-[120px]"
                                title={ex.title}
                              >
                                <span className="block truncate text-xs font-semibold">{ex.title}</span>
                                <span className="block text-[10px] text-muted-foreground font-normal">0–10</span>
                              </TableHead>
                            ))}
                            <TableHead className="text-center font-bold min-w-[80px] text-primary">
                              Média
                              <span className="block text-[10px] text-muted-foreground font-normal">0–10</span>
                            </TableHead>
                            <TableHead className="text-center min-w-[70px] font-semibold">
                              Ranking
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.students.map((student, idx) => (
                            <TableRow key={student.studentId} className="hover:bg-muted/20 transition-colors">
                              <TableCell className="text-center text-muted-foreground text-sm py-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                                  {idx + 1}
                                </span>
                              </TableCell>
                              {/* Nome clicável */}
                              <TableCell className="py-3">
                                <button
                                  onClick={() => setSelectedStudent(student)}
                                  className="font-medium text-primary hover:underline text-left flex items-center gap-1.5 group"
                                  title="Ver evolução individual"
                                >
                                  {student.studentName}
                                  <TrendingUp className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
                                </button>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm py-3 font-mono">
                                {student.studentRegistration}
                              </TableCell>
                              {report.exercises.map((ex) => {
                                const grade = student.exerciseGrades.find(
                                  (g) => g.exerciseId === ex.id
                                );
                                return (
                                  <TableCell key={ex.id} className="text-center py-3">
                                    <GradeBadge pct={grade?.percentage ?? null} />
                                    {grade && grade.attempts > 0 && (
                                      <div className="text-xs text-muted-foreground mt-0.5">
                                        {grade.attempts}x
                                      </div>
                                    )}
                                  </TableCell>
                                );
                              })}
                              <TableCell className="text-center py-3">
                                <GradeBadge pct={student.avgPercentage} />
                              </TableCell>
                              <TableCell className="text-center py-3">
                                <RankBadge rank={student.rank} />
                              </TableCell>
                            </TableRow>
                          ))}

                          {/* Linha de média da turma */}
                          <TableRow className="bg-primary/5 font-semibold border-t-2 border-primary/20">
                            <TableCell className="py-3" />
                            <TableCell className="text-primary font-bold py-3 flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Média da Turma
                            </TableCell>
                            <TableCell className="py-3" />
                            {report.classExerciseAverages.map((avg) => (
                              <TableCell key={avg.exerciseId} className="text-center py-3">
                                <GradeBadge pct={avg.classAverage} />
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {avg.studentsCompleted}/{report.totalStudents}
                                </div>
                              </TableCell>
                            ))}
                            <TableCell className="text-center py-3">
                              <GradeBadge pct={report.classOverallAverage} />
                            </TableCell>
                            <TableCell className="py-3" />
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
                          <span>≥ 7,0 — Bom desempenho</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300" />
                  <span>5,0–6,9 — Desempenho regular</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300" />
                  <span>&lt; 5,0 — Atenção necessária</span>
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
