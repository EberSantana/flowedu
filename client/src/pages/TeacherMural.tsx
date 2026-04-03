import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useLocation } from "wouter";
import { ArrowLeft, Bell, Filter, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Layout,
  Lock,
  Unlock,
  Archive,
  Trash2,
  MessageSquare,
  ThumbsUp,
  RefreshCw,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type MuralCard = {
  id: number;
  content: string;
  columnId: number;
  authorName?: string;
  voteCount: number;
  teacherReply?: string;
  createdAt: Date;
};

type MuralColumn = {
  id: number;
  title: string;
  icon: string;
  color: string;
  position: number;
};

type Mural = {
  id: number;
  title: string;
  description?: string;
  subjectId: number;
  classId: number;
  isLocked: boolean;
  isActive: boolean;
  subjectName?: string;
  className?: string;
  columns: MuralColumn[];
  cards: MuralCard[];
};

const COLUMN_COLORS: Record<string, { border: string; bg: string; header: string; dot: string }> = {
  green:  { border: "border-green-400",  bg: "bg-green-50 dark:bg-green-950/20",  header: "bg-green-100 dark:bg-green-900/30",  dot: "bg-green-500" },
  orange: { border: "border-orange-400", bg: "bg-orange-50 dark:bg-orange-950/20", header: "bg-orange-100 dark:bg-orange-900/30", dot: "bg-orange-500" },
  purple: { border: "border-purple-400", bg: "bg-purple-50 dark:bg-purple-950/20", header: "bg-purple-100 dark:bg-purple-900/30", dot: "bg-purple-500" },
  blue:   { border: "border-blue-400",   bg: "bg-blue-50 dark:bg-blue-950/20",   header: "bg-blue-100 dark:bg-blue-900/30",   dot: "bg-blue-500" },
  red:    { border: "border-red-400",    bg: "bg-red-50 dark:bg-red-950/20",    header: "bg-red-100 dark:bg-red-900/30",    dot: "bg-red-500" },
  yellow: { border: "border-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/20", header: "bg-yellow-100 dark:bg-yellow-900/30", dot: "bg-yellow-500" },
};

function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `há ${days}d`;
  return d.toLocaleDateString("pt-BR");
}

