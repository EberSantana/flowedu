import { useState } from "react";
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
} from "lucide-react";

function gradeColor(grade: number, passingGrade: number): string {
  if (grade >= passingGrade) return "text-green-700";
  if (grade >= passingGrade * 0.7) return "text-yellow-700";
  return "text-red-700";
}

function gradeBg(grade: number, passingGrade: number): string {
  if (grade >= passingGrade) return "bg-green-50 border-green-200";
  if (grade >= passingGrade * 0.7) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

export default function StudentGradeBook() {
  const { data: gradeBook, isLoading: loadingExercises } = trpc.studentExercises.getGradeBook.useQuery();
  const { data: activityGrades, isLoading: loadingActivities } = trpc.studentExercises.getActivityGrades.useQuery();
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("all");

  const toggleSubject = (key: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Exercícios online
  const totalExerciseAttempts = gradeBook?.reduce((s, sub) => s + sub.totalAttempts, 0) ?? 0;
  const totalExerciseApproved = gradeBook?.reduce((s, sub) => s + sub.approvedCount, 0) ?? 0;
  const exerciseAverage =
    gradeBook && gradeBook.length > 0
      ? (gradeBook.reduce((s, sub) => s + sub.average, 0) / gradeBook.length).toFixed(2)
      : "—";

  // Atividades em sala
  const totalActivityGraded = activityGrades?.reduce((s, sub) => s + sub.totalGraded, 0) ?? 0;
  const totalActivityApproved = activityGrades?.reduce((s, sub) => s + sub.approvedCount, 0) ?? 0;
  const activityAverage =
    activityGrades && activityGrades.length > 0
      ? (activityGrades.reduce((s, sub) => s + sub.average, 0) / activityGrades.length).toFixed(2)
      : "—";

  // Média geral combinada
  const allAverages: number[] = [];
  if (gradeBook) gradeBook.forEach((s) => { if (s.totalAttempts > 0) allAverages.push(s.average); });
  if (activityGrades) activityGrades.forEach((s) => { if (s.totalGraded > 0) allAverages.push(s.average); });
  const overallAverage = allAverages.length > 0
    ? (allAverages.reduce((a, b) => a + b, 0) / allAverages.length).toFixed(2)
    : "—";

  const isLoading = loadingExercises || loadingActivities;

  return (
    <StudentLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Boletim</h1>
            <p className="text-sm text-muted-foreground">Histórico de notas por disciplina (escala 0–10)</p>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {(gradeBook?.length ?? 0) + (activityGrades?.length ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">disciplinas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{overallAverage}</p>
                  <p className="text-xs text-muted-foreground">média geral</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {totalExerciseAttempts + totalActivityGraded > 0
                      ? Math.round(((totalExerciseApproved + totalActivityApproved) / (totalExerciseAttempts + totalActivityGraded)) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">aprovação</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {totalExerciseAttempts + totalActivityGraded}
                  </p>
                  <p className="text-xs text-muted-foreground">avaliações</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todas as Notas</TabsTrigger>
            <TabsTrigger value="exercises">Exercícios Online</TabsTrigger>
            <TabsTrigger value="activities">Atividades em Sala</TabsTrigger>
          </TabsList>

          {/* Conteúdo */}
          {isLoading ? (
            <div className="space-y-4 mt-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Tab: Todas as Notas */}
              <TabsContent value="all" className="space-y-6 mt-6">
                {/* Exercícios Online */}
                {gradeBook && gradeBook.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      Exercícios Online
                    </h2>
                    <div className="space-y-3">
                      {gradeBook.map((subject) => (
                        <ExerciseSubjectCard
                          key={`ex-${subject.subjectId}`}
                          subject={subject}
                          isExpanded={expandedSubjects.has(`ex-${subject.subjectId}`)}
                          onToggle={() => toggleSubject(`ex-${subject.subjectId}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Atividades em Sala */}
                {activityGrades && activityGrades.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      Atividades em Sala
                    </h2>
                    <div className="space-y-3">
                      {activityGrades.map((subject) => (
                        <ActivitySubjectCard
                          key={`act-${subject.subjectId}`}
                          subject={subject}
                          isExpanded={expandedSubjects.has(`act-${subject.subjectId}`)}
                          onToggle={() => toggleSubject(`act-${subject.subjectId}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {(!gradeBook || gradeBook.length === 0) && (!activityGrades || activityGrades.length === 0) && (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground">Nenhuma nota registrada</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Complete exercícios ou envie atividades para ver suas notas aqui.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab: Exercícios Online */}
              <TabsContent value="exercises" className="space-y-4 mt-6">
                {gradeBook && gradeBook.length > 0 ? (
                  gradeBook.map((subject) => (
                    <ExerciseSubjectCard
                      key={`exonly-${subject.subjectId}`}
                      subject={subject}
                      isExpanded={expandedSubjects.has(`exonly-${subject.subjectId}`)}
                      onToggle={() => toggleSubject(`exonly-${subject.subjectId}`)}
                    />
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground">Nenhum exercício avaliado</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Complete exercícios online para ver suas notas aqui.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab: Atividades em Sala */}
              <TabsContent value="activities" className="space-y-4 mt-6">
                {activityGrades && activityGrades.length > 0 ? (
                  activityGrades.map((subject) => (
                    <ActivitySubjectCard
                      key={`actonly-${subject.subjectId}`}
                      subject={subject}
                      isExpanded={expandedSubjects.has(`actonly-${subject.subjectId}`)}
                      onToggle={() => toggleSubject(`actonly-${subject.subjectId}`)}
                    />
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground">Nenhuma atividade avaliada</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Envie atividades em sala e aguarde a avaliação do professor.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </StudentLayout>
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
                  <span className="text-xs text-muted-foreground">
                    {subject.approvedCount} aprovado{subject.approvedCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{approvalRate}% aprovação</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
              <div className="text-right">
                <p className={`text-xl font-bold ${gradeColor(subject.average, 6)}`}>
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
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span className="col-span-5">Atividade</span>
                <span className="col-span-2 text-center">Questões</span>
                <span className="col-span-2 text-center">Pt/Questão</span>
                <span className="col-span-1 text-center">Nota</span>
                <span className="col-span-2 text-right">Data</span>
              </div>

              {subject.grades.map((g: any) => (
                <div
                  key={g.attemptId}
                  className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-lg border ${gradeBg(g.grade, g.passingGrade)}`}
                >
                  <div className="col-span-5 flex items-center gap-2 min-w-0">
                    {g.approved ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-foreground truncate">
                      {g.exerciseTitle}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">{g.totalQuestions}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {g.pointsPerQuestion % 1 === 0
                        ? `${g.pointsPerQuestion} pt`
                        : `${g.pointsPerQuestion.toFixed(2)} pt`}
                    </Badge>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <span className={`text-sm font-bold ${gradeColor(g.grade, g.passingGrade)}`}>
                      {g.grade.toFixed(1)}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {g.completedAt
                        ? (() => {
                            const d = new Date(g.completedAt);
                            return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
                          })()
                        : "—"}
                    </span>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between px-3 pt-2 border-t mt-2">
                <span className="text-sm font-semibold text-foreground">Média da disciplina</span>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${gradeColor(subject.average, 6)}`}>
                    {subject.average.toFixed(1)}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      subject.average >= 6
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }
                  >
                    {subject.average >= 6 ? "Aprovado" : "Em recuperação"}
                  </Badge>
                </div>
              </div>
            </div>
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
                    {subject.totalGraded} atividade{subject.totalGraded !== 1 ? "s" : ""} avaliada{subject.totalGraded !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {subject.approvedCount} aprovada{subject.approvedCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{approvalRate}% aprovação</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
              <div className="text-right">
                <p className={`text-xl font-bold ${gradeColor(subject.average, 6)}`}>
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
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span className="col-span-4">Atividade</span>
                <span className="col-span-2 text-center">Nota</span>
                <span className="col-span-1 text-center">Escala</span>
                <span className="col-span-3 text-center">Feedback</span>
                <span className="col-span-2 text-right">Avaliado em</span>
              </div>

              {subject.grades.map((g: any) => {
                const approved = g.grade10 >= 6;
                return (
                  <div
                    key={g.submissionId}
                    className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-lg border ${gradeBg(g.grade10, 6)}`}
                  >
                    {/* Título */}
                    <div className="col-span-4 flex items-center gap-2 min-w-0">
                      {approved ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-foreground truncate">
                        {g.activityTitle}
                      </span>
                    </div>

                    {/* Nota original */}
                    <div className="col-span-2 flex items-center justify-center">
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {g.score}/{g.maxScore}
                      </Badge>
                    </div>

                    {/* Nota escala 0-10 */}
                    <div className="col-span-1 flex items-center justify-center">
                      <span className={`text-sm font-bold ${gradeColor(g.grade10, 6)}`}>
                        {g.grade10.toFixed(1)}
                      </span>
                    </div>

                    {/* Feedback */}
                    <div className="col-span-3 flex items-center justify-center">
                      {g.feedback ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground truncate" title={g.feedback}>
                          <MessageSquare className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{g.feedback}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>

                    {/* Data de avaliação */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {g.gradedAt
                          ? (() => {
                              const d = new Date(g.gradedAt);
                              return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
                            })()
                          : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Rodapé com média */}
              <div className="flex items-center justify-between px-3 pt-2 border-t mt-2">
                <span className="text-sm font-semibold text-foreground">Média da disciplina</span>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${gradeColor(subject.average, 6)}`}>
                    {subject.average.toFixed(1)}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      subject.average >= 6
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }
                  >
                    {subject.average >= 6 ? "Aprovado" : "Em recuperação"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
