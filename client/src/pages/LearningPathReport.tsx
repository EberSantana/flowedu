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
  FileText,
  Download,
  Users,
  Trophy,
  BookOpen,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// Cores para percentual de desempenho
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
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getPercentageBg(pct)} ${getPercentageColor(pct)}`}>
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

export default function LearningPathReport() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Buscar disciplinas do professor
  const { data: subjects } = trpc.subjects.list.useQuery();

  // Buscar turmas do professor
  const { data: classes } = trpc.classes.list.useQuery();

  // Buscar boletim
  const {
    data: report,
    isLoading,
    error,
  } = trpc.learningPathReport.getClassReport.useQuery(
    { subjectId: selectedSubjectId!, classId: selectedClassId },
    { enabled: !!selectedSubjectId }
  );

  // Exportar para PDF usando jsPDF + autoTable
  const handleExportPDF = async () => {
    if (!report) return;
    try {
      toast.info("Gerando PDF...");
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Título
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`Boletim da Trilha de Aprendizagem`, 14, 16);

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

      // Cabeçalhos da tabela
      const exerciseTitles = report.exercises.map((e) => e.title);
      const head = [
        ["#", "Aluno", "Matrícula", ...exerciseTitles, "Média", "Ranking"],
      ];

      // Linhas dos alunos
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

      // Linha de média da turma
      const classAvgRow = [
        "",
        "Média da Turma",
        "",
        ...report.classExerciseAverages.map((a) =>
          a.classAverage !== null ? `${a.classAverage}%` : "—"
        ),
        report.classOverallAverage !== null
          ? `${report.classOverallAverage}%`
          : "—",
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
          // Destacar linha de média da turma
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
              <h1 className="text-2xl font-bold tracking-tight">Boletim da Trilha de Aprendizagem</h1>
              <p className="text-muted-foreground text-sm mt-1">Análise e Desempenho › Boletim da Trilha</p>
            </div>
          </div>
        {/* Filtros */}
        <Card className="mb-6">
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
                      <p className={`text-2xl font-bold ${getPercentageColor(report.classOverallAverage)}`}>
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

            {/* Tabela principal do boletim */}
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
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      Notas por Atividade — {selectedSubject?.name}
                    </span>
                    <Badge variant="secondary">
                      {selectedClassId
                        ? classes?.find((c) => c.id === selectedClassId)?.name
                        : "Todas as turmas"}
                    </Badge>
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
                        {/* Linhas dos alunos */}
                        {report.students.map((student, idx) => (
                          <TableRow key={student.studentId} className="hover:bg-muted/30">
                            <TableCell className="text-center text-muted-foreground text-sm">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-medium">{student.studentName}</TableCell>
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
                <span className="text-muted-foreground">—</span>
                <span>Não respondido</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Nx</span>
                <span>Número de tentativas</span>
              </div>
            </div>
          </div>
        )}
        </div>
      </PageWrapper>
    </div>
  );
}
