import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle, XCircle, AlertCircle, Lightbulb, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PracticeHistory() {
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAIHint, setShowAIHint] = useState(false);
  
  // Query para listar tentativas
  const { data: attempts, isLoading } = trpc.practiceQuestions.listMyAttempts.useQuery({
    status: filterStatus === "all" ? undefined : filterStatus,
  });
  
  // Query para estatísticas
  const { data: stats } = trpc.practiceQuestions.getMyStats.useQuery();
  
  // Query para feedback (quando um attempt é selecionado)
  const { data: feedback } = trpc.practiceQuestions.getFeedback.useQuery(
    { attemptId: selectedAttempt?.attempt?.id || 0 },
    { enabled: !!selectedAttempt?.attempt?.id }
  );
  
  // Query para dicas de IA
  const { data: hints } = trpc.practiceQuestions.getAIHints.useQuery(
    { attemptId: selectedAttempt?.attempt?.id || 0 },
    { enabled: !!selectedAttempt?.attempt?.id && showAIHint }
  );
  
  // Mutation para gerar dica de IA
  const generateHint = trpc.practiceQuestions.generateAIHint.useMutation({
    onSuccess: () => {
      setShowAIHint(true);
    },
  });
  
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
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p>Carregando histórico...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Histórico de Questões</h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe seu progresso e revise suas respostas
        </p>
      </div>
      
      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Tentativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttempts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(Math.floor(stats.avgTimeSpent))}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Nota Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore?.toFixed(1) || "N/A"}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Corretas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.byStatus?.correct || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Filtros */}
      <div className="mb-6 flex items-center gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="correct">Corretas</SelectItem>
            <SelectItem value="incorrect">Incorretas</SelectItem>
            <SelectItem value="partial">Parciais</SelectItem>
            <SelectItem value="pending_review">Aguardando revisão</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Lista de tentativas */}
      {attempts && attempts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Você ainda não resolveu nenhuma questão.
            </p>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-4">
        {attempts?.map((item: any) => (
          <Card
            key={item.attempt.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedAttempt(item)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(item.attempt.status)}
                    {item.question?.title || "Questão"}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Resolvida em {new Date(item.attempt.createdAt).toLocaleDateString('pt-BR')}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(item.attempt.status)}
                  {item.attempt.score !== null && (
                    <span className="text-sm font-semibold">
                      Nota: {item.attempt.score}/100
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(item.attempt.timeSpent)}
                </div>
                <div>
                  Dificuldade: {item.attempt.difficultyAtAttempt || "N/A"}
                </div>
                <div>
                  Faixa: {item.attempt.beltAtAttempt || "N/A"}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Modal de detalhes */}
      <Dialog open={!!selectedAttempt} onOpenChange={() => setSelectedAttempt(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAttempt?.question?.title}</DialogTitle>
            <DialogDescription>
              Detalhes da sua tentativa de resolução
            </DialogDescription>
          </DialogHeader>
          
          {selectedAttempt && (
            <Tabs defaultValue="answer" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="answer">Sua Resposta</TabsTrigger>
                <TabsTrigger value="feedback">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Feedback
                </TabsTrigger>
                <TabsTrigger value="hints">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Dicas de IA
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="answer" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Enunciado</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedAttempt.question?.description}
                  </p>
                </div>
                
                {selectedAttempt.attempt.answerText && (
                  <div>
                    <h3 className="font-semibold mb-2">Sua Resposta (Texto)</h3>
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
                    Status: {getStatusBadge(selectedAttempt.attempt.status)}
                  </div>
                  <div>
                    Tempo: {formatTime(selectedAttempt.attempt.timeSpent)}
                  </div>
                  {selectedAttempt.attempt.score !== null && (
                    <div>
                      Nota: <span className="font-semibold">{selectedAttempt.attempt.score}/100</span>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="feedback">
                {feedback ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Feedback do Professor</h3>
                      <p className="text-sm whitespace-pre-wrap bg-muted p-4 rounded">
                        {feedback.feedbackText}
                      </p>
                    </div>
                    
                    {feedback.suggestions && (
                      <div>
                        <h3 className="font-semibold mb-2">Sugestões de Melhoria</h3>
                        <p className="text-sm whitespace-pre-wrap bg-blue-50 dark:bg-blue-950 p-4 rounded">
                          {feedback.suggestions}
                        </p>
                      </div>
                    )}
                    
                    {feedback.score !== null && (
                      <div>
                        <h3 className="font-semibold mb-2">Nota Atribuída</h3>
                        <div className="text-3xl font-bold text-primary">
                          {feedback.score}/100
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ainda não há feedback do professor para esta questão.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="hints">
                {hints && hints.length > 0 ? (
                  <div className="space-y-4">
                    {hints.map((hint: any) => (
                      <Card key={hint.id}>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            Dica de IA
                            <Badge variant="outline" className="ml-auto">
                              Confiança: {hint.confidence}%
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm whitespace-pre-wrap">
                            {hint.hintText}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Gerada em {new Date(hint.generatedAt).toLocaleString('pt-BR')}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">
                      Ainda não há dicas de IA para esta questão.
                    </p>
                    <Button
                      onClick={() => generateHint.mutate({ attemptId: selectedAttempt.attempt.id })}
                      disabled={generateHint.isPending}
                    >
                      {generateHint.isPending ? "Gerando..." : "Gerar Dica com IA"}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
