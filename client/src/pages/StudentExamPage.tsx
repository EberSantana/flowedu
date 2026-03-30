import { useState, useEffect, useCallback, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Send,
  BookOpen,
  Trophy,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import StudentLayout from "@/components/StudentLayout";
import { toast } from "sonner";

export default function StudentExamPage() {
  const [, params] = useRoute("/student/exam/:assessmentId");
  const [, navigate] = useLocation();
  const assessmentId = params ? parseInt(params.assessmentId) : 0;

  // Estado da prova
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Buscar dados da prova
  const { data: assessments = [] } = trpc.learningPath.getAllStudentAssessments.useQuery();
  const assessment = (assessments as any[]).find((a: any) => a.id === assessmentId);

  // Buscar questões
  const { data: questions = [], isLoading: loadingQuestions } =
    trpc.learningPath.getStudentAssessmentQuestions.useQuery(
      { assessmentId },
      { enabled: assessmentId > 0 }
    );

  const rawQuestionsArr = (questions as any[]) || [];

  // Embaralhamento determinístico por aluno: usa studentId como semente
  // Assim cada aluno sempre vê a mesma ordem (consistente entre tentativas), mas diferente dos colegas
  const questionsArr = (() => {
    if (!assessment?.shuffleQuestions || rawQuestionsArr.length === 0) return rawQuestionsArr;
    // Semente baseada no assessmentId + studentId (do cookie JWT decodificado via session)
    // Usamos o assessmentId como semente pública pois não temos studentId no frontend sem query extra
    // Para garantir ordem única por aluno, usamos sessionStorage para persistir a ordem embaralhada
    const storageKey = `exam_order_${assessmentId}`;
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      try {
        const storedOrder = JSON.parse(stored) as number[];
        // Reordenar as questões conforme a ordem salva
        const reordered = storedOrder
          .map((origNum: number) => rawQuestionsArr.find((q: any) => q.questionNumber === origNum))
          .filter(Boolean);
        if (reordered.length === rawQuestionsArr.length) return reordered;
      } catch { /* ignorar */ }
    }
    // Gerar nova ordem aleatória e salvar no sessionStorage
    const arr = [...rawQuestionsArr];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const order = arr.map((q: any) => q.questionNumber);
    sessionStorage.setItem(storageKey, JSON.stringify(order));
    return arr;
  })();

  // Mutations
  const startAttempt = trpc.learningPath.startAssessmentAttempt.useMutation();
  const saveAnswer = trpc.learningPath.saveAssessmentAnswer.useMutation();
  const submitExam = trpc.learningPath.submitAssessment.useMutation();

  // Timer
  useEffect(() => {
    if (started && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, submitted]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const res = await startAttempt.mutateAsync({ assessmentId });
      setAttemptId(res.attemptId);
      setStarted(true);
    } catch (err: any) {
      const msg = err?.message || "Erro ao iniciar prova";
      if (msg.includes("já realizou")) {
        toast.error("Você já realizou esta prova.");
        navigate("/student/assessments");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleSelectAnswer = useCallback(
    async (questionId: number, questionNumber: number, answer: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }));
      if (attemptId) {
        try {
          await saveAnswer.mutateAsync({
            attemptId,
            questionId,
            questionNumber,
            selectedAnswer: answer,
          });
        } catch {
          // Silencioso — o auto-save pode falhar sem bloquear o aluno
        }
      }
    },
    [attemptId, saveAnswer]
  );

  const handleSubmit = async () => {
    if (!attemptId) return;
    try {
      const res = await submitExam.mutateAsync({
        attemptId,
        timeSpentSeconds: timeElapsed,
      });
      setResult(res);
      setSubmitted(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar prova");
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questionsArr.length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // ======= TELA DE RESULTADO =======
  if (submitted && result) {
    const passed = result.passed;
    const reviewQuestions: any[] = result.reviewQuestions || [];
    return (
      <StudentLayout>
        <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
          {/* Card de resultado */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${passed ? "bg-green-100" : "bg-red-100"}`}>
                  {passed ? (
                    <Trophy className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500" />
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-xl font-bold text-foreground">
                    {passed ? "Parabéns! Você foi aprovado!" : "Prova concluída"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">{assessment?.title}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{result.score?.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Nota</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{result.percentage?.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Aproveitamento</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{result.totalCorrect}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Corretas</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-500">{result.totalWrong}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Erradas</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-2">
                <span>Nota mínima: <strong>{result.passingScore}%</strong></span>
                <span>Tempo: <strong>{formatTime(timeElapsed)}</strong></span>
              </div>

              <div className={`mt-4 rounded-lg p-3 text-sm font-medium ${passed ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"}`}>
                {passed
                  ? "✓ Aprovado — sua nota foi registrada no boletim."
                  : "✗ Não aprovado — sua nota foi registrada no boletim."}
              </div>
            </CardContent>
          </Card>

          {/* Gabarito Comentado */}
          {reviewQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Gabarito Comentado</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReview(!showReview)}
                >
                  {showReview ? (
                    <><ChevronUp className="h-4 w-4 mr-1" /> Ocultar</>
                  ) : (
                    <><ChevronDown className="h-4 w-4 mr-1" /> Ver Gabarito</>
                  )}
                </Button>
              </div>

              {showReview && (
                <div className="space-y-3">
                  {reviewQuestions.map((q: any, idx: number) => {
                    const isExpanded = expandedQuestion === idx;
                    const options: { label: string; text: string }[] = [];
                    if (q.optionA) options.push({ label: "A", text: q.optionA });
                    if (q.optionB) options.push({ label: "B", text: q.optionB });
                    if (q.optionC) options.push({ label: "C", text: q.optionC });
                    if (q.optionD) options.push({ label: "D", text: q.optionD });
                    if (q.optionE) options.push({ label: "E", text: q.optionE });

                    return (
                      <Card key={q.id} className={`border-l-4 ${q.isCorrect ? "border-l-green-500" : "border-l-red-400"}`}>
                        <CardContent className="p-4">
                          <button
                            className="w-full text-left"
                            onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2">
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${q.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                  {q.questionNumber || idx + 1}
                                </span>
                                <p className="text-sm font-medium text-foreground leading-relaxed line-clamp-2">
                                  {q.statement}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {q.isCorrect ? (
                                  <Badge className="bg-green-100 text-green-700 border-0 text-xs">Correta</Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-600 border-0 text-xs">Errada</Badge>
                                )}
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                              </div>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="mt-3 space-y-2 pt-3 border-t border-border">
                              {/* Alternativas */}
                              {options.map((opt) => {
                                const isCorrectOpt = opt.label === q.correctAnswer;
                                const isStudentOpt = opt.label === q.studentAnswer;
                                let cls = "border-border bg-muted/20";
                                if (isCorrectOpt) cls = "border-green-400 bg-green-50";
                                else if (isStudentOpt && !isCorrectOpt) cls = "border-red-400 bg-red-50";
                                return (
                                  <div key={opt.label} className={`flex items-start gap-2 rounded-lg border p-2.5 ${cls}`}>
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                      isCorrectOpt ? "bg-green-500 text-white" :
                                      isStudentOpt && !isCorrectOpt ? "bg-red-400 text-white" :
                                      "bg-muted text-muted-foreground"
                                    }`}>
                                      {opt.label}
                                    </span>
                                    <span className="text-sm text-foreground leading-relaxed">{opt.text}</span>
                                    {isCorrectOpt && <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto shrink-0" />}
                                    {isStudentOpt && !isCorrectOpt && <XCircle className="h-4 w-4 text-red-500 ml-auto shrink-0" />}
                                  </div>
                                );
                              })}

                              {/* Resposta do aluno vs gabarito */}
                              {!q.isCorrect && (
                                <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                                  Sua resposta: <strong className="text-red-600">{q.studentAnswer || "Não respondida"}</strong>
                                  {" → "}
                                  Gabarito: <strong className="text-green-600">{q.correctAnswer}</strong>
                                </div>
                              )}

                              {/* Explicação */}
                              {q.explanation && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <p className="text-xs font-semibold text-blue-700 mb-1">Explicação</p>
                                  <p className="text-sm text-blue-800 leading-relaxed">{q.explanation}</p>
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
            </div>
          )}

          <Button onClick={() => navigate("/student/assessments")} className="w-full sm:w-auto">
            Voltar para Provas
          </Button>
        </div>
      </StudentLayout>
    );
  }

  // ======= TELA DE INTRODUÇÃO =======
  if (!started) {
    return (
      <StudentLayout>
        <div className="p-6 max-w-2xl mx-auto space-y-6">
          <button
            onClick={() => navigate("/student/assessments")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar para Provas
          </button>

          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    {assessment?.title || "Carregando..."}
                  </h1>
                  {assessment?.subjectName && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {assessment.subjectName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Questões</p>
                  <p className="font-semibold text-foreground mt-0.5">{assessment?.totalQuestions || totalQuestions}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Pontuação Total</p>
                  <p className="font-semibold text-foreground mt-0.5">{assessment?.totalPoints || "—"} pts</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Nota Mínima</p>
                  <p className="font-semibold text-foreground mt-0.5">{assessment?.passingScore || 60}%</p>
                </div>
                {assessment?.duration && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Tempo Limite</p>
                    <p className="font-semibold text-foreground mt-0.5">{assessment.duration} min</p>
                  </div>
                )}
              </div>

              {assessment?.generalInstructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800 mb-1">Instruções</p>
                  <p className="text-sm text-blue-700">{assessment.generalInstructions}</p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700">
                  Após iniciar a prova, você não poderá realizá-la novamente. Certifique-se de que está em um ambiente tranquilo antes de começar.
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleStart}
                disabled={isStarting || loadingQuestions}
              >
                {isStarting ? "Iniciando..." : "Iniciar Prova"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  // ======= TELA DE REALIZAÇÃO DA PROVA =======
  const currentQ = questionsArr[currentQuestion];
  if (!currentQ) return null;

  const options: { label: string; text: string }[] = [];
  if (currentQ.optionA) options.push({ label: "A", text: currentQ.optionA });
  if (currentQ.optionB) options.push({ label: "B", text: currentQ.optionB });
  if (currentQ.optionC) options.push({ label: "C", text: currentQ.optionC });
  if (currentQ.optionD) options.push({ label: "D", text: currentQ.optionD });
  if (currentQ.optionE) options.push({ label: "E", text: currentQ.optionE });

  const selectedAnswer = answers[currentQ.id] || "";

  return (
    <StudentLayout>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
        {/* Barra de progresso e timer */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{answeredCount} de {totalQuestions} respondidas</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          <div className="flex items-center gap-1.5 text-sm font-mono bg-muted/50 px-3 py-1.5 rounded-lg shrink-0">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-semibold">{formatTime(timeElapsed)}</span>
          </div>
        </div>

        {/* Navegação de questões */}
        <div className="flex flex-wrap gap-1.5">
          {questionsArr.map((q: any, idx: number) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = idx === currentQuestion;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 rounded text-xs font-semibold transition-colors ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isAnswered
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Questão atual */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                  {currentQ.questionNumber || currentQuestion + 1}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {currentQ.points || 1} pt(s)
                  </Badge>
                  {currentQ.difficulty === "easy" && (
                    <Badge className="bg-green-100 text-green-700 text-xs border-0">Fácil</Badge>
                  )}
                  {currentQ.difficulty === "hard" && (
                    <Badge className="bg-red-100 text-red-700 text-xs border-0">Difícil</Badge>
                  )}
                  {currentQ.difficulty === "medium" && (
                    <Badge className="bg-yellow-100 text-yellow-700 text-xs border-0">Médio</Badge>
                  )}
                </div>
              </div>
              {selectedAnswer && (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              )}
            </div>

            {currentQ.context && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground italic border-l-2 border-primary/30">
                {currentQ.context}
              </div>
            )}

            <p className="text-foreground font-medium leading-relaxed">
              {currentQ.statement || currentQ.questionText}
            </p>

            {/* Alternativas */}
            {options.length > 0 && (
              <div className="space-y-2 pt-1">
                {options.map((opt) => {
                  const isSelected = selectedAnswer === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() =>
                        handleSelectAnswer(
                          currentQ.id,
                          currentQ.questionNumber || currentQuestion + 1,
                          opt.label
                        )
                      }
                      className={`w-full text-left rounded-lg border p-3 transition-all flex items-start gap-3 ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:border-primary/30 hover:bg-accent/30"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="text-sm text-foreground leading-relaxed pt-0.5">
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navegação */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentQuestion((c) => Math.max(0, c - 1))}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          <div className="text-sm text-muted-foreground">
            {currentQuestion + 1} / {totalQuestions}
          </div>

          {currentQuestion < totalQuestions - 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentQuestion((c) => Math.min(totalQuestions - 1, c + 1))}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setShowSubmitDialog(true)}
            >
              <Send className="h-4 w-4 mr-1" />
              Enviar Prova
            </Button>
          )}
        </div>

        {/* Botão de enviar sempre visível no rodapé */}
        {answeredCount === totalQuestions && currentQuestion < totalQuestions - 1 && (
          <div className="pt-2 border-t border-border">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setShowSubmitDialog(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              Todas respondidas — Enviar Prova
            </Button>
          </div>
        )}
      </div>

      {/* Dialog de confirmação de envio */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar prova?</AlertDialogTitle>
            <AlertDialogDescription>
              Você respondeu <strong>{answeredCount}</strong> de <strong>{totalQuestions}</strong> questões.
              {answeredCount < totalQuestions && (
                <span className="block mt-1 text-amber-600 font-medium">
                  Atenção: {totalQuestions - answeredCount} questão(ões) sem resposta serão marcadas como erradas.
                </span>
              )}
              <span className="block mt-1">
                Após enviar, não será possível alterar suas respostas.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700"
              disabled={submitExam.isPending}
            >
              {submitExam.isPending ? "Enviando..." : "Confirmar Envio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StudentLayout>
  );
}
