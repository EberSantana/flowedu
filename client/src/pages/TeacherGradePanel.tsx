import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import * as XLSX from "xlsx";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ClipboardList,
  Users,
  TrendingUp,
  Award,
  Download,
  Search,
  Eye,
  BookOpen,
  FileText,
  CheckCircle2,
  XCircle,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  GraduationCap,
} from "lucide-react";

function gradeColor(grade: number | null): string {
  if (grade === null) return "text-muted-foreground";
  if (grade >= 7) return "text-green-700";
  if (grade >= 5) return "text-yellow-700";
  return "text-red-700";
}

function gradeBg(grade: number): string {
  if (grade >= 7) return "bg-green-50 border-green-200";
  if (grade >= 5) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

function gradeLabel(grade: number | null): string {
  if (grade === null) return "Sem notas";
  if (grade >= 7) return "Bom desempenho";
  if (grade >= 5) return "Desempenho regular";
  return "Atenção necessária";
}

function gradeLabelColor(grade: number | null): string {
  if (grade === null) return "text-muted-foreground border-muted";
  if (grade >= 7) return "bg-green-50 text-green-700 border-green-200";
  if (grade >= 5) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-red-50 text-red-700 border-red-200";
}

export default function TeacherGradePanel() {
  const [selectedCombo, setSelectedCombo] = useState<string>(""); // "subjectId-classId"
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [showReport, setShowReport] = useState(false);

  // Buscar combinações Disciplina — Turma do professor
  const { data: combinations } = trpc.activities.getSubjectClassCombinations.useQuery();

  // Extrair subjectId e classId da combinação selecionada
  const selectedSubjectId = selectedCombo ? Number(selectedCombo.split("-")[0]) : null;
  const selectedClassId = selectedCombo ? Number(selectedCombo.split("-")[1]) : null;

  // Buscar notas da disciplina selecionada (filtrando pela turma quando disponível)
  const { data: gradesData, isLoading: loadingGrades } = trpc.activities.getGradesByClass.useQuery(
    { classId: selectedSubjectId!, subjectId: selectedSubjectId ?? undefined },
    { enabled: !!selectedSubjectId }
  );

  // Buscar relatório individual do aluno
  const { data: studentReport, isLoading: loadingReport } = trpc.activities.getStudentReport.useQuery(
    { studentId: selectedStudentId!, subjectId: selectedSubjectId ?? undefined },
    { enabled: !!selectedStudentId && showReport }
  );

  // Filtrar alunos por busca
  const filteredGrades = useMemo(() => {
    if (!gradesData) return [];
    if (!searchTerm) return gradesData;
    const term = searchTerm.toLowerCase();
    return gradesData.filter(
      (s) =>
        s.studentName.toLowerCase().includes(term) ||
        (s.registrationNumber && s.registrationNumber.toLowerCase().includes(term))
    );
  }, [gradesData, searchTerm]);

  // Estatísticas
  const stats = useMemo(() => {
    if (!gradesData || gradesData.length === 0) return { total: 0, avgOverall: null, approved: 0, failed: 0 };
    const withGrades = gradesData.filter((s) => s.overallAverage !== null);
    const avg = withGrades.length > 0
      ? withGrades.reduce((sum, s) => sum + (s.overallAverage ?? 0), 0) / withGrades.length
      : null;
    const approved = withGrades.filter((s) => (s.overallAverage ?? 0) >= 7).length;
    return {
      total: gradesData.length,
      avgOverall: avg !== null ? parseFloat(avg.toFixed(2)) : null,
      approved,
      failed: withGrades.length - approved,
    };
  }, [gradesData]);

  // Exportar Excel (.xlsx) com formatação profissional
  const exportExcel = () => {
    if (!filteredGrades || filteredGrades.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }
    const combo = combinations?.find(c => `${c.subjectId}-${c.classId}` === selectedCombo);
    const subjectName = combo?.subjectName ?? "Disciplina";
    const className = combo?.className ?? "Turma";
    const dateStr = new Date().toLocaleDateString("pt-BR");

    // Linha de título
    const titleRow = [`Notas — ${subjectName} / ${className} — Exportado em ${dateStr}`];

    // Cabeçalhos
    const headers = [
      "Matrícula",
      "Nome do Aluno",
      "Exercícios (qtd)",
      "Média Exercícios",
      "Atividades (qtd)",
      "Média Atividades",
      "Provas (qtd)",
      "Média Provas",
      "Média Geral",
      "Situação",
    ];

    // Linhas de dados
    const rows = filteredGrades.map((s: any) => [
      s.registrationNumber ?? "",
      s.studentName,
      s.exerciseCount ?? 0,
      s.exerciseAverage !== null ? parseFloat(s.exerciseAverage.toFixed(2)) : "",
      s.activityCount ?? 0,
      s.activityAverage !== null ? parseFloat(s.activityAverage.toFixed(2)) : "",
      s.assessmentCount ?? 0,
      s.assessmentAverage !== null ? parseFloat(s.assessmentAverage.toFixed(2)) : "",
      s.overallAverage !== null ? parseFloat(s.overallAverage.toFixed(2)) : "",
      s.overallAverage !== null ? gradeLabel(s.overallAverage) : "Sem notas",
    ]);

    // Linha de médias da turma
    const avgRow = [
      "",
      "MÉDIA DA TURMA",
      "",
      stats.avgOverall !== null ? parseFloat(stats.avgOverall.toFixed(2)) : "",
      "",
      "",
      "",
      "",
      stats.avgOverall !== null ? parseFloat(stats.avgOverall.toFixed(2)) : "",
      `${stats.approved} aprovados / ${stats.failed} em recuperação`,
    ];

    // Montar planilha
    const wsData = [titleRow, [], headers, ...rows, [], avgRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Largura das colunas
    ws["!cols"] = [
      { wch: 14 }, // Matrícula
      { wch: 32 }, // Nome
      { wch: 16 }, // Exercícios qtd
      { wch: 18 }, // Média Exercícios
      { wch: 16 }, // Atividades qtd
      { wch: 18 }, // Média Atividades
      { wch: 12 }, // Provas qtd
      { wch: 14 }, // Média Provas
      { wch: 14 }, // Média Geral
      { wch: 22 }, // Situação
    ];

    // Mesclar célula do título
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];

    // Criar workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${subjectName.slice(0, 28)}`);

    // Baixar arquivo
    XLSX.writeFile(wb, `notas_${subjectName}_${className}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Planilha Excel exportada com sucesso!");
  };

  // Exportar CSV
  const exportCSV = () => {
    if (!filteredGrades || filteredGrades.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }
    const combo = combinations?.find(c => `${c.subjectId}-${c.classId}` === selectedCombo);
    const className = combo?.subjectName ?? "disciplina";
    const subjectName = combo?.subjectName ?? "disciplina";

    const headers = [
      "Matrícula",
      "Nome do Aluno",
      "Exercícios Online (qtd)",
      "Média Exercícios",
      "Atividades em Sala (qtd)",
      "Média Atividades",
      "Provas (qtd)",
      "Média Provas",
      "Média Geral",
      "Situação",
    ];

    const rows = filteredGrades.map((s: any) => [
      s.registrationNumber ?? "",
      s.studentName,
      s.exerciseCount,
      s.exerciseAverage !== null ? s.exerciseAverage.toFixed(2) : "—",
      s.activityCount,
      s.activityAverage !== null ? s.activityAverage.toFixed(2) : "—",
      s.assessmentCount ?? 0,
      s.assessmentAverage !== null ? s.assessmentAverage?.toFixed(2) : "—",
      s.overallAverage !== null ? s.overallAverage.toFixed(2) : "—",
      s.overallAverage !== null ? gradeLabel(s.overallAverage) : "Sem notas",
    ]);

    const csvContent =
      "\uFEFF" + // BOM para Excel reconhecer UTF-8
      headers.join(";") +
      "\n" +
      rows.map((r) => r.join(";")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notas_${className}_${subjectName}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Planilha exportada com sucesso!");
  };

  const openStudentReport = (studentId: number) => {
    setSelectedStudentId(studentId);
    setShowReport(true);
  };

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <Breadcrumb items={[{ label: "Análise e Desempenho" }, { label: "Painel de Notas" }]} />

          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-8 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Painel de Notas</h1>
                <p className="text-sm text-muted-foreground">
                  Visualize as notas de todos os alunos por turma e disciplina
                </p>
              </div>
            </div>
            {selectedCombo && filteredGrades && filteredGrades.length > 0 && (
              <div className="flex gap-2">
                <Button onClick={exportExcel} variant="default" className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                  <Download className="w-4 h-4" />
                  Excel (.xlsx)
                </Button>
                <Button onClick={exportCSV} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  CSV
                </Button>
              </div>
            )}
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Selecionar Disciplina — Turma */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Disciplina / Turma</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedCombo}
                    onChange={(e) => {
                      setSelectedCombo(e.target.value);
                      setSearchTerm("");
                    }}
                  >
                    <option value="">Selecione disciplina e turma...</option>
                    {combinations?.map((c) => (
                      <option key={`${c.subjectId}-${c.classId}`} value={`${c.subjectId}-${c.classId}`}>
                        {c.subjectName}{c.className ? ` — ${c.className}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Buscar aluno */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Buscar aluno</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome ou matrícula..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                      disabled={!selectedCombo}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conteúdo */}
          {!selectedCombo ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">Selecione uma disciplina e turma</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Escolha uma combinação de disciplina e turma no filtro acima para visualizar as notas dos alunos.
                </p>
              </CardContent>
            </Card>
          ) : loadingGrades ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : !filteredGrades || filteredGrades.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">Nenhum aluno encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm
                    ? "Nenhum aluno corresponde à busca."
                    : "Nenhum aluno matriculado nesta turma."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Cards de resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                        <p className="text-xs text-muted-foreground">alunos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {stats.avgOverall !== null ? stats.avgOverall.toFixed(1) : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">média da turma</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <Award className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
                        <p className="text-xs text-muted-foreground">aprovados</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-8 h-8 text-red-500" />
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stats.failed}</p>
                        <p className="text-xs text-muted-foreground">em recuperação</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de notas */}
              <Card>
                <CardContent className="pt-6">
                  {/* Cabeçalho com disciplina e turma */}
                  {(() => {
                    const combo = combinations?.find(c => `${c.subjectId}-${c.classId}` === selectedCombo);
                    return combo ? (
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-foreground">{combo.subjectName}</span>
                        </div>
                        {combo.className && (
                          <>
                            <span className="text-muted-foreground">—</span>
                            <Badge variant="secondary" className="gap-1">
                              <GraduationCap className="w-3 h-3" />
                              {combo.className}
                            </Badge>
                          </>
                        )}
                      </div>
                    ) : null;
                  })()}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Aluno</th>
                          <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Matrícula</th>
                          <th className="text-center py-3 px-2 font-semibold text-muted-foreground">
                            <div className="flex items-center justify-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              Exercícios
                            </div>
                          </th>
                          <th className="text-center py-3 px-2 font-semibold text-muted-foreground">
                            <div className="flex items-center justify-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              Atividades
                            </div>
                          </th>
                          <th className="text-center py-3 px-2 font-semibold text-muted-foreground">
                            <div className="flex items-center justify-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5" />
                              Provas
                            </div>
                          </th>
                          <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Média Geral</th>
                          <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Situação</th>
                          <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGrades.map((student) => (
                          <tr key={student.studentId} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-3 font-medium text-foreground">{student.studentName}</td>
                            <td className="py-3 px-2 text-center text-muted-foreground text-xs">
                              {student.registrationNumber ?? "—"}
                            </td>
                            <td className="py-3 px-2 text-center">
                              {student.exerciseAverage !== null ? (
                                <div>
                                  <span className={`font-bold ${gradeColor(student.exerciseAverage)}`}>
                                    {student.exerciseAverage.toFixed(1)}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({student.exerciseCount})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center">
                              {student.activityAverage !== null ? (
                                <div>
                                  <span className={`font-bold ${gradeColor(student.activityAverage)}`}>
                                    {student.activityAverage.toFixed(1)}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({student.activityCount})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center">
                              {(student as any).assessmentAverage !== null && (student as any).assessmentAverage !== undefined ? (
                                <div>
                                  <span className={`font-bold ${gradeColor((student as any).assessmentAverage)}`}>
                                    {(student as any).assessmentAverage.toFixed(1)}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({(student as any).assessmentCount ?? 0})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className={`text-lg font-bold ${gradeColor(student.overallAverage)}`}>
                                {student.overallAverage !== null ? student.overallAverage.toFixed(1) : "—"}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <Badge
                                  variant="outline"
                                  className={gradeLabelColor(student.overallAverage)}
                                >
                                  {gradeLabel(student.overallAverage)}
                                </Badge>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openStudentReport(student.studentId)}
                                className="gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                Ver
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Modal: Relatório Individual do Aluno */}
        <Dialog open={showReport} onOpenChange={setShowReport}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Relatório Individual
              </DialogTitle>
            </DialogHeader>

            {loadingReport ? (
              <div className="space-y-4 py-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : studentReport ? (
              <div className="space-y-6">
                {/* Info do aluno */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {studentReport.student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{studentReport.student.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {studentReport.student.registrationNumber && (
                        <span>Matrícula: {studentReport.student.registrationNumber}</span>
                      )}
                      {studentReport.student.email && <span>{studentReport.student.email}</span>}
                    </div>
                  </div>
                </div>

                {/* Resumo */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs text-muted-foreground">Exercícios</p>
                      <p className="text-xl font-bold text-foreground">
                        {studentReport.exercises.length > 0
                          ? (
                              studentReport.exercises.reduce((s, e) => s + e.grade, 0) /
                              studentReport.exercises.length
                            ).toFixed(1)
                          : "—"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs text-muted-foreground">Atividades</p>
                      <p className="text-xl font-bold text-foreground">
                        {studentReport.activities.length > 0
                          ? (
                              studentReport.activities.reduce((s, a) => s + a.grade10, 0) /
                              studentReport.activities.length
                            ).toFixed(1)
                          : "—"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs text-muted-foreground">Média Geral</p>
                      <p className="text-xl font-bold text-foreground">
                        {(() => {
                          const avgs: number[] = [];
                          if (studentReport.exercises.length > 0)
                            avgs.push(
                              studentReport.exercises.reduce((s, e) => s + e.grade, 0) /
                                studentReport.exercises.length
                            );
                          if (studentReport.activities.length > 0)
                            avgs.push(
                              studentReport.activities.reduce((s, a) => s + a.grade10, 0) /
                                studentReport.activities.length
                            );
                          return avgs.length > 0
                            ? (avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(1)
                            : "—";
                        })()}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="exercises">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="exercises">
                      Exercícios ({studentReport.exercises.length})
                    </TabsTrigger>
                    <TabsTrigger value="activities">
                      Atividades ({studentReport.activities.length})
                    </TabsTrigger>
                    <TabsTrigger value="assessments">
                      Provas ({(studentReport as any).assessments?.length ?? 0})
                    </TabsTrigger>
                  </TabsList>

                  {/* Exercícios */}
                  <TabsContent value="exercises" className="space-y-2 mt-4">
                    {studentReport.exercises.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum exercício completado.
                      </p>
                    ) : (
                      studentReport.exercises.map((e, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-3 rounded-lg border ${gradeBg(e.grade)}`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {e.approved ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                              {e.subjectName && (
                                <p className="text-xs text-muted-foreground">{e.subjectName}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`text-sm font-bold ${gradeColor(e.grade)}`}>
                              {e.grade.toFixed(1)}
                            </span>
                            {e.completedAt && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(e.completedAt).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* Atividades */}
                  <TabsContent value="activities" className="space-y-2 mt-4">
                    {studentReport.activities.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma atividade avaliada.
                      </p>
                    ) : (
                      studentReport.activities.map((a, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${gradeBg(a.grade10)}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {a.grade10 >= 6 ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {a.score}/{a.maxScore}
                              </Badge>
                              <span className={`text-sm font-bold ${gradeColor(a.grade10)}`}>
                                {a.grade10.toFixed(1)}
                              </span>
                              {a.gradedAt && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(a.gradedAt).toLocaleDateString("pt-BR")}
                                </span>
                              )}
                            </div>
                          </div>
                          {a.feedback && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground bg-background/50 p-2 rounded">
                              <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{a.feedback}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* Provas */}
                  <TabsContent value="assessments" className="space-y-2 mt-4">
                    {((studentReport as any).assessments?.length ?? 0) === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma prova realizada.
                      </p>
                    ) : (
                      (studentReport as any).assessments.map((a: any, i: number) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${gradeBg(a.grade10)}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {a.passed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                {a.score}/{a.totalPoints} pts
                              </Badge>
                              <span className={`text-sm font-bold ${gradeColor(a.grade10)}`}>
                                {a.grade10.toFixed(1)}
                              </span>
                              {a.submittedAt && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(a.submittedAt).toLocaleDateString("pt-BR")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Erro ao carregar relatório.</p>
            )}
          </DialogContent>
        </Dialog>
      </PageWrapper>
    </>
  );
}
