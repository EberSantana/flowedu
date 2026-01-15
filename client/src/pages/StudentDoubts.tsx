import { useState } from "react";
import { trpc } from "@/lib/trpc";
import StudentLayout from "@/components/StudentLayout";
import { MessageCircle, Plus, Clock, CheckCircle2, AlertCircle, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  answered: {
    icon: CheckCircle2,
    label: "Respondida",
    color: "bg-green-100 text-green-700 border-green-300",
  },
  resolved: {
    icon: CheckCircle2,
    label: "Resolvida",
    color: "bg-blue-100 text-blue-700 border-blue-300",
  },
};

// Componente para exibir dicas da IA
function AIHintsSection({ doubt }: { doubt: any }) {
  const [showHints, setShowHints] = useState(false);
  const [hints, setHints] = useState<string | null>(null);
  
  const getHintsMutation = trpc.studentDoubts.getAIHints.useMutation({
    onSuccess: (data) => {
      if (data.success && typeof data.hints === 'string') {
        setHints(data.hints);
        setShowHints(true);
      }
    },
  });

  const handleGetHints = () => {
    if (hints) {
      setShowHints(!showHints);
      return;
    }
    
    getHintsMutation.mutate({
      doubtId: doubt.id,
      question: doubt.question,
      context: doubt.context || undefined,
      subjectName: doubt.subject?.name || undefined,
    });
  };

  return (
    <div className="mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleGetHints}
        disabled={getHintsMutation.isPending}
        className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 hover:from-purple-600 hover:to-indigo-600"
      >
        {getHintsMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Gerando dicas...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            {hints ? (showHints ? "Ocultar Dicas" : "Ver Dicas da IA") : "Pedir Dicas da IA"}
          </>
        )}
      </Button>

      {showHints && hints && (
        <div className="mt-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <p className="text-sm font-semibold text-purple-800">
              Dicas do Tutor IA
            </p>
          </div>
          <div className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
            {hints}
          </div>
          <p className="text-xs text-purple-600 mt-3 italic">
            💡 Essas dicas são para te ajudar a pensar. A resposta oficial virá do professor!
          </p>
        </div>
      )}
    </div>
  );
}

export default function StudentDoubts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedProfessorId, setSelectedProfessorId] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  // Buscar dúvidas
  const { data: doubts, isLoading, refetch } = trpc.studentDoubts.getMyDoubts.useQuery({});

  // Buscar disciplinas matriculadas
  const { data: subjects } = trpc.student.getEnrolledSubjects.useQuery();

  // Mutation para enviar dúvida
  const submitDoubtMutation = trpc.studentDoubts.submitDoubt.useMutation({
    onSuccess: () => {
      toast.success("✅ Dúvida enviada ao professor!");
      setIsDialogOpen(false);
      setQuestion("");
      setContext("");
      setSelectedTopicId(null);
      setSelectedProfessorId(null);
      setIsPrivate(true);
      refetch();
    },
    onError: (error) => {
      toast.error(`❌ Erro ao enviar dúvida: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!selectedTopicId) {
      toast.error("Selecione um tópico");
      return;
    }
    if (!selectedProfessorId) {
      toast.error("Selecione um professor");
      return;
    }
    if (!question.trim()) {
      toast.error("Escreva sua dúvida");
      return;
    }

    submitDoubtMutation.mutate({
      topicId: selectedTopicId,
      professorId: selectedProfessorId,
      question: question.trim(),
      context: context.trim() || undefined,
      isPrivate,
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingCount = doubts?.filter((d) => d.status === "pending").length || 0;
  const answeredCount = doubts?.filter((d) => d.status === "answered").length || 0;

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent text-white py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Minhas Dúvidas</h1>
                  <p className="text-primary-foreground/80 mt-1">
                    Envie suas dúvidas aos professores e acompanhe as respostas
                  </p>
                </div>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-primary hover:bg-primary/10">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Dúvida
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Enviar Dúvida ao Professor</DialogTitle>
                    <DialogDescription>
                      Descreva sua dúvida com detalhes para receber uma resposta completa
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Disciplina</Label>
                      <Select
                        value={selectedTopicId?.toString() || ""}
                        onValueChange={(value) => {
                          const enrollment = subjects?.find((s) => s.id === parseInt(value));
                          setSelectedTopicId(parseInt(value));
                          setSelectedProfessorId(enrollment?.professor?.id || null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma disciplina" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects?.map((enrollment) => (
                            <SelectItem key={enrollment.id} value={enrollment.id.toString()}>
                              {enrollment.subject?.name} - {enrollment.professor?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Sua Dúvida</Label>
                      <Textarea
                        placeholder="Descreva sua dúvida de forma clara e objetiva..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        rows={4}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Contexto Adicional (opcional)</Label>
                      <Textarea
                        placeholder="Adicione informações que possam ajudar o professor a entender melhor sua dúvida..."
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="private"
                        checked={isPrivate}
                        onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
                      />
                      <label
                        htmlFor="private"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Dúvida privada (apenas você e o professor verão)
                      </label>
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={submitDoubtMutation.isPending}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {submitDoubtMutation.isPending ? "Enviando..." : "Enviar Dúvida"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4 max-w-5xl">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Total de Dúvidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{doubts?.length || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Enviadas</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{pendingCount}</div>
                <p className="text-xs text-gray-500 mt-1">Aguardando resposta</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Respondidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{answeredCount}</div>
                <p className="text-xs text-gray-500 mt-1">Com resposta</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Dúvidas */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando dúvidas...</p>
            </div>
          ) : doubts && doubts.length > 0 ? (
            <div className="space-y-6">
              {doubts.map((doubt) => {
                const StatusIcon = statusConfig[doubt.status].icon;
                const statusColor = statusConfig[doubt.status].color;

                return (
                  <Card key={doubt.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={statusColor}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[doubt.status].label}
                            </Badge>
                            {doubt.isPrivate && (
                              <Badge variant="outline" className="text-xs">
                                Privada
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg">Dúvida</CardTitle>
                          <CardDescription className="mt-1">
                            Enviada em {formatDate(doubt.createdAt)}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 mb-1">Sua pergunta:</p>
                        <p className="text-gray-900 whitespace-pre-wrap">{doubt.question}</p>
                        {doubt.context && (
                          <>
                            <p className="text-sm font-medium text-gray-500 mt-3 mb-1">
                              Contexto:
                            </p>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">
                              {doubt.context}
                            </p>
                          </>
                        )}
                      </div>

                      {doubt.answer && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                          <p className="text-sm font-medium text-green-800 mb-1">
                            Resposta do Professor:
                          </p>
                          <p className="text-gray-900 whitespace-pre-wrap">{doubt.answer}</p>
                          {doubt.answeredAt && (
                            <p className="text-xs text-gray-600 mt-2">
                              Respondida em {formatDate(doubt.answeredAt)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Botão de Dicas da IA - apenas para dúvidas pendentes */}
                      {doubt.status === "pending" && (
                        <AIHintsSection doubt={doubt} />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhuma dúvida enviada
                </h3>
                <p className="text-gray-600 mb-4">
                  Não hesite em perguntar! Seus professores estão aqui para ajudar.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Enviar Primeira Dúvida
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
