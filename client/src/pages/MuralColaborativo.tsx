import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus,
  Lock,
  Unlock,
  Users,
  Trash2,
  MessageSquare,
  ThumbsUp,
  MoreVertical,
  ArrowLeft,
  Layers,
  Archive,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface MuralCard {
  id: number;
  muralId: number;
  columnId: number;
  text: string;
  color: string;
  authorType: "teacher" | "student";
  authorName: string;
  teacherReply?: string | null;
  voteCount: number;
  createdAt: Date | string;
}

interface MuralColumn {
  id: number;
  muralId: number;
  title: string;
  icon: string;
  color: string;
  position: number;
}

interface MuralData {
  id: number;
  title: string;
  description?: string | null;
  subjectId: number;
  classId: number;
  isLocked: boolean;
  isActive: boolean;
  columns: MuralColumn[];
  cards: MuralCard[];
}

// ── Cores dos cards ────────────────────────────────────────────────────────────
const CARD_COLORS: Record<string, string> = {
  yellow: "bg-yellow-100 border-yellow-300",
  green: "bg-green-100 border-green-300",
  blue: "bg-blue-100 border-blue-300",
  pink: "bg-pink-100 border-pink-300",
  purple: "bg-purple-100 border-purple-300",
  orange: "bg-orange-100 border-orange-300",
};

const COLUMN_COLORS: Record<string, string> = {
  green: "bg-green-500",
  orange: "bg-orange-500",
  purple: "bg-purple-500",
  blue: "bg-blue-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
};

