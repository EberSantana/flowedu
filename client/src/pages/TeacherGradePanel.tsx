import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
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
} from "lucide-react";

function gradeColor(grade: number | null): string {
  if (grade === null) return "text-muted-foreground";
  if (grade >= 6) return "text-green-700";
  if (grade >= 4.2) return "text-yellow-700";
  return "text-red-700";
}

function gradeBg(grade: number): string {
  if (grade >= 6) return "bg-green-50 border-green-200";
  if (grade >= 4.2) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

export default function TeacherGradePanel() {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [showReport, setShowReport] = useState(false);

  // Buscar turmas do professor
  const { data: classesList } = trpc.classes.list.useQuery();

  // Buscar disciplinas da turma selecionada (via scheduled_classes)
  const { data: classSubjects, isLoading: loadingSubjects } = trpc.activities.getSubjectsByClass.useQuery(
    { classId: selectedClassId! },
    { enabled: !!selectedClassId }
  );

  // Buscar notas da turma selecionada
  const { data: gradesData, isLoading: loadingGrades } = trpc.activities.getGradesByClass.useQuery(
    { classId: selectedClassId!, subjectId: selectedSubjectId ?? undefined },
    { enabled: !!selectedClassId }
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
    const approved = withGrades.filter((s) => (s.overallAverage ?? 0) >= 6).length;
    return {
      total: gradesData.length,
      avgOverall: avg !== null ? parseFloat(avg.toFixed(2)) : null,
      approved,
      failed: withGrades.length - approved,
    };
  }, [gradesData]);

  // Exportar CSV
  const exportCSV = () => {
    if (!filteredGrades || filteredGrades.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }
    const className = classesList?.find((c) => c.id === selectedClassId)?.name ?? "turma";
    const subjectName = selectedSubjectId
      ? classSubjects?.find((s) => s.subjectId === selectedSubjectId)?.subjectName ?? ""
      : "todas_disciplinas";

    const headers = [
      "Matrícula",
      "Nome do Aluno",
      "Exercícios Online (qtd)",
      "Média Exercícios",
      "Atividades em Sala (qtd)",
      "Média Atividades",
      "Média Geral",
      "Situação",
    ];

    const rows = filteredGrades.map((s) => [
      s.registrationNumber ?? "",
      s.studentName,
      s.exerciseCount,
      s.exerciseAverage !== null ? s.exerciseAverage.toFixed(2) : "—",
      s.activityCount,
      s.activityAverage !== null ? s.activityAverage.toFixed(2) : "—",
      s.overallAverage !== null ? s.overallAverage.toFixed(2) : "—",
      s.overallAverage !== null ? (s.overallAverage >= 6 ? "Aprovado" : "Em recuperação") : "Sem notas",
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
            {selectedClassId && filteredGrades && filteredGrades.length > 0 && (
              <Button onClick={exportCSV} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            )}
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Selecionar Turma */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Turma</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedClassId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setSelectedClassId(val);
                      setSelectedSubjectId(null);
                      setSearchTerm("");
                    }}
                  >
                    <option value="">Selecione uma turma...</option>
                    {classesList?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selecionar Disciplina */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Disciplina (opcional)
                  </label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedSubjectId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setSelectedSubjectId(val);
                    }}
                    disabled={!selectedClassId || loadingSubjects}
                  >
                    <option value="">
                      {!selectedClassId
                        ? "Selecione uma turma primeiro"
                        : loadingSubjects
                        ? "Carregando disciplinas..."
                        : classSubjects && classSubjects.length === 0
                        ? "Nenhuma disciplina nesta turma"
                        : "Todas as disciplinas"}
                    </option>
                    {classSubjects?.map((s) => (
                      <option key={s.subjectId} value={s.subjectId}>
                        {s.subjectName}
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
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conteúdo */}
          {!selectedClassId ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">Selecione uma turma</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Escolha uma turma no filtro acima para visualizar as notas dos alunos.
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
                              <span className={`text-lg font-bold ${gradeColor(student.overallAverage)}`}>
                                {student.overallAverage !== null ? student.overallAverage.toFixed(1) : "—"}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              {student.overallAverage !== null ? (
                                <Badge
                                  variant="outline"
                                  className={
                                    student.overallAverage >= 6
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                  }
                                >
                                  {student.overallAverage >= 6 ? "Aprovado" : "Recuperação"}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Sem notas
                                </Badge>
                              )}
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
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="exercises">
                      Exercícios Online ({studentReport.exercises.length})
                    </TabsTrigger>
                    <TabsTrigger value="activities">
                      Atividades em Sala ({studentReport.activities.length})
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
                                {a.subjectName && (
                                  <p className="text-xs text-muted-foreground">{a.subjectName}</p>
                                )}
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
