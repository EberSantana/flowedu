import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  FileText,
  MessageSquare,
  GraduationCap,
  BookMarked,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BIMESTRES = [
  { value: 1, label: "1º Bim" },
  { value: 2, label: "2º Bim" },
  { value: 3, label: "3º Bim" },
  { value: 4, label: "4º Bim" },
];

function gradeColor(grade: number | null): string {
  if (grade === null) return "text-muted-foreground";
  if (grade >= 6) return "text-green-700";
  if (grade >= 5) return "text-yellow-700";
  return "text-red-700";
}

function gradeBg(grade: number): string {
  if (grade >= 6) return "bg-green-50 border-green-200";
  if (grade >= 5) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

function gradeLabel(grade: number | null): string {
  if (grade === null) return "Sem notas";
  if (grade >= 6) return "Aprovado";
  if (grade >= 5) return "Recuperação";
  return "Reprovado";
}

function gradeLabelColor(grade: number | null): string {
  if (grade === null) return "text-muted-foreground border-muted";
  if (grade >= 6) return "bg-green-50 text-green-700 border-green-200";
  if (grade >= 5) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-red-50 text-red-700 border-red-200";
}

function fmtGrade(v: number | null): string {
  return v !== null ? v.toFixed(1) : "—";
}

function fmtDate(d: any): string {
  if (!d) return "—";
  const date = new Date(d);
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
}

export default function StudentGradeBook() {
  const { data: gradeBook, isLoading: loadingExercises } = trpc.studentExercises.getGradeBook.useQuery();
  const { data: activityGrades, isLoading: loadingActivities } = trpc.studentExercises.getActivityGrades.useQuery();
  const { data: assessmentGrades, isLoading: loadingAssessments } = trpc.learningPath.getStudentAssessmentGrades.useQuery();

  const [selectedBimestre, setSelectedBimestre] = useState<number>(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  const isLoading = loadingExercises || loadingActivities || loadingAssessments;

  // Extrair disciplinas únicas de todos os dados
  const allSubjects = useMemo(() => {
    const subjectMap = new Map<number, string>();
    (gradeBook ?? []).forEach((s: any) => subjectMap.set(s.subjectId, s.subjectName));
    (activityGrades ?? []).forEach((s: any) => subjectMap.set(s.subjectId, s.subjectName));
    (assessmentGrades ?? []).forEach((a: any) => {
      if (a.subjectId && a.subjectName) subjectMap.set(a.subjectId, a.subjectName);
    });
    return Array.from(subjectMap.entries()).map(([id, name]) => ({ id, name }));
  }, [gradeBook, activityGrades, assessmentGrades]);

  // Inicializar disciplina selecionada quando dados chegarem
  const effectiveSubjectId = selectedSubjectId ?? (allSubjects.length > 0 ? allSubjects[0].id : null);

  const toggleSubject = (key: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Filtrar dados por disciplina e bimestre selecionados
  const filteredExercises = useMemo(() => {
    if (!gradeBook) return [];
    return gradeBook
      .filter((sub: any) => effectiveSubjectId === null || sub.subjectId === effectiveSubjectId)
      .map((sub: any) => ({
        ...sub,
        grades: sub.grades.filter((g: any) => (g.bimestre ?? 1) === selectedBimestre),
      }))
      .map((sub: any) => ({
        ...sub,
        totalAttempts: sub.grades.length,
        approvedCount: sub.grades.filter((g: any) => g.approved).length,
        average: sub.grades.length > 0
          ? parseFloat((sub.grades.reduce((s: number, g: any) => s + g.grade, 0) / sub.grades.length).toFixed(2))
          : 0,
      }))
      .filter((sub: any) => sub.grades.length > 0);
  }, [gradeBook, selectedBimestre, effectiveSubjectId]);

  const filteredActivities = useMemo(() => {
    if (!activityGrades) return [];
    return activityGrades
      .filter((sub: any) => effectiveSubjectId === null || sub.subjectId === effectiveSubjectId)
      .map((sub: any) => ({
        ...sub,
        grades: sub.grades.filter((g: any) => (g.bimestre ?? 1) === selectedBimestre),
      }))
      .map((sub: any) => ({
        ...sub,
        totalGraded: sub.grades.length,
        approvedCount: sub.grades.filter((g: any) => g.grade10 >= 6).length,
        average: sub.grades.length > 0
          ? parseFloat((sub.grades.reduce((s: number, g: any) => s + g.grade10, 0) / sub.grades.length).toFixed(2))
          : 0,
      }))
      .filter((sub: any) => sub.grades.length > 0);
  }, [activityGrades, selectedBimestre, effectiveSubjectId]);

  const filteredAssessments = useMemo(() => {
    if (!assessmentGrades) return [];
    return assessmentGrades.filter((a: any) =>
      ((a.bimestre ?? 1) === selectedBimestre) &&
      (effectiveSubjectId === null || a.subjectId === effectiveSubjectId)
    );
  }, [assessmentGrades, selectedBimestre, effectiveSubjectId]);

  // Calcular médias por bimestre usando a fórmula
  const bimestreStats = useMemo(() => {
    // Média de Atividade da Trilha (exercícios online)
    const exerciseAvg = filteredExercises.length > 0
      ? filteredExercises.reduce((s: number, sub: any) => s + sub.average, 0) / filteredExercises.length
      : null;

    // Média de Atividade de Sala
    const activityAvg = filteredActivities.length > 0
      ? filteredActivities.reduce((s: number, sub: any) => s + sub.average, 0) / filteredActivities.length
      : null;

    // Média de Provas
    const assessmentAvg = filteredAssessments.length > 0
      ? filteredAssessments.reduce((s: number, a: any) => {
          const totalPoints = parseFloat(String(a.totalPoints ?? 10));
          const score = parseFloat(String(a.score ?? 0));
          return s + (totalPoints > 0 ? (score / totalPoints) * 10 : 0);
        }, 0) / filteredAssessments.length
      : null;

    // Bloco 1 = (Ativ. Trilha + Ativ. Sala) / 2 — só calculado quando AMBAS têm nota
    const bloco1 = (exerciseAvg !== null && activityAvg !== null)
      ? (exerciseAvg + activityAvg) / 2
      : null;

    // Bloco 2 = Prova
    const bloco2 = assessmentAvg;

    // Média Bimestral = (Bloco1 + Bloco2) / 2 - só calculada quando AMBOS existem
    const mediaBimestral = (bloco1 !== null && bloco2 !== null)
      ? (bloco1 + bloco2) / 2
      : null;

    return {
      exerciseAvg: exerciseAvg !== null ? parseFloat(exerciseAvg.toFixed(1)) : null,
      activityAvg: activityAvg !== null ? parseFloat(activityAvg.toFixed(1)) : null,
      assessmentAvg: assessmentAvg !== null ? parseFloat(assessmentAvg.toFixed(1)) : null,
      bloco1: bloco1 !== null ? parseFloat(bloco1.toFixed(1)) : null,
      bloco2: bloco2 !== null ? parseFloat(bloco2.toFixed(1)) : null,
      mediaBimestral: mediaBimestral !== null ? parseFloat(mediaBimestral.toFixed(1)) : null,
      totalItems: filteredExercises.reduce((s: number, sub: any) => s + sub.totalAttempts, 0)
        + filteredActivities.reduce((s: number, sub: any) => s + sub.totalGraded, 0)
        + filteredAssessments.length,
    };
  }, [filteredExercises, filteredActivities, filteredAssessments]);

  // Resumo de todos os 4 bimestres (filtrado por disciplina)
  const allBimestresOverview = useMemo(() => {
    if (!gradeBook && !activityGrades && !assessmentGrades) return [];
    return BIMESTRES.map((bim) => {
      const exGrades = (gradeBook ?? [])
        .filter((sub: any) => effectiveSubjectId === null || sub.subjectId === effectiveSubjectId)
        .flatMap((sub: any) =>
          sub.grades.filter((g: any) => (g.bimestre ?? 1) === bim.value)
        );
      const exAvg = exGrades.length > 0
        ? exGrades.reduce((s: number, g: any) => s + g.grade, 0) / exGrades.length
        : null;

      const actGrades = (activityGrades ?? [])
        .filter((sub: any) => effectiveSubjectId === null || sub.subjectId === effectiveSubjectId)
        .flatMap((sub: any) =>
          sub.grades.filter((g: any) => (g.bimestre ?? 1) === bim.value)
        );
      const actAvg = actGrades.length > 0
        ? actGrades.reduce((s: number, g: any) => s + g.grade10, 0) / actGrades.length
        : null;

      const assGrades = (assessmentGrades ?? []).filter((a: any) =>
        (a.bimestre ?? 1) === bim.value &&
        (effectiveSubjectId === null || a.subjectId === effectiveSubjectId)
      );
      const assAvg = assGrades.length > 0
        ? assGrades.reduce((s: number, a: any) => {
            const tp = parseFloat(String(a.totalPoints ?? 10));
            const sc = parseFloat(String(a.score ?? 0));
            return s + (tp > 0 ? (sc / tp) * 10 : 0);
          }, 0) / assGrades.length
        : null;

      // Bloco 1 só calculado quando AMBAS Ativ. Trilha e Ativ. Sala têm nota
      const b1 = (exAvg !== null && actAvg !== null)
        ? (exAvg + actAvg) / 2
        : null;
      const b2 = assAvg;
      // Média só calculada quando AMBOS Bloco 1 e Bloco 2 existem
      const media = (b1 !== null && b2 !== null)
        ? (b1 + b2) / 2
        : null;

      return {
        bimestre: bim.value,
        label: bim.label,
        bloco1: b1 !== null ? parseFloat(b1.toFixed(1)) : null,
        bloco2: b2 !== null ? parseFloat(b2.toFixed(1)) : null,
        media: media !== null ? parseFloat(media.toFixed(1)) : null,
      };
    });
  }, [gradeBook, activityGrades, assessmentGrades]);

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <ClipboardList className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Boletim</h1>
                <p className="text-primary-foreground/80 mt-1 text-sm">
                  Acompanhe seu desempenho acadêmico por bimestre
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4">
          {/* Seletor de disciplina (só aparece quando há mais de uma) */}
          {allSubjects.length > 1 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <BookMarked className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Disciplina</span>
              </div>
              <Select
                value={String(effectiveSubjectId ?? '')}
                onValueChange={(v) => setSelectedSubjectId(v ? Number(v) : null)}
              >
                <SelectTrigger className="w-full sm:w-80 bg-white">
                  <SelectValue placeholder="Selecionar disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {allSubjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Seletor de bimestre */}
          <div className="flex items-center gap-2 mb-6">
            {BIMESTRES.map((b) => (
              <button
                key={b.value}
                onClick={() => setSelectedBimestre(b.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedBimestre === b.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-white text-muted-foreground hover:bg-gray-100 border"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Cards de resumo do bimestre */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Ativ. Trilha</p>
                <p className={`text-xl font-bold ${gradeColor(bimestreStats.exerciseAvg)}`}>
                  {fmtGrade(bimestreStats.exerciseAvg)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Ativ. Sala</p>
                <p className={`text-xl font-bold ${gradeColor(bimestreStats.activityAvg)}`}>
                  {fmtGrade(bimestreStats.activityAvg)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-indigo-500">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Bloco 1</p>
                {bimestreStats.bloco1 !== null ? (
                  <p className={`text-xl font-bold ${gradeColor(bimestreStats.bloco1)}`}>
                    {fmtGrade(bimestreStats.bloco1)}
                  </p>
                ) : bimestreStats.exerciseAvg !== null && bimestreStats.activityAvg === null ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 mt-1">
                    ⏳ Ag. Ativ. Sala
                  </span>
                ) : (
                  <p className="text-xl font-bold text-muted-foreground">—</p>
                )}
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Prova (Bloco 2)</p>
                <p className={`text-xl font-bold ${gradeColor(bimestreStats.bloco2)}`}>
                  {fmtGrade(bimestreStats.bloco2)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Média Bimestral</p>
                <p className={`text-xl font-bold ${gradeColor(bimestreStats.mediaBimestral)}`}>
                  {fmtGrade(bimestreStats.mediaBimestral)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-gray-400">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Situação</p>
                <Badge variant="outline" className={`mt-1 ${gradeLabelColor(bimestreStats.mediaBimestral)}`}>
                  {gradeLabel(bimestreStats.mediaBimestral)}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Fórmula */}
          <div className="mb-6 p-3 bg-white rounded-lg border text-xs text-muted-foreground">
            <strong className="text-foreground">Fórmula:</strong>{" "}
            Bloco 1 = (Ativ. Trilha + Ativ. Sala) / 2 &nbsp;|&nbsp; Bloco 2 = Prova &nbsp;|&nbsp;{" "}
            <strong className="text-foreground">Média Bimestral</strong> = (Bloco 1 + Bloco 2) / 2
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white animate-pulse rounded-xl" />
              ))}
            </div>
          ) : bimestreStats.totalItems === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">
                  Nenhuma nota no {selectedBimestre}º Bimestre
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete exercícios, envie atividades ou realize provas para ver suas notas aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Exercícios Online (Atividade da Trilha) */}
              {filteredExercises.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Atividades da Trilha (Exercícios Online)
                  </h2>
                  <div className="space-y-3">
                    {filteredExercises.map((subject: any) => (
                      <ExerciseSubjectCard
                        key={`ex-${subject.subjectId}`}
                        subject={subject}
                        isExpanded={expandedSubjects.has(`ex-${subject.subjectId}-${selectedBimestre}`)}
                        onToggle={() => toggleSubject(`ex-${subject.subjectId}-${selectedBimestre}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Atividades em Sala */}
              {filteredActivities.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Atividades em Sala
                  </h2>
                  <div className="space-y-3">
                    {filteredActivities.map((subject: any) => (
                      <ActivitySubjectCard
                        key={`act-${subject.subjectId}`}
                        subject={subject}
                        isExpanded={expandedSubjects.has(`act-${subject.subjectId}-${selectedBimestre}`)}
                        onToggle={() => toggleSubject(`act-${subject.subjectId}-${selectedBimestre}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Provas */}
              {filteredAssessments.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                    Provas
                  </h2>
                  <div className="space-y-3">
                    <AssessmentList assessments={filteredAssessments} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resumo de todos os bimestres */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Resumo Anual
            </h2>
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Bimestre</th>
                        <th className="text-center py-3 px-2 font-semibold text-blue-600">Bloco 1</th>
                        <th className="text-center py-3 px-2 font-semibold text-purple-600">Bloco 2</th>
                        <th className="text-center py-3 px-2 font-semibold text-foreground">Média Bim.</th>
                        <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allBimestresOverview.map((bim) => (
                        <tr
                          key={bim.bimestre}
                          className={`border-b hover:bg-muted/50 transition-colors ${
                            bim.bimestre === selectedBimestre ? "bg-primary/5" : ""
                          }`}
                        >
                          <td className="py-3 px-3 font-medium text-foreground">
                            {bim.label}estre
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`font-bold ${gradeColor(bim.bloco1)}`}>
                              {fmtGrade(bim.bloco1)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`font-bold ${gradeColor(bim.bloco2)}`}>
                              {fmtGrade(bim.bloco2)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`text-lg font-bold ${gradeColor(bim.media)}`}>
                              {fmtGrade(bim.media)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <Badge variant="outline" className={gradeLabelColor(bim.media)}>
                              {gradeLabel(bim.media)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

// ─── Componente: Lista de provas ─────────────────────────────────────────────

function AssessmentList({ assessments }: { assessments: any[] }) {
  return (
    <div className="space-y-3">
      {assessments.map((a: any, i: number) => {
        const totalPoints = parseFloat(String(a.totalPoints ?? 10));
        const score = parseFloat(String(a.score ?? 0));
        const grade10 = totalPoints > 0 ? parseFloat(((score / totalPoints) * 10).toFixed(1)) : 0;
        const passed = !!a.passed;

        return (
          <div key={a.attemptId ?? i} className={`p-4 rounded-lg border ${gradeBg(grade10)}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {passed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{a.title}</p>
                  {a.subjectName && (
                    <p className="text-xs text-muted-foreground mt-0.5">{a.subjectName}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  {score}/{totalPoints} pts
                </Badge>
                <div className="text-right">
                  <p className={`text-lg font-bold ${gradeColor(grade10)}`}>{grade10.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">de 10,0</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-current/10">
              <Badge
                variant="outline"
                className={passed
                  ? "bg-green-50 text-green-700 border-green-200 text-xs"
                  : "bg-red-50 text-red-700 border-red-200 text-xs"}
              >
                {passed ? "Aprovado" : "Reprovado"}
              </Badge>
              {a.submittedAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {fmtDate(a.submittedAt)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente: Card de disciplina (Exercícios Online) ─────────────────────

function ExerciseSubjectCard({
  subject,
  isExpanded,
  onToggle,
}: {
  subject: any;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const approvalRate =
    subject.totalAttempts > 0
      ? Math.round((subject.approvedCount / subject.totalAttempts) * 100)
      : 0;

  return (
    <Card className="overflow-hidden">
      <button className="w-full text-left" onClick={onToggle}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{subject.subjectName}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    {subject.totalAttempts} exercício{subject.totalAttempts !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{approvalRate}% aprovação</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
              <div className="text-right">
                <p className={`text-xl font-bold ${gradeColor(subject.average)}`}>
                  {subject.average.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">média</p>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
      </button>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="border-t pt-4 space-y-2">
            {subject.grades.map((g: any) => (
              <div
                key={g.attemptId}
                className={`flex items-center justify-between p-3 rounded-lg border ${gradeBg(g.grade)}`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {g.approved ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-foreground truncate">{g.exerciseTitle}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-sm font-bold ${gradeColor(g.grade)}`}>{g.grade.toFixed(1)}</span>
                  {g.completedAt && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {fmtDate(g.completedAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Componente: Card de disciplina (Atividades em Sala) ────────────────────

function ActivitySubjectCard({
  subject,
  isExpanded,
  onToggle,
}: {
  subject: any;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const approvalRate =
    subject.totalGraded > 0
      ? Math.round((subject.approvedCount / subject.totalGraded) * 100)
      : 0;

  return (
    <Card className="overflow-hidden">
      <button className="w-full text-left" onClick={onToggle}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{subject.subjectName}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    {subject.totalGraded} atividade{subject.totalGraded !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{approvalRate}% aprovação</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
              <div className="text-right">
                <p className={`text-xl font-bold ${gradeColor(subject.average)}`}>
                  {subject.average.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">média</p>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
      </button>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="border-t pt-4 space-y-2">
            {subject.grades.map((g: any) => (
              <div
                key={g.submissionId}
                className={`p-3 rounded-lg border ${gradeBg(g.grade10)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {g.grade10 >= 6 ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-foreground truncate">{g.activityTitle}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {g.score}/{g.maxScore}
                    </Badge>
                    <span className={`text-sm font-bold ${gradeColor(g.grade10)}`}>{g.grade10.toFixed(1)}</span>
                    {g.gradedAt && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {fmtDate(g.gradedAt)}
                      </span>
                    )}
                  </div>
                </div>
                {g.feedback && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground bg-background/50 p-2 rounded">
                    <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{g.feedback}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