// ── Componente de Card ─────────────────────────────────────────────────────────
function MuralCardItem({
  card,
  columns,
  onReply,
  onMove,
  onDelete,
  onVote,
}: {
  card: MuralCard;
  columns: MuralColumn[];
  onReply: (card: MuralCard) => void;
  onMove: (cardId: number, columnId: number) => void;
  onDelete: (cardId: number) => void;
  onVote: (cardId: number) => void;
}) {
  const colorClass = CARD_COLORS[card.color] || CARD_COLORS.yellow;

  return (
    <div
      className={`rounded-lg border-2 p-3 shadow-sm mb-2 ${colorClass}`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm text-gray-800 flex-1 whitespace-pre-wrap">{card.text}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onReply(card)}>
              <MessageSquare className="h-4 w-4 mr-2" /> Responder
            </DropdownMenuItem>
            {columns.map((col) => (
              col.id !== card.columnId && (
                <DropdownMenuItem key={col.id} onClick={() => onMove(card.id, col.id)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Mover para {col.title}
                </DropdownMenuItem>
              )
            ))}
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(card.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {card.authorType === "teacher" ? "👨‍🏫" : "👤"} {card.authorName}
        </span>
        <button
          onClick={() => onVote(card.id)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ThumbsUp className="h-3 w-3" />
          <span>{card.voteCount}</span>
        </button>
      </div>

      {card.teacherReply && (
        <div className="mt-2 bg-white/70 rounded p-2 border-l-2 border-blue-400">
          <p className="text-xs text-blue-700 font-medium">Resposta do professor:</p>
          <p className="text-xs text-gray-700 mt-0.5">{card.teacherReply}</p>
        </div>
      )}
    </div>
  );
}

// ── Componente Principal ───────────────────────────────────────────────────────
export default function MuralColaborativo() {
  const { user } = useAuth();

  // Estado de navegação: lista ou mural aberto
  const [view, setView] = useState<"list" | "board">("list");
  const [selectedMuralId, setSelectedMuralId] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [replyCard, setReplyCard] = useState<MuralCard | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  // Formulários
  const [newMural, setNewMural] = useState({ title: "", description: "", subjectId: "", classId: "" });
  const [newCard, setNewCard] = useState({ text: "", color: "yellow" });
  const [replyText, setReplyText] = useState("");

  // WebSocket
  const wsRef = useRef<WebSocket | null>(null);

  // Queries
  const { data: subjects } = trpc.subjects?.list?.useQuery(undefined, { enabled: !!user });
  const { data: classes } = trpc.classes?.list?.useQuery(undefined, { enabled: !!user });
  const { data: muralList, refetch: refetchList } = trpc.mural.list.useQuery(
    { includeArchived: false },
    { enabled: view === "list" && !!user }
  );
  const { data: muralData, refetch: refetchMural } = trpc.mural.getById.useQuery(
    { id: selectedMuralId! },
    { enabled: view === "board" && !!selectedMuralId }
  );

  // Mutations
  const createMural = trpc.mural.create.useMutation({
    onSuccess: (data) => {
      setShowCreateDialog(false);
      setNewMural({ title: "", description: "", subjectId: "", classId: "" });
      refetchList();
      openMural(data.id);
      toast.success("Mural criado com sucesso!");
    },
  });

  const setLocked = trpc.mural.setLocked.useMutation({
    onSuccess: () => refetchMural(),
  });

  const archiveMural = trpc.mural.archive.useMutation({
    onSuccess: () => {
      setView("list");
      refetchList();
      toast.success("Mural arquivado.");
    },
  });

  const addCard = trpc.mural.addCard.useMutation({
    onSuccess: () => {
      setShowAddCardDialog(false);
      setNewCard({ text: "", color: "yellow" });
      refetchMural();
    },
  });

  const replyCardMutation = trpc.mural.replyCard.useMutation({
    onSuccess: () => {
      setShowReplyDialog(false);
      setReplyText("");
      setReplyCard(null);
      refetchMural();
    },
  });

  const moveCard = trpc.mural.moveCard.useMutation({
    onSuccess: () => refetchMural(),
  });

  const deleteCard = trpc.mural.deleteCard.useMutation({
    onSuccess: () => refetchMural(),
  });

  const toggleVote = trpc.mural.toggleVoteTeacher.useMutation({
    onSuccess: () => refetchMural(),
  });

  // ── WebSocket ──────────────────────────────────────────────────────────────
  const connectWs = useCallback((muralId: number) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Obter token JWT do cookie
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("session="))
      ?.split("=")[1];

    if (!token) return;

    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/mural?token=${token}&type=teacher`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", muralId }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "presence") {
          setOnlineUsers(msg.payload?.users || []);
        } else if (
          ["card_added", "card_updated", "card_deleted", "vote_toggled", "mural_locked", "mural_unlocked"].includes(msg.type)
        ) {
          refetchMural();
        }
      } catch {}
    };

    ws.onclose = () => setOnlineUsers([]);
  }, [refetchMural]);

  const openMural = (id: number) => {
    setSelectedMuralId(id);
    setView("board");
    connectWs(id);
  };

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  // ── Renderização: Lista de Murais ──────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="h-6 w-6 text-blue-600" />
              Mural Colaborativo
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Crie murais interativos em tempo real para suas turmas
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Mural
          </Button>
        </div>

        {/* Grade de murais */}
        {!muralList || muralList.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhum mural criado ainda</p>
            <p className="text-sm mt-1">Clique em "Novo Mural" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {muralList.map((m: any) => (
              <div
                key={m.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openMural(m.id)}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{m.title}</h3>
                  {m.isLocked && <Lock className="h-4 w-4 text-orange-500 shrink-0" />}
                </div>
                {m.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{m.description}</p>
                )}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {m.subjectName && (
                    <Badge variant="secondary" className="text-xs">{m.subjectName}</Badge>
                  )}
                  {m.className && (
                    <Badge variant="outline" className="text-xs">{m.className}</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Dialog: Criar Mural */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Mural</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                placeholder="Título do mural *"
                value={newMural.title}
                onChange={(e) => setNewMural({ ...newMural, title: e.target.value })}
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={newMural.description}
                onChange={(e) => setNewMural({ ...newMural, description: e.target.value })}
                rows={2}
              />
              <Select
                value={newMural.subjectId}
                onValueChange={(v) => setNewMural({ ...newMural, subjectId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar disciplina *" />
                </SelectTrigger>
                <SelectContent>
                  {(subjects as any[])?.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={newMural.classId}
                onValueChange={(v) => setNewMural({ ...newMural, classId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar turma *" />
                </SelectTrigger>
                <SelectContent>
                  {(classes as any[])?.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button
                onClick={() => {
                  if (!newMural.title || !newMural.subjectId || !newMural.classId) {
                    toast.error("Preencha todos os campos obrigatórios");
                    return;
                  }
                  createMural.mutate({
                    title: newMural.title,
                    description: newMural.description || undefined,
                    subjectId: Number(newMural.subjectId),
                    classId: Number(newMural.classId),
                  });
                }}
                disabled={createMural.isPending}
              >
                {createMural.isPending ? "Criando..." : "Criar Mural"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Renderização: Board do Mural ───────────────────────────────────────────
  const mural = muralData as MuralData | undefined;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header do Mural */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setView("list"); wsRef.current?.close(); }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-semibold text-gray-900">{mural?.title || "Carregando..."}</h2>
            {mural?.description && (
              <p className="text-xs text-gray-500">{mural.description}</p>
            )}
          </div>
          {mural?.isLocked && (
            <Badge variant="outline" className="text-orange-600 border-orange-300 gap-1">
              <Lock className="h-3 w-3" /> Bloqueado
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Usuários online */}
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-500 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <Users className="h-3.5 w-3.5 text-green-600" />
              <span className="text-green-700 font-medium">{onlineUsers.length}</span>
              <span className="text-xs text-green-600">online</span>
            </div>
          )}

          {/* Bloquear/Desbloquear */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => {
              if (!mural) return;
              setLocked.mutate({ id: mural.id, locked: !mural.isLocked });
            }}
          >
            {mural?.isLocked ? (
              <><Unlock className="h-3.5 w-3.5" /> Desbloquear</>
            ) : (
              <><Lock className="h-3.5 w-3.5" /> Bloquear</>
            )}
          </Button>

          {/* Adicionar card */}
          <Button
            size="sm"
            className="gap-1"
            onClick={() => setShowAddCardDialog(true)}
            disabled={mural?.isLocked}
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar Card
          </Button>

          {/* Mais opções */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => mural && archiveMural.mutate({ id: mural.id })}
              >
                <Archive className="h-4 w-4 mr-2" /> Arquivar Mural
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Colunas do Mural */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {mural?.columns.map((col) => {
            const colCards = mural.cards.filter((c) => c.columnId === col.id);
            const headerColor = COLUMN_COLORS[col.color] || "bg-gray-500";

            return (
              <div
                key={col.id}
                className="w-72 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Cabeçalho da coluna */}
                <div className={`${headerColor} px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{col.icon}</span>
                    <span className="font-semibold text-white text-sm">{col.title}</span>
                  </div>
                  <Badge className="bg-white/20 text-white border-0 text-xs">
                    {colCards.length}
                  </Badge>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-0">
                  {colCards.length === 0 ? (
                    <div className="text-center py-8 text-gray-300 text-sm">
                      Nenhum card ainda
                    </div>
                  ) : (
                    colCards.map((card) => (
                      <MuralCardItem
                        key={card.id}
                        card={card}
                        columns={mural.columns}
                        onReply={(c) => { setReplyCard(c); setShowReplyDialog(true); }}
                        onMove={(cardId, colId) => moveCard.mutate({ cardId, columnId: colId })}
                        onDelete={(cardId) => deleteCard.mutate({ cardId })}
                        onVote={(cardId) => toggleVote.mutate({ cardId })}
                      />
                    ))
                  )}
                </div>

                {/* Botão adicionar na coluna */}
                {!mural.isLocked && (
                  <div className="p-2 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-gray-400 hover:text-gray-600 gap-1 text-xs"
                      onClick={() => {
                        setSelectedColumnId(col.id);
                        setShowAddCardDialog(true);
                      }}
                    >
                      <Plus className="h-3 w-3" /> Adicionar card
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialog: Adicionar Card */}
      <Dialog open={showAddCardDialog} onOpenChange={setShowAddCardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {mural && (
              <Select
                value={selectedColumnId ? String(selectedColumnId) : ""}
                onValueChange={(v) => setSelectedColumnId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar coluna *" />
                </SelectTrigger>
                <SelectContent>
                  {mural.columns.map((col) => (
                    <SelectItem key={col.id} value={String(col.id)}>
                      {col.icon} {col.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Textarea
              placeholder="Texto do card *"
              value={newCard.text}
              onChange={(e) => setNewCard({ ...newCard, text: e.target.value })}
              rows={3}
            />
            <div>
              <p className="text-sm text-gray-600 mb-2">Cor do card:</p>
              <div className="flex gap-2">
                {Object.entries(CARD_COLORS).map(([color, cls]) => (
                  <button
                    key={color}
                    className={`w-7 h-7 rounded-full border-2 ${cls.split(" ")[0]} ${newCard.color === color ? "border-gray-800 scale-110" : "border-transparent"} transition-transform`}
                    onClick={() => setNewCard({ ...newCard, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCardDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!newCard.text || !selectedColumnId || !mural) {
                  toast.error("Preencha o texto e selecione a coluna");
                  return;
                }
                addCard.mutate({
                  muralId: mural.id,
                  columnId: selectedColumnId,
                  text: newCard.text,
                  color: newCard.color,
                });
              }}
              disabled={addCard.isPending}
            >
              {addCard.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Responder Card */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Card</DialogTitle>
          </DialogHeader>
          {replyCard && (
            <div className="space-y-3 py-2">
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border">
                <p className="font-medium text-xs text-gray-500 mb-1">{replyCard.authorName}</p>
                {replyCard.text}
              </div>
              <Textarea
                placeholder="Sua resposta..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplyDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!replyCard || !replyText.trim()) return;
                replyCardMutation.mutate({ cardId: replyCard.id, reply: replyText });
              }}
              disabled={replyCardMutation.isPending}
            >
              {replyCardMutation.isPending ? "Enviando..." : "Responder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
