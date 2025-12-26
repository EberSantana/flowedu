import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import StudentLayout from "@/components/StudentLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast as showToast } from "sonner";

export default function StudentExerciseAttempt() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  // Toast notifications
  
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar detalhes do exercício
  // @ts-ignore - Rota existe no backend, erro de inferência de tipo
  const { data: exercise, isLoading } = trpc.studentExercises.getDetails.useQuery(
    { exerciseId: parseInt(id!) },
    { enabled: !!id }
  );

  // Iniciar tentativa
  // @ts-ignore - Rota existe no backend, erro de inferência de tipo
  const startAttemptMutation = trpc.studentExercises.startAttempt.useMutation();

  // Submeter tentativa
  // @ts-ignore - Rota existe no backend, erro de inferência de tipo
  const submitAttemptMutation = trpc.studentExercises.submitAttempt.useMutation({
    onSuccess: (result: any) => {
      showToast.success(
        "Exercício enviado!",
        { description: `Você acertou ${result.correctCount} de ${result.totalQuestions} questões (${result.score.toFixed(1)}%)` }
      );
      setLocation(`/student-exercises/${id}/results/${result.attemptId}`);
    },
    onError: (error: any) => {
      showToast.error("Erro ao enviar", { description: error.message });
      setIsSubmitting(false);
    },
  });

  // Iniciar tentativa automaticamente
  useEffect(() => {
    if (exercise && !exercise.currentAttemptId) {
      startAttemptMutation.mutate(
        { exerciseId: parseInt(id!) },
        {
          onSuccess: (data: any) => {
            if (exercise.timeLimit) {
              setTimeRemaining(exercise.timeLimit * 60); // converter minutos para segundos
            }
          },
        }
      );
    } else if (exercise?.currentAttemptId && exercise.timeLimit) {
      // Calcular tempo restante se já existe tentativa
      const elapsed = Math.floor((Date.now() - new Date(exercise.startedAt!).getTime()) / 1000);
      const remaining = (exercise.timeLimit * 60) - elapsed;
      setTimeRemaining(remaining > 0 ? remaining : 0);
    }
  }, [exercise]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmit(); // Auto-submit quando tempo acabar
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const unanswered = exercise?.questions.filter(
      (_: any, index: number) => !answers[index]
    );

    if (unanswered && unanswered.length > 0) {
      const confirm = window.confirm(
        `Você ainda tem ${unanswered.length} questão(ões) sem resposta. Deseja enviar mesmo assim?`
      );
      if (!confirm) return;
    }

    setIsSubmitting(true);

    const answersArray = exercise?.questions.map((_: any, index: number) => ({
      questionIndex: index,
      answer: answers[index] || "",
    }));

    submitAttemptMutation.mutate({
      attemptId: exercise!.currentAttemptId!,
      answers: answersArray || [],
    });
  };

  if (isLoading || startAttemptMutation.isPending) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando exercício...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!exercise) {
    return (
      <StudentLayout>
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Exercício não encontrado</h2>
                <p className="text-gray-600 mb-4">O exercício que você está tentando acessar não existe ou não está mais disponível.</p>
                <Button onClick={() => setLocation("/student-exercises")}>
                  Voltar para Exercícios
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  const progress = (Object.keys(answers).length / exercise.questions.length) * 100;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <StudentLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header com informações do exercício */}
        <Card className="mb-6 border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{exercise.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="bg-blue-50">
                    {exercise.subjectName}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50">
                    {exercise.moduleName}
                  </Badge>
                  <Badge variant="outline">
                    {exercise.questions.length} questões
                  </Badge>
                  {exercise.maxAttempts && (
                    <Badge variant="outline">
                      Tentativa {exercise.attempts + 1} de {exercise.maxAttempts}
                    </Badge>
                  )}
                </div>
                {exercise.description && (
                  <p className="text-gray-600 text-sm">{exercise.description}</p>
                )}
              </div>
              {timeRemaining !== null && (
                <div className={`ml-4 text-center p-3 rounded-lg border-2 ${
                  timeRemaining < 300 ? "border-red-300 bg-red-50" : "border-blue-300 bg-blue-50"
                }`}>
                  <Clock className={`w-6 h-6 mx-auto mb-1 ${
                    timeRemaining < 300 ? "text-red-600" : "text-blue-600"
                  }`} />
                  <div className={`text-2xl font-bold ${
                    timeRemaining < 300 ? "text-red-600" : "text-blue-600"
                  }`}>
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-xs text-gray-600">restantes</div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progresso: {Object.keys(answers).length} de {exercise.questions.length} respondidas</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Questões */}
        <div className="space-y-6">
          {exercise.questions.map((question: any, index: number) => (
            <Card key={index} id={`question-${index}`} className="scroll-mt-4">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-l-4 border-l-purple-500">
                <div className="flex items-start gap-3">
                  <Badge className="bg-purple-600 text-white px-3 py-1">
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 leading-relaxed">
                      {question.question}
                    </CardTitle>
                  </div>
                  {answers[index] && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <RadioGroup
                  value={answers[index] || ""}
                  onValueChange={(value) => handleAnswerChange(index, value)}
                >
                  <div className="space-y-3">
                    {question.options.map((option: string, optIndex: number) => {
                      const optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D
                      return (
                        <div
                          key={optIndex}
                          className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-gray-50 ${
                            answers[index] === option
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200"
                          }`}
                          onClick={() => handleAnswerChange(index, option)}
                        >
                          <RadioGroupItem value={option} id={`q${index}-opt${optIndex}`} />
                          <Label
                            htmlFor={`q${index}-opt${optIndex}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-blue-600 min-w-[24px]">
                                {optionLetter})
                              </span>
                              <span className="text-gray-900 leading-relaxed">{option}</span>
                            </div>
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Botão de envio */}
        <Card className="mt-8 sticky bottom-4 shadow-xl border-2 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {Object.keys(answers).length === exercise.questions.length ? (
                  <span className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Todas as questões respondidas!
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    {exercise.questions.length - Object.keys(answers).length} questão(ões) faltando
                  </span>
                )}
              </div>
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting || Object.keys(answers).length === 0}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Send className="w-5 h-5" />
                {isSubmitting ? "Enviando..." : "Enviar Respostas"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mini-índice lateral de navegação */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 hidden lg:block no-print">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
            <div className="space-y-1">
              {exercise.questions.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => {
                    document.getElementById(`question-${index}`)?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    answers[index]
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                  title={`Questão ${index + 1}${answers[index] ? " (respondida)" : ""}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
