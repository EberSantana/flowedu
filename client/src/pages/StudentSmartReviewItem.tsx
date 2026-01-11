import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Brain, 
  Clock, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Lightbulb,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

export default function StudentSmartReviewItem() {
  const [, params] = useRoute("/student/smart-review/:id");
  const [, setLocation] = useLocation();
  const queueItemId = params?.id ? parseInt(params.id) : null;

  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [selfRating, setSelfRating] = useState<"again" | "hard" | "good" | "easy">("good");
  const [notes, setNotes] = useState("");
  const [startTime] = useState(Date.now());
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Buscar detalhes do item
  const { data: itemDetails, isLoading } = trpc.smartReview.getItemDetails.useQuery(
    { queueItemId: queueItemId! },
    { enabled: !!queueItemId }
  );

  // Mutation para registrar revisão
  const recordReviewMutation = trpc.smartReview.recordReview.useMutation({
    onSuccess: (result) => {
      toast.success("Revisão registrada!", {
        description: `Próxima revisão em ${result.newInterval} dia(s). Taxa de acerto: ${result.newSuccessRate}%`,
      });
      
      setTimeout(() => {
        setLocation("/student/smart-review");
      }, 3000);
    },
    onError: (error) => {
      toast.error("Erro ao registrar revisão", {
        description: error.message,
      });
    },
  });

  if (!queueItemId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">ID do item de revisão inválido</p>
            <Button className="mt-4" onClick={() => setLocation("/student/smart-review")}>
              Voltar para Revisão
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando questão...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!itemDetails) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Item de revisão não encontrado</p>
            <Button className="mt-4" onClick={() => setLocation("/student/smart-review")}>
              Voltar para Revisão
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { queueItem, answer: originalAnswer, exercise } = itemDetails;

  // Parsear dados do exercício
  const exerciseData = exercise?.exerciseData ? JSON.parse(exercise.exerciseData as string) : null;
  const questionNumber = originalAnswer?.questionNumber || 1;
  const question = exerciseData?.questions?.[questionNumber - 1];

  const handleSubmit = () => {
    if (!question) return;

    let wasCorrect = false;

    // Verificar resposta baseada no tipo de questão
    if (question.type === "objective") {
      wasCorrect = selectedOption === originalAnswer?.correctAnswer;
    } else {
      // Para questões abertas, considerar correto se preencheu
      wasCorrect = answer.trim().length > 0;
    }

    setIsCorrect(wasCorrect);
    setShowResult(true);
  };

  const handleFinishReview = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    recordReviewMutation.mutate({
      queueItemId: queueItem.id,
      answerId: queueItem.answerId,
      exerciseId: queueItem.exerciseId,
      wasCorrect: isCorrect,
      timeSpent,
      selfRating,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/student/smart-review")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Revisão Inteligente
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Questão #{originalAnswer?.questionNumber} - {question?.type === "objective" ? "Múltipla Escolha" : "Questão Aberta"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline">
              Prioridade: {queueItem.priority}
            </Badge>
            <Badge variant="outline">
              Taxa: {queueItem.successRate}%
            </Badge>
          </div>
        </div>
      </div>

      {/* Informações da Revisão */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progresso de Aprendizado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Revisões</p>
              <p className="font-semibold">{queueItem.reviewCount} vezes</p>
            </div>
            <div>
              <p className="text-muted-foreground">Intervalo Atual</p>
              <p className="font-semibold">{queueItem.interval} dia(s)</p>
            </div>
            <div>
              <p className="text-muted-foreground">Facilidade</p>
              <p className="font-semibold">{queueItem.easeFactor.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questão */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Questão</CardTitle>
          <CardDescription>Tente responder novamente para reforçar o aprendizado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none mb-6">
            <p className="text-base">{question?.question}</p>
          </div>

          {!showResult ? (
            <>
              {question?.type === "objective" ? (
                <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                  <div className="space-y-3">
                    {question.options?.map((option: string, index: number) => {
                      const letter = String.fromCharCode(65 + index);
                      return (
                        <div key={index} className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent transition-colors">
                          <RadioGroupItem value={letter} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                            <span className="font-semibold mr-2">{letter})</span>
                            {option}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="answer">Sua Resposta</Label>
                  <Textarea
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Digite sua resposta aqui..."
                    rows={6}
                    className="resize-none"
                  />
                </div>
              )}

              <Button 
                onClick={handleSubmit} 
                className="mt-6 w-full"
                disabled={question?.type === "objective" ? !selectedOption : !answer.trim()}
              >
                Verificar Resposta
              </Button>
            </>
          ) : (
            <>
              {/* Resultado */}
              <div className={`p-6 rounded-lg border-2 mb-6 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                <div className="flex items-center gap-3 mb-4">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-green-900">Correto!</h3>
                        <p className="text-sm text-green-700">Você acertou a questão na revisão.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-8 w-8 text-red-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-red-900">Incorreto</h3>
                        <p className="text-sm text-red-700">Continue estudando este conceito.</p>
                      </div>
                    </>
                  )}
                </div>

                {question?.type === "objective" && (
                  <div className="bg-white p-4 rounded border">
                    <p className="text-sm font-semibold mb-2">Resposta Correta:</p>
                    <p className="text-sm">
                      <span className="font-bold">{originalAnswer?.correctAnswer})</span>{" "}
                      {question.options?.[originalAnswer?.correctAnswer?.charCodeAt(0)! - 65]}
                    </p>
                  </div>
                )}
              </div>

              {/* Feedback Original */}
              {originalAnswer?.aiFeedback && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Feedback da Primeira Tentativa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {originalAnswer.aiFeedback}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Auto-avaliação */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-sm">Como você se sentiu com esta revisão?</CardTitle>
                  <CardDescription>
                    Sua avaliação ajuda o sistema a programar a próxima revisão
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selfRating} onValueChange={(value) => setSelfRating(value as any)}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent transition-colors">
                        <RadioGroupItem value="again" id="again" />
                        <Label htmlFor="again" className="flex-1 cursor-pointer">
                          <span className="font-semibold">Repetir</span> - Preciso revisar novamente em breve
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent transition-colors">
                        <RadioGroupItem value="hard" id="hard" />
                        <Label htmlFor="hard" className="flex-1 cursor-pointer">
                          <span className="font-semibold">Difícil</span> - Consegui responder, mas com dificuldade
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent transition-colors">
                        <RadioGroupItem value="good" id="good" />
                        <Label htmlFor="good" className="flex-1 cursor-pointer">
                          <span className="font-semibold">Bom</span> - Respondi com algum esforço
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent transition-colors">
                        <RadioGroupItem value="easy" id="easy" />
                        <Label htmlFor="easy" className="flex-1 cursor-pointer">
                          <span className="font-semibold">Fácil</span> - Respondi facilmente, domino o conceito
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Anotações */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-sm">Anotações (Opcional)</CardTitle>
                  <CardDescription>
                    Registre insights ou dúvidas sobre esta questão
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Preciso revisar o conceito de..."
                    rows={3}
                    className="resize-none"
                  />
                </CardContent>
              </Card>

              <Button 
                onClick={handleFinishReview} 
                className="w-full"
                disabled={recordReviewMutation.isPending}
              >
                {recordReviewMutation.isPending ? "Salvando..." : "Finalizar Revisão"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
