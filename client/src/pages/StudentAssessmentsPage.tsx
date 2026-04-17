import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  BookOpen,
  Clock,
  Hash,
  Calendar,
  User,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  FileText,
  Play,
  Trophy,
  ClipboardCheck,
  KeyRound,
  LockKeyhole,
} from "lucide-react";
import StudentLayout from "@/components/StudentLayout";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function StudentAssessmentsPage() {
  const [, navigate] = useLocation();
  const [viewQuestionsId, setViewQuestionsId] = useState<number | null>(null);
  const [viewQuestionsTitle, setViewQuestionsTitle] = useState<string>("");
  const [viewQuestionsSubmitted, setViewQuestionsSubmitted] = useState<boolean>(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const { data: assessments = [], isLoading } = trpc.learningPath.getAllStudentAssessments.useQuery();

  const { data: assessmentQuestions, isLoading: loadingQuestions } =
    trpc.learningPath.getStudentAssessmentQuestions.useQuery(
      { assessmentId: viewQuestionsId! },
      { enabled: viewQuestionsId !== null }
    );

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "—";
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      prova: "Prova",
      simulado: "Simulado",
      trabalho: "Trabalho",
      quiz: "Quiz",
    };
    return labels[type] || type || "Avaliação";
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      multiple_choice: "Múltipla Escolha",
      true_false: "V ou F",
      essay: "Dissertativa",
      short_answer: "Resposta Curta",
      fill_blank: "Lacunas",
    };
    return labels[type] || type;
  };

  const getDifficultyBadge = (difficulty: string) => {
    if (difficulty === "easy")
      return <Badge className="bg-green-100 text-green-700 text-xs">Fácil</Badge>;
    if (difficulty === "hard")
      return <Badge className="bg-red-100 text-red-700 text-xs">Difícil</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Médio</Badge>;
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header gradiente padrão */}
        <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <ClipboardCheck className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Minhas Provas</h1>
                <p className="text-primary-foreground/80 mt-1">Visualize e realize suas provas e avaliações</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">

        {/* Conteúdo */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Carregando provas...</p>
          </div>
        ) : assessments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="font-medium text-foreground">Nenhuma prova disponível</p>
              <p className="text-muted-foreground text-sm mt-1">
                Quando seu professor publicar uma prova, ela aparecerá aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {(assessments as any[]).map((assessment: any) => (
              <Card
                key={assessment.id}
                className="border border-border hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">
                          {assessment.title}
                        </h3>
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                          {getTypeLabel(assessment.assessmentType)}
                        </Badge>
                      </div>

                      {assessment.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {assessment.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        {assessment.subjectName && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            {assessment.subjectName}
                          </span>
                        )}
                        {assessment.teacherName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {assessment.teacherName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Hash className="h-3.5 w-3.5" />
                          {assessment.totalQuestions} questões · {assessment.totalPoints} pts
                        </span>
                        {assessment.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {assessment.duration} min
                          </span>
                        )}
                        {assessment.applicationDate && (
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <Calendar className="h-3.5 w-3.5" />
                            Aplicação: {formatDate(assessment.applicationDate)}
                          </span>
                        )}
                      </div>

                      {assessment.generalInstructions && (
                        <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-primary/30 pl-2">
                          {assessment.generalInstructions}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setViewQuestionsId(assessment.id);
                          setViewQuestionsTitle(assessment.title);
                          setViewQuestionsSubmitted(assessment.attemptStatus === 'submitted');
                          setExpandedQuestion(null);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Ver Questões
                      </Button>
                      {assessment.attemptStatus === 'submitted' ? (
                        <Badge className="bg-green-100 text-green-700 border-green-300 gap-1">
                          <Trophy className="h-3 w-3" />
                          Realizada
                        </Badge>
                      ) : (assessment as any).isLocked ? (
                        <div className="flex flex-col items-end gap-1">
                          <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Prazo Encerrado
                          </Badge>
                          <span className="text-xs text-muted-foreground">Solicite permissão ao professor</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          onClick={() => navigate(`/student/exam/${assessment.id}`)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Realizar Prova
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Questões */}
      <Dialog
        open={viewQuestionsId !== null}
        onOpenChange={(open) => !open && setViewQuestionsId(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-primary" />
              {viewQuestionsTitle}
            </DialogTitle>
          </DialogHeader>

          {/* Nota obtida pelo aluno */}
          {(() => {
            const data = assessmentQuestions as any;
            const attempt = data?.attempt;
            if (!attempt) return null;
            const passed = !!attempt.passed;
            return (
              <div className={`flex items-center gap-3 rounded-lg p-3 border ${
                passed
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {passed
                  ? <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  : <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                }
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    Sua nota: {attempt.score} / {attempt.totalPoints} pontos
                    {attempt.percentage != null && (
                      <span className="ml-2 text-xs font-normal opacity-75">({attempt.percentage}%)</span>
                    )}
                  </p>
                  <p className="text-xs mt-0.5">{passed ? 'Aprovado' : 'Reprovado'}</p>
                </div>
              </div>
            );
          })()}

          {/* Aviso de gabarito */}
          {viewQuestionsSubmitted && (() => {
            const data = assessmentQuestions as any;
            const released = data?.answerKeyReleased;
            if (released) {
              return (
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
                  <KeyRound className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                  <span>O professor liberou o gabarito. As respostas corretas e justificativas estão visíveis abaixo.</span>
                </div>
              );
            }
            return (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <LockKeyhole className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                <span>Você já realizou esta prova. O gabarito e as justificativas das respostas não estão disponíveis.</span>
              </div>
            );
          })()}

          {loadingQuestions ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando questões...
            </div>
          ) : !assessmentQuestions || !(assessmentQuestions as any)?.questions || (assessmentQuestions as any).questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Nenhuma questão disponível para esta prova.</p>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              <p className="text-sm text-muted-foreground">
                {(assessmentQuestions as any).questions.length} questão(ões)
              </p>
              {(assessmentQuestions as any).questions.map((q: any, idx: number) => {
                const isExpanded = expandedQuestion === idx;
                const statement = q.statement || q.questionText || "";
                const options: { label: string; text: string }[] = [];
                if (q.optionA) options.push({ label: "A", text: q.optionA });
                if (q.optionB) options.push({ label: "B", text: q.optionB });
                if (q.optionC) options.push({ label: "C", text: q.optionC });
                if (q.optionD) options.push({ label: "D", text: q.optionD });
                if (q.optionE) options.push({ label: "E", text: q.optionE });

                let parsedOptions = options;
                if (options.length === 0 && q.options) {
                  try {
                    const parsed =
                      typeof q.options === "string"
                        ? JSON.parse(q.options)
                        : q.options;
                    if (Array.isArray(parsed)) {
                      parsedOptions = parsed.map((o: string, i: number) => ({
                        label: String.fromCharCode(65 + i),
                        text: o,
                      }));
                    }
                  } catch {}
                }

                return (
                  <Card key={q.id || idx} className="border border-border">
                    <CardContent className="p-0">
                      <button
                        className="w-full text-left p-3 flex items-start justify-between gap-3 hover:bg-accent/50 transition-colors rounded-lg"
                        onClick={() =>
                          setExpandedQuestion(isExpanded ? null : idx)
                        }
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                            {q.questionNumber || idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-2">
                              {statement}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-muted-foreground">
                                {getQuestionTypeLabel(
                                  q.questionType || "multiple_choice"
                                )}
                              </span>
                              {getDifficultyBadge(q.difficulty || "medium")}
                              <span className="text-xs text-muted-foreground">
                                {q.points || 1} pt(s)
                              </span>
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                          {q.context && (
                            <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-3 text-sm text-blue-800 dark:text-blue-300">
                              <strong>Contexto:</strong> {q.context}
                            </div>
                          )}
                          {parsedOptions.length > 0 && (
                            <div className="space-y-1.5">
                              {parsedOptions.map((opt) => {
                                const isCorrect = q.correctAnswer && q.correctAnswer.trim().toUpperCase().charAt(0) === opt.label;
                                return (
                                  <div
                                    key={opt.label}
                                    className={`flex items-start gap-2 p-2 rounded text-sm ${
                                      isCorrect
                                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                                        : 'bg-muted/50 text-foreground'
                                    }`}
                                  >
                                    <span className={`font-bold flex-shrink-0 ${
                                      isCorrect ? 'text-emerald-700' : 'text-muted-foreground'
                                    }`}>
                                      {opt.label})
                                    </span>
                                    <span>{opt.text}</span>
                                    {isCorrect && (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 ml-auto mt-0.5" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {parsedOptions.length === 0 && (
                            <div className="text-sm text-muted-foreground italic">
                              Questão dissertativa / resposta aberta
                            </div>
                          )}
                          {/* Justificativa da resposta - exibida apenas quando gabarito liberado */}
                          {q.answerExplanation && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">
                              <p className="font-semibold mb-1 flex items-center gap-1.5">
                                <KeyRound className="h-3.5 w-3.5" />
                                Justificativa:
                              </p>
                              <p>{q.answerExplanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
    </StudentLayout>
  );
}