export default function TeacherMural() {
  const [, setLocation] = useLocation();
  const [selectedMuralId, setSelectedMuralId] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [selectedCard, setSelectedCard] = useState<MuralCard | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState<string>("all");

  // Form criar mural
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSubjectClassKey, setNewSubjectClassKey] = useState<string>("");

  // Queries
  const { data: murals = [], refetch: refetchMurals } = trpc.mural.list.useQuery({
    subjectId: filterSubjectId !== "all" ? parseInt(filterSubjectId) : undefined,
    includeArchived: false,
  });

  const { data: subjectsWithClass = [] } = trpc.subjects.listWithClass.useQuery();

  const { data: muralDetail, refetch: refetchDetail, isLoading: loadingDetail } = trpc.mural.getById.useQuery(
    { id: selectedMuralId! },
    { enabled: !!selectedMuralId }
  );

  // Mutations
  const createMural = trpc.mural.create.useMutation({
    onSuccess: () => {
      toast.success("Mural criado com sucesso!");
      setShowCreateDialog(false);
      setNewTitle("");
      setNewDescription("");
      setNewSubjectClassKey("");
      refetchMurals();
    },
    onError: (e) => toast.error("Erro ao criar mural: " + e.message),
  });

  const setLocked = trpc.mural.setLocked.useMutation({
    onSuccess: () => { toast.success("Status do mural atualizado!"); refetchMurals(); refetchDetail(); },
    onError: (e) => toast.error(e.message),
  });

  const archiveMural = trpc.mural.archive.useMutation({
    onSuccess: () => { toast.success("Mural arquivado!"); setSelectedMuralId(null); refetchMurals(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMural = trpc.mural.deleteMural.useMutation({
    onSuccess: () => { toast.success("Mural excluído permanentemente!"); setSelectedMuralId(null); refetchMurals(); },
    onError: (e) => toast.error("Erro ao excluir mural: " + e.message),
  });

  const replyCard = trpc.mural.replyCard.useMutation({
    onSuccess: () => {
      toast.success("Resposta enviada!");
      setShowReplyDialog(false);
      setReplyText("");
      setSelectedCard(null);
      refetchDetail();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCard = trpc.mural.deleteCard.useMutation({
    onSuccess: () => { toast.success("Card removido!"); refetchDetail(); },
    onError: (e) => toast.error(e.message),
  });

  const handleCreateMural = () => {
    if (!newTitle.trim() || !newSubjectClassKey) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const parts = newSubjectClassKey.split(":");
    const subjectId = parseInt(parts[0]);
    const classId = parts[1] ? parseInt(parts[1]) : undefined;
    createMural.mutate({
      title: newTitle,
      description: newDescription || undefined,
      subjectId,
      classId: classId!,
    });
  };

  const handleReply = () => {
    if (!selectedCard || !replyText.trim()) return;
    replyCard.mutate({ cardId: selectedCard.id, reply: replyText });
  };

  const selectedMural = muralDetail as Mural | undefined;

  const totalCards = selectedMural?.cards.length ?? 0;
  const repliedCards = selectedMural?.cards.filter(c => c.teacherReply).length ?? 0;
  const totalVotes = selectedMural?.cards.reduce((sum, c) => sum + c.voteCount, 0) ?? 0;

  const totalMurals = (murals as any[]).length;
  const activeMurals = (murals as any[]).filter((m: any) => !m.isLocked).length;
  const lockedMurals = (murals as any[]).filter((m: any) => m.isLocked).length;

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
              { label: "Mural Colaborativo" },
            ]}
          />

          {/* Header */}
          <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Layout className="w-8 h-8 text-primary" />
                Mural Colaborativo
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie os murais interativos das suas turmas
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Mural
            </Button>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-primary" />
                  Total de Murais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalMurals}</div>
                <p className="text-xs text-muted-foreground mt-1">Murais criados</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{activeMurals}</div>
                <p className="text-xs text-muted-foreground mt-1">Abertos para alunos</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-yellow-500" />
                  Bloqueados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{lockedMurals}</div>
                <p className="text-xs text-muted-foreground mt-1">Sem interação de alunos</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtro por disciplina */}
          <div className="flex items-center gap-3 mb-6 bg-card p-4 rounded-lg border">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium text-muted-foreground">Filtrar:</span>
            <Select value={filterSubjectId} onValueChange={setFilterSubjectId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Todas as disciplinas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as disciplinas</SelectItem>
                {(subjectsWithClass as any[]).map((s: any) => (
                  <SelectItem key={s.filterKey} value={String(s.id)}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6">

            {/* Lista de murais */}
            {!selectedMuralId ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(murals as any[]).length === 0 ? (
                  <div className="col-span-full text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
                    <Layout className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-base font-medium">Nenhum mural criado ainda</p>
                    <p className="text-sm mt-1">Crie um mural para começar a interagir com sua turma</p>
                    <Button onClick={() => setShowCreateDialog(true)} className="mt-4 gap-2" variant="outline" size="sm">
                      <Plus className="h-4 w-4" /> Criar Primeiro Mural
                    </Button>
                  </div>
                ) : (
                  (murals as any[]).map((mural: any) => (
                    <div
                      key={mural.id}
                      className="border border-border rounded-xl bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => setSelectedMuralId(mural.id)}
                    >
                      {/* Cabeçalho do card */}
                      <div className="p-4 border-b border-border">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">{mural.title}</h3>
                          {mural.isLocked ? (
                            <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                              <Lock className="h-3 w-3" /> Bloqueado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs gap-1 shrink-0 text-green-600 border-green-300 dark:text-green-400 dark:border-green-700">
                              <CheckCircle2 className="h-3 w-3" /> Ativo
                            </Badge>
                          )}
                        </div>
                        {mural.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{mural.description}</p>
                        )}
                      </div>
                      {/* Rodapé do card */}
                      <div className="px-4 py-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <BookOpen className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{mural.subjectName || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{mural.className || "—"}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Visualização do mural selecionado */
              <div className="space-y-4">
                {/* Barra de ações do mural */}
                <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-xl border border-border">
                  <Button variant="outline" size="sm" onClick={() => setSelectedMuralId(null)} className="gap-2">
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                  </Button>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-foreground truncate">{selectedMural?.title}</h2>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{selectedMural?.subjectName}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{selectedMural?.className}</span>
                    </div>
                  </div>

                  {/* Estatísticas rápidas */}
                  <div className="hidden sm:flex items-center gap-4 px-4 border-x border-border">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{totalCards}</p>
                      <p className="text-xs text-muted-foreground">cards</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{repliedCards}</p>
                      <p className="text-xs text-muted-foreground">respondidos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{totalVotes}</p>
                      <p className="text-xs text-muted-foreground">votos</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchDetail()}
                      className="gap-1.5"
                      title="Atualizar mural"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Atualizar</span>
                    </Button>
                    <Button
                      variant={selectedMural?.isLocked ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLocked.mutate({ id: selectedMuralId!, locked: !selectedMural?.isLocked })}
                      className="gap-1.5"
                      title={selectedMural?.isLocked ? "Desbloquear mural para alunos" : "Bloquear mural para alunos"}
                    >
                      {selectedMural?.isLocked ? (
                        <><Unlock className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Desbloquear</span></>
                      ) : (
                        <><Lock className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Bloquear</span></>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Arquivar este mural? Os alunos não poderão mais acessá-lo.")) {
                          archiveMural.mutate({ id: selectedMuralId! });
                        }
                      }}
                      className="gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 border-amber-300 dark:border-amber-700"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Arquivar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("ATENÇÃO: Excluir permanentemente este mural e todos os seus cards? Esta ação NÃO pode ser desfeita!")) {
                          deleteMural.mutate({ id: selectedMuralId! });
                        }
                      }}
                      disabled={deleteMural.isPending}
                      className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{deleteMural.isPending ? "Excluindo..." : "Excluir"}</span>
                    </Button>
                  </div>
                </div>

                {/* Status do mural */}
                {selectedMural?.isLocked && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>Este mural está <strong>bloqueado</strong> — os alunos não podem adicionar novos cards. Clique em "Desbloquear" para reabrir.</span>
                  </div>
                )}

                {/* Loading */}
                {loadingDetail && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}

                {/* Colunas do mural */}
                {selectedMural && !loadingDetail && (
                  <>
                    {selectedMural.columns.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                        <Layout className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>Nenhuma coluna configurada neste mural</p>
                      </div>
                    ) : (
                      <div
                        className="grid gap-4 overflow-x-auto pb-2"
                        style={{ gridTemplateColumns: `repeat(${selectedMural.columns.length}, minmax(240px, 1fr))` }}
                      >
                        {selectedMural.columns.map((col) => {
                          const colCards = selectedMural.cards
                            .filter(c => c.columnId === col.id)
                            .sort((a, b) => b.voteCount - a.voteCount);
                          const colors = COLUMN_COLORS[col.color] || COLUMN_COLORS.blue;
                          return (
                            <div key={col.id} className={`rounded-xl border-2 ${colors.border} ${colors.bg} flex flex-col`}>
                              {/* Cabeçalho da coluna */}
                              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg ${colors.header}`}>
                                <span className="text-lg leading-none">{col.icon}</span>
                                <h3 className="font-semibold text-sm flex-1 truncate">{col.title}</h3>
                                <Badge variant="secondary" className="text-xs shrink-0 h-5">{colCards.length}</Badge>
                              </div>
                              {/* Cards */}
                              <div className="p-2 space-y-2 flex-1">
                                {colCards.length === 0 ? (
                                  <div className="text-center py-6 text-xs text-muted-foreground">
                                    <MessageSquare className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
                                    Sem cards nesta coluna
                                  </div>
                                ) : (
                                  colCards.map((card) => (
                                    <div key={card.id} className="bg-background rounded-lg border border-border shadow-sm overflow-hidden">
                                      {/* Conteúdo do card */}
                                      <div className="p-3">
                                        <p className="text-sm text-foreground leading-relaxed">{card.content}</p>
                                        {card.authorName && (
                                          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                            <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                              {card.authorName.charAt(0).toUpperCase()}
                                            </span>
                                            {card.authorName}
                                          </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {timeAgo(card.createdAt)}
                                        </p>
                                      </div>
                                      {/* Resposta do professor */}
                                      {card.teacherReply && (
                                        <div className="px-3 pb-2">
                                          <div className="bg-primary/8 dark:bg-primary/15 rounded-md p-2 border-l-2 border-primary">
                                            <p className="text-xs font-semibold text-primary mb-0.5">Resposta do Professor:</p>
                                            <p className="text-xs text-foreground/80">{card.teacherReply}</p>
                                          </div>
                                        </div>
                                      )}
                                      {/* Ações do card */}
                                      <div className="flex items-center gap-1 px-2 pb-2 pt-1 border-t border-border/50">
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground mr-auto">
                                          <ThumbsUp className="h-3 w-3" /> {card.voteCount}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 px-2 text-xs gap-1"
                                          onClick={() => {
                                            setSelectedCard(card);
                                            setReplyText(card.teacherReply || "");
                                            setShowReplyDialog(true);
                                          }}
                                        >
                                          <MessageSquare className="h-3 w-3" />
                                          {card.teacherReply ? "Editar" : "Responder"}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          title="Remover card"
                                          onClick={() => {
                                            if (confirm("Remover este card do mural?")) {
                                              deleteCard.mutate({ cardId: card.id });
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Pendentes de resposta */}
                    {totalCards > 0 && repliedCards < totalCards && (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span><strong>{totalCards - repliedCards}</strong> card(s) aguardando resposta do professor.</span>
                      </div>
                    )}
                    {totalCards > 0 && repliedCards === totalCards && (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Todos os cards foram respondidos!</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Dialog: Criar Mural */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5 text-primary" /> Criar Novo Mural
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Título *</Label>
                    <Input
                      placeholder="Ex: Mural de Reflexão — Aula 5"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Descrição</Label>
                    <Textarea
                      placeholder="Descrição opcional do mural..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Disciplina — Turma *</Label>
                    <Select value={newSubjectClassKey} onValueChange={setNewSubjectClassKey}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar disciplina e turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {(subjectsWithClass as any[]).map((s: any) => (
                          <SelectItem key={s.filterKey} value={s.filterKey}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2">
                    <Bell className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>Os alunos da turma receberão uma notificação quando o mural for ativado.</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
                  <Button onClick={handleCreateMural} disabled={createMural.isPending} className="gap-2">
                    {createMural.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {createMural.isPending ? "Criando..." : "Criar Mural"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialog: Responder Card */}
            <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    {selectedCard?.teacherReply ? "Editar Resposta" : "Responder Card"}
                  </DialogTitle>
                </DialogHeader>
                {selectedCard && (
                  <div className="space-y-4 py-2">
                    <div className="bg-muted/50 rounded-lg p-3 border border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Card do aluno:
                      </p>
                      <p className="text-sm text-foreground">{selectedCard.content}</p>
                      {selectedCard.authorName && (
                        <p className="text-xs text-muted-foreground mt-1.5">— {selectedCard.authorName}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Sua resposta</Label>
                      <Textarea
                        placeholder="Digite sua resposta para o aluno..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowReplyDialog(false)}>Cancelar</Button>
                  <Button onClick={handleReply} disabled={replyCard.isPending || !replyText.trim()} className="gap-2">
                    {replyCard.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {replyCard.isPending ? "Enviando..." : "Enviar Resposta"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
