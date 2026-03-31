import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  MessageCircle,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  Filter,
  ArrowLeft,
  User,
  BookOpen,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Inbox,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function TeacherDoubts() {
  const [, setLocation] = useLocation();
  const [selectedSubjectId, setSelectedSubjectId] = useState<
    number | undefined
  >(undefined);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [expandedDoubt, setExpandedDoubt] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  // Buscar disciplinas do professor
  const { data: subjects } = trpc.subjects.list.useQuery();

  // Buscar TODAS as dúvidas (pendentes + respondidas)
  const {
    data: doubts,
    isLoading,
    refetch,
  } = trpc.studentDoubts.getAllDoubts.useQuery({
    subjectId: selectedSubjectId,
  });

  // Mutation para deletar dúvida (professor)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const deleteDoubtMutation = trpc.studentDoubts.deleteTeacherDoubt.useMutation({
    onSuccess: () => {
      toast.success("Dúvida excluída com sucesso!");
      setConfirmDeleteId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  // Mutation para marcar dúvidas como vistas pelo professor
  const markSeenMutation = trpc.studentDoubts.markDoubtsSeenByProfessor.useMutation();
  const utils = trpc.useUtils();

  // Ao abrir a página, marcar dúvidas pendentes como vistas (zera o badge)
  useEffect(() => {
    markSeenMutation.mutate(undefined, {
      onSuccess: () => {
        // Invalidar a query de contagem para atualizar o badge no menu
        utils.studentDoubts.getPendingDoubtsCount.invalidate();
      }
    });
  }, []);

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

  // Filtrar dúvidas por tab
  const filteredDoubts = useMemo(() => {
    if (!doubts) return [];
    if (activeTab === "pending")
      return doubts.filter((d: any) => d.status === "pending");
    if (activeTab === "answered")
      return doubts.filter(
        (d: any) => d.status === "answered" || d.status === "resolved"
      );
    return doubts;
  }, [doubts, activeTab]);

  const pendingCount =
    doubts?.filter((d: any) => d.status === "pending").length || 0;
  const answeredCount =
    doubts?.filter(
      (d: any) => d.status === "answered" || d.status === "resolved"
    ).length || 0;
  const totalCount = doubts?.length || 0;

  const renderDoubtCard = (doubt: any) => {
    const isPending = doubt.status === "pending";
    const isExpanded = expandedDoubt === doubt.id;

    return (
      <Card
        key={doubt.id}
        className={`transition-all duration-200 hover:shadow-md ${
          isPending
            ? "border-l-4 border-l-yellow-400"
            : "border-l-4 border-l-green-400"
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge
                  className={
                    isPending
                      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                      : "bg-green-100 text-green-700 border-green-300"
                  }
                >
                  {isPending ? (
                    <>
                      <Clock className="w-3 h-3 mr-1" /> Pendente
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Respondida
                    </>
                  )}
                </Badge>
                {doubt.subjectName && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    {doubt.subjectName}
                  </Badge>
                )}
                {doubt.isPrivate && (
                  <Badge variant="secondary" className="text-xs">
                    Privada
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                {doubt.studentName || "Aluno"}
              </CardTitle>
              <CardDescription className="mt-1">
                Enviada em {formatDate(doubt.createdAt)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pergunta do aluno */}
          <div className="bg-muted/50 p-4 rounded-lg border border-muted">
            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              Pergunta do Aluno:
            </p>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {doubt.question}
            </p>
            {doubt.context && (
              <>
                <p className="text-sm font-medium text-muted-foreground mt-4 mb-1">
                  Contexto adicional:
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {doubt.context}
                </p>
              </>
            )}
          </div>

          {/* Resposta já enviada */}
          {doubt.answer && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sua Resposta:
              </p>
              <p className="whitespace-pre-wrap text-green-900 leading-relaxed">
                {doubt.answer}
              </p>
              {doubt.answeredAt && (
                <p className="text-xs text-green-600 mt-3">
                  Respondida em {formatDate(doubt.answeredAt)}
                </p>
              )}
            </div>
          )}

          {/* Campo de resposta (só para pendentes) */}
          {isPending && (
            <>
              {isExpanded ? (
                <div className="space-y-3 border-t pt-4">
                  <Textarea
                    placeholder="Escreva sua resposta para o aluno..."
                    value={replyText[doubt.id] || ""}
                    onChange={(e) =>
                      setReplyText((prev) => ({
                        ...prev,
                        [doubt.id]: e.target.value,
                      }))
                    }
                    rows={4}
                    className="resize-none focus:ring-2 focus:ring-primary/20"
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
                      disabled={
                        respondMutation.isPending ||
                        !replyText[doubt.id]?.trim()
                      }
                      className="bg-green-600 hover:bg-green-700 text-white"
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
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setExpandedDoubt(doubt.id)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Responder esta Dúvida
                </Button>
              )}
            </>
          )}

          {/* Botão Deletar */}
          <div className="border-t pt-3 mt-2">
            {confirmDeleteId === doubt.id ? (
              <div className="flex items-center gap-2 justify-end">
                <span className="text-sm text-muted-foreground">Confirmar exclusão?</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteDoubtMutation.mutate({ doubtId: doubt.id })}
                  disabled={deleteDoubtMutation.isPending}
                >
                  {deleteDoubtMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full justify-end"
                onClick={() => setConfirmDeleteId(doubt.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Excluir Dúvida
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4">
          {/* Botão Voltar ao Dashboard */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>

          <Breadcrumb
            items={[
              { label: "Comunicação" },
              { label: "Dúvidas dos Alunos" },
            ]}
          />

          {/* Header */}
          <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-primary" />
                Dúvidas dos Alunos
              </h1>
              <p className="text-muted-foreground mt-1">
                Visualize e responda as dúvidas enviadas pelos seus alunos
              </p>
            </div>
            {pendingCount > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-sm px-4 py-2">
                <AlertCircle className="w-4 h-4 mr-2" />
                {pendingCount} dúvida{pendingCount !== 1 ? "s" : ""} pendente
                {pendingCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-primary" />
                  Total Recebidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {totalCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Dúvidas recebidas
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {pendingCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando resposta
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Respondidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {answeredCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Com resposta
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtro por disciplina */}
          <div className="flex items-center gap-3 mb-6 bg-card p-4 rounded-lg border">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium text-muted-foreground">
              Filtrar:
            </span>
            <Select
              value={selectedSubjectId?.toString() || "all"}
              onValueChange={(value) =>
                setSelectedSubjectId(
                  value === "all" ? undefined : parseInt(value)
                )
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

          {/* Tabs de Dúvidas */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pendentes
                {pendingCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-yellow-100 text-yellow-700 text-xs"
                  >
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="answered" className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Respondidas
                {answeredCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-green-100 text-green-700 text-xs"
                  >
                    {answeredCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Inbox className="w-4 h-4" />
                Todas
                {totalCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {totalCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Conteúdo das Tabs */}
            {["pending", "answered", "all"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                {isLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-muted-foreground">
                      Carregando dúvidas...
                    </p>
                  </div>
                ) : filteredDoubts.length > 0 ? (
                  <div className="space-y-4">
                    {filteredDoubts.map((doubt: any) =>
                      renderDoubtCard(doubt)
                    )}
                  </div>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      {tab === "pending" ? (
                        <>
                          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold mb-2 text-foreground">
                            Nenhuma dúvida pendente
                          </h3>
                          <p className="text-muted-foreground">
                            Todas as dúvidas dos alunos foram respondidas. Bom
                            trabalho!
                          </p>
                        </>
                      ) : tab === "answered" ? (
                        <>
                          <MessageCircle className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold mb-2 text-foreground">
                            Nenhuma dúvida respondida
                          </h3>
                          <p className="text-muted-foreground">
                            Ainda não há dúvidas respondidas
                            {selectedSubjectId
                              ? " para esta disciplina"
                              : ""}
                            .
                          </p>
                        </>
                      ) : (
                        <>
                          <Inbox className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold mb-2 text-foreground">
                            Nenhuma dúvida recebida
                          </h3>
                          <p className="text-muted-foreground">
                            Seus alunos ainda não enviaram dúvidas
                            {selectedSubjectId
                              ? " para esta disciplina"
                              : ""}
                            .
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </PageWrapper>
    </>
  );
}
