import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Eye,
  RefreshCw,
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

const COLUMN_COLORS: Record<string, string> = {
  green: "border-green-400 bg-green-50 dark:bg-green-950/20",
  orange: "border-orange-400 bg-orange-50 dark:bg-orange-950/20",
  purple: "border-purple-400 bg-purple-50 dark:bg-purple-950/20",
  blue: "border-blue-400 bg-blue-50 dark:bg-blue-950/20",
  red: "border-red-400 bg-red-50 dark:bg-red-950/20",
  yellow: "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20",
};

export default function TeacherMural() {
  const [selectedMuralId, setSelectedMuralId] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [selectedCard, setSelectedCard] = useState<MuralCard | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState<string>("all");

  // Form criar mural
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSubjectId, setNewSubjectId] = useState<string>("");
  const [newClassId, setNewClassId] = useState<string>("");

  // Queries
  const { data: murals = [], refetch: refetchMurals } = trpc.mural.list.useQuery({
    subjectId: filterSubjectId !== "all" ? parseInt(filterSubjectId) : undefined,
    includeArchived: false,
  });

  const { data: subjects = [] } = trpc.subjects.list.useQuery();
  const { data: classes = [] } = trpc.classes.list.useQuery();

  const { data: muralDetail, refetch: refetchDetail } = trpc.mural.getById.useQuery(
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
      setNewSubjectId("");
      setNewClassId("");
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
    if (!newTitle.trim() || !newSubjectId || !newClassId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMural.mutate({
      title: newTitle,
      description: newDescription || undefined,
      subjectId: parseInt(newSubjectId),
      classId: parseInt(newClassId),
    });
  };

  const handleReply = () => {
    if (!selectedCard || !replyText.trim()) return;
    replyCard.mutate({ cardId: selectedCard.id, reply: replyText });
  };

  const selectedMural = muralDetail as Mural | undefined;

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "Início", href: "/" },
          { label: "Conteúdo" },
          { label: "Mural Colaborativo" },
        ]} />

        {/* Botão Voltar */}
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4 mt-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </Link>

      <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
            <Layout className="h-8 w-8 text-primary" />
            Mural Colaborativo
          </h1>
          <p className="text-muted-foreground">Gerencie os murais interativos das suas turmas</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Mural
        </Button>
      </div>

      {/* Filtro por disciplina */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium shrink-0">Filtrar por disciplina:</Label>
        <Select value={filterSubjectId} onValueChange={setFilterSubjectId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Todas as disciplinas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as disciplinas</SelectItem>
            {(subjects as any[]).map((s: any) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de murais */}
      {!selectedMuralId ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(murals as any[]).length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <Layout className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Nenhum mural criado ainda</p>
              <p className="text-sm mt-1">Crie um mural para começar a interagir com sua turma</p>
            </div>
          ) : (
            (murals as any[]).map((mural: any) => (
              <Card
                key={mural.id}
                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
                onClick={() => setSelectedMuralId(mural.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{mural.title}</CardTitle>
                    <div className="flex gap-1 shrink-0">
                      {mural.isLocked && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Lock className="h-3 w-3" /> Bloqueado
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>📚 {mural.subjectName || "—"}</p>
                    <p>👥 {mural.className || "—"}</p>
                  </div>
                  {mural.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{mural.description}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Visualização do mural selecionado */
        <div className="space-y-4">
          {/* Barra de ações do mural */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-xl border">
            <Button variant="outline" size="sm" onClick={() => setSelectedMuralId(null)} className="gap-2">
              ← Voltar
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{selectedMural?.title}</h2>
              <p className="text-xs text-muted-foreground">
                {selectedMural?.subjectName} · {selectedMural?.className}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchDetail()}
              className="gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </Button>
            <Button
              variant={selectedMural?.isLocked ? "default" : "outline"}
              size="sm"
              onClick={() => setLocked.mutate({ id: selectedMuralId!, locked: !selectedMural?.isLocked })}
              className="gap-2"
            >
              {selectedMural?.isLocked ? (
                <><Unlock className="h-3.5 w-3.5" /> Desbloquear</>
              ) : (
                <><Lock className="h-3.5 w-3.5" /> Bloquear</>
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
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Archive className="h-3.5 w-3.5" />
              Arquivar
            </Button>
          </div>

          {/* Colunas do mural */}
          {selectedMural && (
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedMural.columns.length}, minmax(0, 1fr))` }}>
              {selectedMural.columns.map((col) => {
                const colCards = selectedMural.cards.filter(c => c.columnId === col.id);
                const colorClass = COLUMN_COLORS[col.color] || "border-gray-300 bg-gray-50";
                return (
                  <div key={col.id} className={`rounded-xl border-2 p-3 ${colorClass}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{col.icon}</span>
                      <h3 className="font-semibold text-sm">{col.title}</h3>
                      <Badge variant="secondary" className="ml-auto text-xs">{colCards.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {colCards.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">Sem cards</p>
                      ) : (
                        colCards.map((card) => (
                          <div key={card.id} className="bg-background rounded-lg p-3 border shadow-sm space-y-2">
                            <p className="text-sm">{card.content}</p>
                            {card.authorName && (
                              <p className="text-xs text-muted-foreground">— {card.authorName}</p>
                            )}
                            <div className="flex items-center gap-2 pt-1">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <ThumbsUp className="h-3 w-3" /> {card.voteCount}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs gap-1 ml-auto"
                                onClick={() => {
                                  setSelectedCard(card);
                                  setReplyText(card.teacherReply || "");
                                  setShowReplyDialog(true);
                                }}
                              >
                                <MessageSquare className="h-3 w-3" />
                                {card.teacherReply ? "Editar resposta" : "Responder"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (confirm("Remover este card?")) {
                                    deleteCard.mutate({ cardId: card.id });
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            {card.teacherReply && (
                              <div className="bg-primary/10 rounded p-2 text-xs border-l-2 border-primary">
                                <span className="font-medium text-primary">Resposta: </span>
                                {card.teacherReply}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Dialog: Criar Mural */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Mural</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Mural de Reflexão - Aula 5"
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Disciplina *</Label>
                <Select value={newSubjectId} onValueChange={setNewSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {(subjects as any[]).map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Turma *</Label>
                <Select value={newClassId} onValueChange={setNewClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {(classes as any[]).map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateMural} disabled={createMural.isPending}>
              {createMural.isPending ? "Criando..." : "Criar Mural"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Responder Card */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Responder Card</DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="space-y-4 py-2">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm font-medium mb-1">Card do aluno:</p>
                <p className="text-sm">{selectedCard.content}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Sua resposta</Label>
                <Textarea
                  placeholder="Digite sua resposta para o aluno..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplyDialog(false)}>Cancelar</Button>
            <Button onClick={handleReply} disabled={replyCard.isPending || !replyText.trim()}>
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
