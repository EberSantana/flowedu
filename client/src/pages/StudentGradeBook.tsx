import { useState } from "react";
import { trpc } from "@/lib/trpc";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

function formatDate(date: Date | null | string): string {
  if (!date) return "—";
  const d = new Date(date);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const mins = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

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
  const { data: gradeBook, isLoading } = trpc.studentExercises.getGradeBook.useQuery();
  const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(new Set());

  const toggleSubject = (subjectId: number) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  const totalAttempts = gradeBook?.reduce((s, sub) => s + sub.totalAttempts, 0) ?? 0;
  const totalApproved = gradeBook?.reduce((s, sub) => s + sub.approvedCount, 0) ?? 0;
  const overallAverage =
    gradeBook && gradeBook.length > 0
      ? (gradeBook.reduce((s, sub) => s + sub.average, 0) / gradeBook.length).toFixed(2)
      : "—";

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
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{gradeBook?.length ?? 0}</p>
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
                    {totalAttempts > 0 ? Math.round((totalApproved / totalAttempts) * 100) : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">taxa de aprovação</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : !gradeBook || gradeBook.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">Nenhuma nota registrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete exercícios para ver suas notas aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {gradeBook.map((subject) => {
              const isExpanded = expandedSubjects.has(subject.subjectId);
              const approvalRate =
                subject.totalAttempts > 0
                  ? Math.round((subject.approvedCount / subject.totalAttempts) * 100)
                  : 0;

              return (
                <Card key={subject.subjectId} className="overflow-hidden">
                  {/* Cabeçalho da disciplina */}
                  <button
                    className="w-full text-left"
                    onClick={() => toggleSubject(subject.subjectId)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{subject.subjectName}</CardTitle>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-muted-foreground">
                                {subject.totalAttempts} atividade{subject.totalAttempts !== 1 ? "s" : ""}
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

                  {/* Tabela de notas */}
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="border-t pt-4">
                        <div className="space-y-2">
                          {/* Cabeçalho da tabela */}
                          <div className="grid grid-cols-12 gap-2 px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            <span className="col-span-5">Atividade</span>
                            <span className="col-span-2 text-center">Questões</span>
                            <span className="col-span-2 text-center">Pt/Questão</span>
                            <span className="col-span-1 text-center">Nota</span>
                            <span className="col-span-2 text-right">Data</span>
                          </div>

                          {subject.grades.map((g) => (
                            <div
                              key={g.attemptId}
                              className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-lg border ${gradeBg(g.grade, g.passingGrade)}`}
                            >
                              {/* Título da atividade */}
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

                              {/* Questões */}
                              <div className="col-span-2 flex items-center justify-center">
                                <span className="text-sm text-muted-foreground">{g.totalQuestions}</span>
                              </div>

                              {/* Pontos por questão */}
                              <div className="col-span-2 flex items-center justify-center">
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {g.pointsPerQuestion % 1 === 0
                                    ? `${g.pointsPerQuestion} pt`
                                    : `${g.pointsPerQuestion.toFixed(2)} pt`}
                                </Badge>
                              </div>

                              {/* Nota */}
                              <div className="col-span-1 flex items-center justify-center">
                                <span className={`text-sm font-bold ${gradeColor(g.grade, g.passingGrade)}`}>
                                  {g.grade.toFixed(1)}
                                </span>
                              </div>

                              {/* Data */}
                              <div className="col-span-2 flex items-center justify-end gap-1">
                                <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {g.completedAt
                                    ? (() => {
                                        const d = new Date(g.completedAt);
                                        return `${String(d.getUTCDate()).padStart(2,"0")}/${String(d.getUTCMonth()+1).padStart(2,"0")}/${d.getUTCFullYear()}`;
                                      })()
                                    : "—"}
                                </span>
                              </div>
                            </div>
                          ))}

                          {/* Rodapé com média da disciplina */}
                          <div className="flex items-center justify-between px-3 pt-2 border-t mt-2">
                            <span className="text-sm font-semibold text-foreground">
                              Média da disciplina
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${gradeColor(subject.average, 6)}`}>
                                {subject.average.toFixed(1)}
                              </span>
                              <Badge
                                variant="outline"
                                className={subject.average >= 6
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-red-50 text-red-700 border-red-200"}
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
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
