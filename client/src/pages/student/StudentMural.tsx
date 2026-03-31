import { useState, useEffect, useRef, useCallback } from "react";
import StudentLayout from "@/components/StudentLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import {
  Plus,
  Lock,
  Users,
  ThumbsUp,
  Layers,
  RefreshCw,
  Timer,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface MuralCard {
  id: number;
  columnId: number;
  text: string;
  color: string;
  authorType: "teacher" | "student";
  authorName: string;
  teacherReply?: string | null;
  voteCount: number;
  myVote?: boolean;
  createdAt: Date | string;
}

interface MuralColumn {
  id: number;
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
  columns: MuralColumn[];
  cards: MuralCard[];
}

// ── Cores ──────────────────────────────────────────────────────────────────────
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

// ── Componente de Card do Aluno ────────────────────────────────────────────────
function StudentCardItem({
  card,
  onVote,
}: {
  card: MuralCard;
  onVote: (cardId: number) => void;
}) {
  const colorClass = CARD_COLORS[card.color] || CARD_COLORS.yellow;

  return (
    <div className={`rounded-lg border-2 p-3 shadow-sm mb-2 ${colorClass}`}>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{card.text}</p>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {card.authorType === "teacher" ? "👨‍🏫" : "👤"} {card.authorName}
        </span>
        <button
          onClick={() => onVote(card.id)}
          className={`flex items-center gap-1 text-xs transition-colors rounded-full px-2 py-0.5 ${
            card.myVote
              ? "bg-primary/10 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          <ThumbsUp className="h-3 w-3" />
          <span>{card.voteCount}</span>
        </button>
      </div>

      {card.teacherReply && (
          <div className="mt-2 bg-white/70 rounded p-2 border-l-2 border-primary">
            <p className="text-xs text-primary font-medium">Resposta do professor:</p>
            <p className="text-xs text-foreground/80 mt-0.5">{card.teacherReply}</p>
        </div>
      )}
    </div>
  );
}

// ── Componente Principal ───────────────────────────────────────────────────────
export default function StudentMural() {
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [newCard, setNewCard] = useState({ text: "", color: "yellow" });
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  // Temporizador recebido do professor via WebSocket
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // WebSocket
  const wsRef = useRef<WebSocket | null>(null);

  // Obter disciplinas/turmas do aluno
  const { data: enrollments } = trpc.student.getEnrolledSubjects.useQuery();

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // Quando o aluno tem apenas uma matrícula, selecionar automaticamente
  useEffect(() => {
    if (enrollments?.length === 1) {
      setSelectedSubjectId(enrollments[0].subjectId);
      setSelectedClassId(enrollments[0].classId);
    }
  }, [enrollments]);

  // Extrair subjectId e classId dos enrollments
  const enrollmentList = (enrollments as any[])?.map((e: any) => ({
    subjectId: e.subjectId,
    classId: e.classId,
    subjectName: e.subject?.name || e.subjectName || "Disciplina",
    className: e.className || "",
  })) || [];

  const { data: muralData, refetch: refetchMural, isLoading } = trpc.mural.getForStudent.useQuery(
    { subjectId: selectedSubjectId!, classId: selectedClassId ?? undefined },
    { enabled: !!selectedSubjectId }
  );

  const mural = muralData as MuralData | null | undefined;

  // Mutations
  const addCard = trpc.mural.addCardStudent.useMutation({
    onSuccess: () => {
      setShowAddCardDialog(false);
      setNewCard({ text: "", color: "yellow" });
      refetchMural();
      toast.success("Card adicionado!");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const toggleVote = trpc.mural.toggleVoteStudent.useMutation({
    onSuccess: () => refetchMural(),
  });

  // ── WebSocket ──────────────────────────────────────────────────────────────
  const connectWs = useCallback((muralId: number) => {
    if (wsRef.current) wsRef.current.close();

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("student_session="))
      ?.split("=")[1];

    if (!token) return;

    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/mural?token=${token}&type=student`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ type: "join", muralId }));

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "presence") {
          setOnlineUsers(msg.payload?.users || []);
        } else if (
          ["card_added", "card_updated", "card_deleted", "vote_toggled", "mural_locked", "mural_unlocked"].includes(msg.type)
        ) {
          refetchMural();
        } else if (msg.type === "timer_start" && msg.seconds) {
          // Iniciar contagem regressiva recebida do professor
          if (timerRef.current) clearInterval(timerRef.current);
          setTimerSeconds(msg.seconds);
          setTimerRunning(true);
          timerRef.current = setInterval(() => {
            setTimerSeconds((prev) => {
              if (prev <= 1) {
                clearInterval(timerRef.current!);
                setTimerRunning(false);
                toast.info("⏰ Tempo esgotado!");
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else if (msg.type === "timer_end") {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimerRunning(false);
          setTimerSeconds(0);
        }
      } catch {}
    };

    ws.onclose = () => setOnlineUsers([]);
  }, [refetchMural]);

  useEffect(() => {
    if (mural?.id) connectWs(mural.id);
  }, [mural?.id, connectWs]);

  useEffect(() => () => wsRef.current?.close(), []);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── Seletor de disciplina/turma ────────────────────────────────────────────
  if (!selectedSubjectId || !selectedClassId) {
    return (
      <StudentLayout>
        <div className="min-h-screen bg-background">
          <div className="bg-gradient-to-r from-primary to-accent text-white py-10 px-4">
            <div className="container mx-auto">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Layers className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Mural Colaborativo</h1>
                  <p className="text-primary-foreground/80 mt-1">Participe das atividades interativas em tempo real</p>
                </div>
              </div>
            </div>
          </div>
          <div className="container mx-auto py-8 px-4 max-w-2xl">
            <p className="text-muted-foreground text-sm mb-4">Selecione a disciplina para acessar o mural:</p>
            <div className="space-y-3">
              {enrollmentList?.map((enr: any) => (
                <button
                  key={`${enr.subjectId}-${enr.classId}`}
                  className="w-full text-left p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-colors shadow-sm"
                  onClick={() => {
                    setSelectedSubjectId(enr.subjectId);
                    setSelectedClassId(enr.classId);
                  }}
                >
                  <p className="font-semibold text-foreground">{enr.subjectName}</p>
                  {enr.className && <p className="text-sm text-muted-foreground mt-0.5">{enr.className}</p>}
                </button>
              ))}
              {!enrollments?.length && (
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma disciplina encontrada</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ── Mural não encontrado ───────────────────────────────────────────────────
  if (!isLoading && !mural) {
    return (
      <StudentLayout>
        <div className="min-h-screen bg-background">
          <div className="bg-gradient-to-r from-primary to-accent text-white py-10 px-4">
            <div className="container mx-auto flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Layers className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Mural Colaborativo</h1>
                <p className="text-primary-foreground/80 mt-1">Participe das atividades interativas em tempo real</p>
              </div>
            </div>
          </div>
          <div className="container mx-auto py-16 px-4 text-center">
            <Layers className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold text-foreground">Nenhum mural ativo</h2>
            <p className="text-sm text-muted-foreground mt-1">
              O professor ainda não criou um mural para esta disciplina.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-1"
              onClick={() => { setSelectedSubjectId(null); setSelectedClassId(null); }}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Voltar
            </Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ── Board do Mural ─────────────────────────────────────────────────────────
  return (
    <StudentLayout>
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header colorido */}
      <div className="bg-gradient-to-r from-primary to-accent text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedSubjectId(null); setSelectedClassId(null); }}
            className="text-white/80 hover:text-white transition-colors text-sm"
          >
            ← Voltar
          </button>
          <Layers className="h-5 w-5 text-white/80" />
          <div>
            <h2 className="font-semibold text-white">{mural?.title || "Mural"}</h2>
            {mural?.description && (
              <p className="text-xs text-white/70">{mural.description}</p>
            )}
          </div>
          {mural?.isLocked && (
            <Badge className="bg-white/20 text-white border-white/30 gap-1 text-xs">
              <Lock className="h-3 w-3" /> Bloqueado pelo professor
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Temporizador do professor */}
          {(timerRunning || timerSeconds > 0) && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-sm font-bold ${
                timerSeconds === 0
                  ? "bg-red-100 border-red-400 text-red-700 animate-pulse"
                  : timerSeconds <= 60
                  ? "bg-orange-100 border-orange-400 text-orange-700"
                  : "bg-blue-50 border-blue-300 text-blue-700"
              }`}
            >
              <Timer className="h-3.5 w-3.5" />
              <span>
                {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:{String(timerSeconds % 60).padStart(2, "0")}
              </span>
              {timerSeconds === 0 && <span className="text-xs font-normal ml-1">Tempo esgotado!</span>}
            </div>
          )}
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-1 text-sm bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <Users className="h-3.5 w-3.5 text-green-600" />
              <span className="text-green-700 font-medium text-xs">{onlineUsers.length} online</span>
            </div>
          )}
          {!mural?.isLocked && (
            <Button
              size="sm"
              className="gap-1"
              onClick={() => setShowAddCardDialog(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Card
            </Button>
          )}
        </div>
      </div>

      {/* Colunas */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {mural?.columns.map((col) => {
            const colCards = mural.cards.filter((c) => c.columnId === col.id);
            const headerColor = COLUMN_COLORS[col.color] || "bg-gray-500";

            return (
              <div
                key={col.id}
                className="w-72 flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden"
              >
                <div className={`${headerColor} px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{col.icon}</span>
                    <span className="font-semibold text-white text-sm">{col.title}</span>
                  </div>
                  <Badge className="bg-white/20 text-white border-0 text-xs">
                    {colCards.length}
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  {colCards.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground/40 text-sm">
                      Nenhum card ainda
                    </div>
                  ) : (
                    colCards.map((card) => (
                      <StudentCardItem
                        key={card.id}
                        card={card}
                        onVote={(cardId) => toggleVote.mutate({ cardId })}
                      />
                    ))
                  )}
                </div>

                {/* Botão adicionar na coluna */}
                {!mural.isLocked && (
                  <div className="p-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground hover:text-foreground gap-1 text-xs"
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
              placeholder="Escreva sua contribuição..."
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
                    className={`w-7 h-7 rounded-full border-2 ${cls.split(" ")[0]} ${
                      newCard.color === color ? "border-gray-800 scale-110" : "border-transparent"
                    } transition-transform`}
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
                if (!newCard.text.trim() || !selectedColumnId || !mural) {
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
              {addCard.isPending ? "Enviando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </StudentLayout>
  );
}
