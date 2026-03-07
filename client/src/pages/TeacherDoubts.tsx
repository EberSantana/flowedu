import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { MessageCircle, CheckCircle2, Clock, Send, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function TeacherDoubts() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [expandedDoubt, setExpandedDoubt] = useState<number | null>(null);

  // Buscar disciplinas do professor
  const { data: subjects } = trpc.subjects.list.useQuery();

  // Buscar dúvidas pendentes
  const { data: doubts, isLoading, refetch } = trpc.studentDoubts.getPendingDoubts.useQuery({
    subjectId: selectedSubjectId,
  });

  // Mutation para responder
  const respondMutation = trpc.studentDoubts.respondDoubt.useMutation({
    onSuccess: (_, variables) => {
      toast.success("Resposta enviada ao aluno!");
      setReplyText((prev) => ({ ...prev, [variables.doubtId]: "" }));
      setExpandedDoubt(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao responder: ${error.message}`);
    },
  });

  const handleReply = (doubtId: number) => {
    const text = replyText[doubtId]?.trim();
    if (!text) {
      toast.error("Escreva uma resposta");
      return;
    }
    respondMutation.mutate({ doubtId, answer: text });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-xl">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dúvidas dos Alunos</h1>
            <p className="text-muted-foreground text-sm">
              Responda as dúvidas enviadas pelos seus alunos
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          {doubts?.length || 0} pendente{(doubts?.length || 0) !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Filtro por disciplina */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select
          value={selectedSubjectId?.toString() || "all"}
          onValueChange={(value) =>
            setSelectedSubjectId(value === "all" ? undefined : parseInt(value))
          }
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Filtrar por disciplina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as disciplinas</SelectItem>
            {subjects?.map((subject: any) => (
              <SelectItem key={subject.id} value={subject.id.toString()}>
                {subject.name} ({subject.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de dúvidas */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando dúvidas...</p>
        </div>
      ) : doubts && doubts.length > 0 ? (
        <div className="space-y-4">
          {doubts.map((doubt) => (
            <Card key={doubt.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        <Clock className="w-3 h-3 mr-1" />
                        Pendente
                      </Badge>
                      {doubt.subjectName && (
                        <Badge variant="outline">{doubt.subjectName}</Badge>
                      )}
                      {doubt.isPrivate && (
                        <Badge variant="secondary" className="text-xs">Privada</Badge>
                      )}
                    </div>
                    <CardTitle className="text-base mt-2">
                      {doubt.studentName || "Aluno"}
                    </CardTitle>
                    <CardDescription>
                      Enviada em {formatDate(doubt.createdAt)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pergunta do aluno */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pergunta:</p>
                  <p className="whitespace-pre-wrap">{doubt.question}</p>
                  {doubt.context && (
                    <>
                      <p className="text-sm font-medium text-muted-foreground mt-3 mb-1">
                        Contexto:
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {doubt.context}
                      </p>
                    </>
                  )}
                </div>

                {/* Campo de resposta */}
                {expandedDoubt === doubt.id ? (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Escreva sua resposta para o aluno..."
                      value={replyText[doubt.id] || ""}
                      onChange={(e) =>
                        setReplyText((prev) => ({ ...prev, [doubt.id]: e.target.value }))
                      }
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedDoubt(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReply(doubt.id)}
                        disabled={respondMutation.isPending}
                      >
                        {respondMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar Resposta
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setExpandedDoubt(doubt.id)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Responder
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma dúvida pendente</h3>
            <p className="text-muted-foreground">
              Todas as dúvidas dos alunos foram respondidas. Bom trabalho!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
