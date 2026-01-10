import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare, Send } from "lucide-react";
import PageWrapper from "@/components/PageWrapper";
import { useRoute } from "wouter";

export default function TeacherReviewAttempts() {
  const [, params] = useRoute("/teacher/practice-questions/:questionId/attempts");
  const questionId = params?.questionId ? parseInt(params.questionId) : 0;
  
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    feedbackText: "",
    score: "",
    suggestions: "",
  });
  
  // Query para obter detalhes da questão
  const { data: question } = trpc.practiceQuestions.getById.useQuery(
    { questionId },
    { enabled: questionId > 0 }
  );
  
  // Query para listar tentativas (simulado - precisaria de uma rota específica)
  // Por enquanto, vamos usar uma abordagem alternativa
  
  // Mutation para adicionar feedback
  const addFeedback = trpc.practiceQuestions.addFeedback.useMutation({
    onSuccess: () => {
      toast.success("Feedback adicionado!", {
        description: "O aluno receberá uma notificação.",
      });
      setSelectedAttempt(null);
      resetFeedbackForm();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar feedback", {
        description: error.message,
      });
    },
  });
  
  const resetFeedbackForm = () => {
    setFeedbackForm({
      feedbackText: "",
      score: "",
      suggestions: "",
    });
  };
  
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttempt) return;
    
    addFeedback.mutate({
      attemptId: selectedAttempt.attempt.id,
      feedbackText: feedbackForm.feedbackText,
      score: feedbackForm.score ? parseFloat(feedbackForm.score) : undefined,
      suggestions: feedbackForm.suggestions || undefined,
    });
  };
  
  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min ${secs}s`;
  };
  
  // Ícone de status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "correct":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "incorrect":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "partial":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Badge de status
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      correct: "default",
      incorrect: "destructive",
      partial: "secondary",
      pending_review: "outline",
    };
    
    const labels: Record<string, string> = {
      correct: "Correta",
      incorrect: "Incorreta",
      partial: "Parcial",
      pending_review: "Aguardando revisão",
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };
  
  return (
    <PageWrapper>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Revisar Tentativas dos Alunos</h1>
          {question && (
            <p className="text-muted-foreground mt-2">
              Questão: {question.title}
            </p>
          )}
        </div>
        
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Funcionalidade em Desenvolvimento</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              A visualização de tentativas dos alunos estará disponível em breve. 
              Por enquanto, você pode criar questões e os alunos podem resolvê-las.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              💡 <strong>Dica:</strong> O sistema já está registrando todas as tentativas dos alunos automaticamente!
            </p>
          </CardContent>
        </Card>
        
        {/* Modal de feedback (para quando a funcionalidade estiver completa) */}
        <Dialog open={!!selectedAttempt} onOpenChange={() => setSelectedAttempt(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Feedback</DialogTitle>
              <DialogDescription>
                Forneça feedback construtivo para o aluno
              </DialogDescription>
            </DialogHeader>
            
            {selectedAttempt && (
              <Tabs defaultValue="attempt" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="attempt">Resposta do Aluno</TabsTrigger>
                  <TabsTrigger value="feedback">Adicionar Feedback</TabsTrigger>
                </TabsList>
                
                <TabsContent value="attempt" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Enunciado da Questão</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded">
                      {question?.description}
                    </p>
                  </div>
                  
                  {selectedAttempt.attempt.answerText && (
                    <div>
                      <h3 className="font-semibold mb-2">Resposta do Aluno (Texto)</h3>
                      <p className="text-sm whitespace-pre-wrap bg-muted p-4 rounded">
                        {selectedAttempt.attempt.answerText}
                      </p>
                    </div>
                  )}
                  
                  {selectedAttempt.attempt.answerPhotoUrl && (
                    <div>
                      <h3 className="font-semibold mb-2">Foto da Resposta</h3>
                      <img
                        src={selectedAttempt.attempt.answerPhotoUrl}
                        alt="Resposta"
                        className="max-w-full rounded border"
                      />
                    </div>
                  )}
                  
                  {selectedAttempt.attempt.answerAudioUrl && (
                    <div>
                      <h3 className="font-semibold mb-2">Áudio da Resposta</h3>
                      <audio src={selectedAttempt.attempt.answerAudioUrl} controls className="w-full" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      Tempo: {formatTime(selectedAttempt.attempt.timeSpent)}
                    </div>
                    <div>
                      Status: {getStatusBadge(selectedAttempt.attempt.status)}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="feedback">
                  <form onSubmit={handleSubmitFeedback} className="space-y-4">
                    <div>
                      <Label htmlFor="feedbackText">Feedback *</Label>
                      <Textarea
                        id="feedbackText"
                        value={feedbackForm.feedbackText}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, feedbackText: e.target.value })}
                        placeholder="Forneça um feedback construtivo e encorajador..."
                        rows={6}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="score">Nota (0-100)</Label>
                      <Input
                        id="score"
                        type="number"
                        min="0"
                        max="100"
                        value={feedbackForm.score}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, score: e.target.value })}
                        placeholder="Ex: 85"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="suggestions">Sugestões de Melhoria</Label>
                      <Textarea
                        id="suggestions"
                        value={feedbackForm.suggestions}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, suggestions: e.target.value })}
                        placeholder="Sugestões específicas para o aluno melhorar..."
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedAttempt(null)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={addFeedback.isPending}>
                        <Send className="mr-2 h-4 w-4" />
                        {addFeedback.isPending ? "Enviando..." : "Enviar Feedback"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  );
}
