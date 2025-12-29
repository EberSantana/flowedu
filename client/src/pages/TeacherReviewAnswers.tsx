import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

export default function TeacherReviewAnswers() {
  const [expandedAnswerId, setExpandedAnswerId] = useState<number | null>(null);
  const [reviewData, setReviewData] = useState<{
    [key: number]: { finalScore: number; teacherFeedback: string };
  }>({});

  const { data: pendingReviews, isLoading, refetch } = trpc.teacherExercises.getPendingReviews.useQuery();
  const reviewMutation = trpc.teacherExercises.reviewAnswer.useMutation({
    onSuccess: () => {
      toast.success("Revisão salva com sucesso!");
      refetch();
      setExpandedAnswerId(null);
      setReviewData({});
    },
    onError: (error) => {
      toast.error("Erro ao salvar revisão: " + error.message);
    },
  });

  const handleReview = (answerId: number) => {
    const data = reviewData[answerId];
    if (!data || data.finalScore === undefined) {
      toast.error("Por favor, insira uma nota final");
      return;
    }

    reviewMutation.mutate({
      answerId,
      finalScore: data.finalScore,
      teacherFeedback: data.teacherFeedback || undefined,
    });
  };

  const updateReviewData = (answerId: number, field: "finalScore" | "teacherFeedback", value: any) => {
    setReviewData((prev) => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        [field]: value,
      },
    }));
  };

  const getConfidenceBadge = (confidence: number | null) => {
    if (!confidence) return null;
    
    if (confidence >= 80) {
      return <Badge className="bg-green-500">Alta Confiança ({confidence}%)</Badge>;
    } else if (confidence >= 50) {
      return <Badge className="bg-yellow-500">Média Confiança ({confidence}%)</Badge>;
    } else {
      return <Badge className="bg-red-500">Baixa Confiança ({confidence}%)</Badge>;
    }
  };

  const parseAiAnalysis = (analysisJson: string | null) => {
    if (!analysisJson) return null;
    try {
      return JSON.parse(analysisJson);
    } catch {
      return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Revisão de Respostas Abertas
            </h1>
            <p className="text-gray-600">
              Revise e ajuste as notas das respostas dissertativas analisadas pela IA
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!pendingReviews || pendingReviews.length === 0) && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma resposta pendente
                  </h3>
                  <p className="text-gray-600">
                    Todas as respostas abertas foram revisadas ou não há respostas que precisem de revisão manual.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Reviews List */}
          {!isLoading && pendingReviews && pendingReviews.length > 0 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    <strong>{pendingReviews.length}</strong> resposta(s) aguardando revisão manual
                  </p>
                </div>
              </div>

              {pendingReviews.map((review) => {
                const isExpanded = expandedAnswerId === review.id;
                const aiAnalysis = parseAiAnalysis(review.aiAnalysis);
                const currentReview = reviewData[review.id] || {
                  finalScore: review.aiScore || 0,
                  teacherFeedback: "",
                };

                return (
                  <Card key={review.id} className="overflow-hidden">
                    <CardHeader className="bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">
                            {review.exerciseTitle || "Exercício"}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-2">
                            <span>Aluno: {review.studentName || review.studentEmail}</span>
                            <span>•</span>
                            <span>Questão #{review.questionNumber}</span>
                            <span>•</span>
                            <Clock className="h-4 w-4 inline" />
                            <span>{new Date(review.createdAt).toLocaleDateString("pt-BR")}</span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getConfidenceBadge(review.aiConfidence)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedAnswerId(isExpanded ? null : review.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-6 space-y-6">
                        {/* Resposta do Aluno */}
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Resposta do Aluno
                          </Label>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-gray-800 whitespace-pre-wrap">
                              {review.studentAnswer}
                            </p>
                          </div>
                        </div>

                        {/* Gabarito */}
                        {review.correctAnswer && (
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                              Gabarito/Resposta Esperada
                            </Label>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {review.correctAnswer}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Análise da IA */}
                        {aiAnalysis && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                            <h4 className="font-semibold text-purple-900 mb-2">
                              Análise da IA
                            </h4>
                            
                            <div>
                              <p className="text-sm font-medium text-purple-800 mb-1">
                                Nota Sugerida: {review.aiScore}/100
                              </p>
                              <p className="text-sm text-purple-700">
                                {aiAnalysis.feedback}
                              </p>
                            </div>

                            {aiAnalysis.strengths && aiAnalysis.strengths.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-green-700 mb-1">
                                  ✓ Pontos Fortes:
                                </p>
                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                  {aiAnalysis.strengths.map((strength: string, idx: number) => (
                                    <li key={idx}>{strength}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {aiAnalysis.weaknesses && aiAnalysis.weaknesses.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-red-700 mb-1">
                                  ✗ Pontos Fracos:
                                </p>
                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                  {aiAnalysis.weaknesses.map((weakness: string, idx: number) => (
                                    <li key={idx}>{weakness}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {aiAnalysis.reasoning && (
                              <div>
                                <p className="text-sm font-medium text-purple-800 mb-1">
                                  Justificativa:
                                </p>
                                <p className="text-sm text-gray-700">{aiAnalysis.reasoning}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Formulário de Revisão */}
                        <div className="border-t pt-6 space-y-4">
                          <h4 className="font-semibold text-gray-900">Revisão do Professor</h4>
                          
                          <div>
                            <Label htmlFor={`score-${review.id}`}>
                              Nota Final (0-100) *
                            </Label>
                            <Input
                              id={`score-${review.id}`}
                              type="number"
                              min="0"
                              max="100"
                              value={currentReview.finalScore}
                              onChange={(e) =>
                                updateReviewData(
                                  review.id,
                                  "finalScore",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`feedback-${review.id}`}>
                              Feedback Adicional (opcional)
                            </Label>
                            <Textarea
                              id={`feedback-${review.id}`}
                              value={currentReview.teacherFeedback}
                              onChange={(e) =>
                                updateReviewData(
                                  review.id,
                                  "teacherFeedback",
                                  e.target.value
                                )
                              }
                              placeholder="Adicione comentários ou observações para o aluno..."
                              rows={4}
                              className="mt-1"
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleReview(review.id)}
                              disabled={reviewMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {reviewMutation.isPending ? "Salvando..." : "Salvar Revisão"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setExpandedAnswerId(null)}
                            >
                              Cancelar
                            </Button>
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
      </div>
    </div>
  );
}
