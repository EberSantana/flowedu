import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
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
  DropdownMenuSeparator,
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
  FileDown,
  Timer,
  LayoutTemplate,
  Play,
  Square,
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

// ── Modelos pré-definidos ──────────────────────────────────────────────────────
const MURAL_TEMPLATES = [
  {
    id: "brainstorming",
    name: "Brainstorming",
    description: "Geração livre de ideias em grupo",
    icon: "🧠",
    columns: [
      { title: "Ideias", icon: "💡", color: "yellow", position: 0 },
      { title: "Desenvolver", icon: "🔧", color: "blue", position: 1 },
      { title: "Aprovadas", icon: "✅", color: "green", position: 2 },
      { title: "Descartar", icon: "🗑️", color: "red", position: 3 },
    ],
  },
  {
    id: "kwl",
    name: "KWL",
    description: "O que sei / Quero aprender / Aprendi",
    icon: "📚",
    columns: [
      { title: "O que sei (K)", icon: "🧩", color: "blue", position: 0 },
      { title: "Quero aprender (W)", icon: "❓", color: "orange", position: 1 },
      { title: "O que aprendi (L)", icon: "🌟", color: "green", position: 2 },
    ],
  },
  {
    id: "semaforo",
    name: "Semáforo de Compreensão",
    description: "Avaliação do nível de entendimento",
    icon: "🚦",
    columns: [
      { title: "Entendi bem 🟢", icon: "🟢", color: "green", position: 0 },
      { title: "Tenho dúvidas 🟡", icon: "🟡", color: "yellow", position: 1 },
      { title: "Não entendi 🔴", icon: "🔴", color: "red", position: 2 },
    ],
  },
  {
    id: "retrospectiva",
    name: "Retrospectiva",
    description: "O que foi bem, o que melhorar e próximos passos",
    icon: "🔄",
    columns: [
      { title: "Foi bem 👍", icon: "👍", color: "green", position: 0 },
      { title: "Melhorar 🔧", icon: "🔧", color: "orange", position: 1 },
      { title: "Próximos passos 🚀", icon: "🚀", color: "purple", position: 2 },
    ],
  },
  {
    id: "personalizado",
    name: "Personalizado",
    description: "Colunas padrão: Aprendi / Dúvidas / Ideias",
    icon: "⚙️",
    columns: [
      { title: "O que aprendi", icon: "💡", color: "green", position: 0 },
      { title: "Dúvidas", icon: "❓", color: "orange", position: 1 },
      { title: "Ideias", icon: "🚀", color: "purple", position: 2 },
      { title: "Respondido", icon: "✅", color: "blue", position: 3 },
    ],
  },
];

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
    <div className={`rounded-lg border-2 p-3 shadow-sm mb-2 ${colorClass}`}>
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
            {columns.map(
              (col) =>
                col.id !== card.columnId && (
                  <DropdownMenuItem key={col.id} onClick={() => onMove(card.id, col.id)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Mover para {col.title}
                  </DropdownMenuItem>
                )
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(card.id)}>
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

// ── Componente Temporizador ────────────────────────────────────────────────────
function TimerDisplay({
  seconds,
  isRunning,
}: {
  seconds: number;
  isRunning: boolean;
}) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds <= 60 && seconds > 0;
  const isExpired = seconds === 0 && isRunning;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-sm font-bold transition-colors ${
        isExpired
          ? "bg-red-100 border-red-400 text-red-700 animate-pulse"
          : isUrgent
          ? "bg-orange-100 border-orange-400 text-orange-700"
          : "bg-blue-50 border-blue-300 text-blue-700"
      }`}
    >
      <Timer className="h-3.5 w-3.5" />
      <span>
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
      {isExpired && <span className="text-xs font-normal ml-1">Tempo esgotado!</span>}
    </div>
  );
}

// ── Exportação PDF ─────────────────────────────────────────────────────────────
function exportMuralToPDF(mural: MuralData) {
  const win = window.open("", "_blank");
  if (!win) {
    toast.error("Permita pop-ups para exportar o PDF");
    return;
  }

  const now = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const colorsMap: Record<string, string> = {
    yellow: "#fef9c3",
    green: "#dcfce7",
    blue: "#dbeafe",
    pink: "#fce7f3",
    purple: "#f3e8ff",
    orange: "#ffedd5",
    red: "#fee2e2",
  };

  const colHeaderColors: Record<string, string> = {
    green: "#22c55e",
    orange: "#f97316",
    purple: "#a855f7",
    blue: "#3b82f6",
    red: "#ef4444",
    yellow: "#eab308",
  };

  const columnsHtml = mural.columns
    .map((col) => {
      const cards = mural.cards.filter((c) => c.columnId === col.id);
      const headerBg = colHeaderColors[col.color] || "#6b7280";
      const cardsHtml = cards
        .map((card) => {
          const cardBg = colorsMap[card.color] || "#fef9c3";
          const replyHtml = card.teacherReply
            ? `<div style="margin-top:6px;padding:6px 8px;background:#eff6ff;border-left:3px solid #3b82f6;border-radius:4px;">
                <p style="margin:0;font-size:10px;color:#1d4ed8;font-weight:600;">Resposta do professor:</p>
                <p style="margin:4px 0 0;font-size:11px;color:#374151;">${card.teacherReply}</p>
               </div>`
            : "";
          return `<div style="background:${cardBg};border:1px solid #d1d5db;border-radius:8px;padding:10px;margin-bottom:8px;">
            <p style="margin:0;font-size:12px;color:#1f2937;white-space:pre-wrap;">${card.text}</p>
            <div style="margin-top:6px;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:10px;color:#6b7280;">${card.authorType === "teacher" ? "👨‍🏫" : "👤"} ${card.authorName}</span>
              <span style="font-size:10px;color:#6b7280;">👍 ${card.voteCount}</span>
            </div>
            ${replyHtml}
          </div>`;
        })
        .join("");

      return `<div style="width:220px;flex-shrink:0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff;">
        <div style="background:${headerBg};padding:10px 12px;display:flex;justify-content:space-between;align-items:center;">
          <span style="color:#fff;font-weight:700;font-size:13px;">${col.icon} ${col.title}</span>
          <span style="background:rgba(255,255,255,0.25);color:#fff;border-radius:12px;padding:1px 8px;font-size:11px;">${cards.length}</span>
        </div>
        <div style="padding:10px;min-height:80px;">${cardsHtml || '<p style="color:#d1d5db;font-size:12px;text-align:center;padding:20px 0;">Nenhum card</p>'}</div>
      </div>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Mural: ${mural.title}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 24px; background: #f9fafb; color: #111; }
    @media print { body { padding: 0; background: #fff; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:16px;">
    <button onclick="window.print()" style="background:#2563eb;color:#fff;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:14px;">🖨️ Imprimir / Salvar PDF</button>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
    <h1 style="margin:0 0 4px;font-size:20px;color:#1f2937;">${mural.title}</h1>
    ${mural.description ? `<p style="margin:0 0 8px;color:#6b7280;font-size:13px;">${mural.description}</p>` : ""}
    <p style="margin:0;font-size:11px;color:#9ca3af;">Exportado em ${now} · ${mural.cards.length} cards · ${mural.columns.length} colunas</p>
  </div>
  <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;">
    ${columnsHtml}
  </div>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}

// ── Componente Principal ───────────────────────────────────────────────────────
export default function MuralColaborativo() {
  const { user } = useAuth();

  // Estado de navegação
  const [view, setView] = useState<"list" | "board">("list");
  const [selectedMuralId, setSelectedMuralId] = useState<number | null>(null);

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [showTimerDialog, setShowTimerDialog] = useState(false);

  // Formulários
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [replyCard, setReplyCard] = useState<MuralCard | null>(null);
  const [newMural, setNewMural] = useState({
    title: "",
    description: "",
    subjectId: "",
    classId: "",
    templateId: "personalizado",
  });
  const [newCard, setNewCard] = useState({ text: "", color: "yellow" });
  const [replyText, setReplyText] = useState("");

  // Presença online
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  // Temporizador
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInput, setTimerInput] = useState("10");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // WebSocket
  const wsRef = useRef<WebSocket | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: subjects } = trpc.subjects.list.useQuery(undefined, { enabled: !!user });
  const { data: classes } = trpc.classes.list.useQuery(undefined, { enabled: !!user });
  const { data: muralList, refetch: refetchList } = trpc.mural.list.useQuery(
    { includeArchived: false },
    { enabled: view === "list" && !!user }
  );
  const { data: muralData, refetch: refetchMural } = trpc.mural.getById.useQuery(
    { id: selectedMuralId! },
    { enabled: view === "board" && !!selectedMuralId }
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMural = trpc.mural.create.useMutation({
    onSuccess: (data: any) => {
      setShowCreateDialog(false);
      setNewMural({ title: "", description: "", subjectId: "", classId: "", templateId: "personalizado" });
      refetchList();
      openMural(data.id);
      toast.success("Mural criado com sucesso!");
    },
  });

  const setLocked = trpc.mural.setLocked.useMutation({ onSuccess: () => refetchMural() });
  const archiveMural = trpc.mural.archive.useMutation({
    onSuccess: () => { setView("list"); refetchList(); toast.success("Mural arquivado."); },
  });
  const addCard = trpc.mural.addCard.useMutation({
    onSuccess: () => { setShowAddCardDialog(false); setNewCard({ text: "", color: "yellow" }); refetchMural(); },
  });
  const replyCardMutation = trpc.mural.replyCard.useMutation({
    onSuccess: () => { setShowReplyDialog(false); setReplyText(""); setReplyCard(null); refetchMural(); },
  });
  const moveCard = trpc.mural.moveCard.useMutation({ onSuccess: () => refetchMural() });
  const deleteCard = trpc.mural.deleteCard.useMutation({ onSuccess: () => refetchMural() });
  const toggleVote = trpc.mural.toggleVoteTeacher.useMutation({ onSuccess: () => refetchMural() });

  // ── Temporizador ───────────────────────────────────────────────────────────
  const startTimer = (minutes: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const totalSecs = minutes * 60;
    setTimerSeconds(totalSecs);
    setTimerRunning(true);
    setShowTimerDialog(false);

    // Broadcast via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "timer_start", seconds: totalSecs }));
    }

    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerRunning(false);
          toast.info("⏰ Tempo esgotado!");
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "timer_end" }));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerSeconds(0);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "timer_end" }));
    }
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  const connectWs = useCallback(
    (muralId: number) => {
      if (wsRef.current) wsRef.current.close();
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("session="))
        ?.split("=")[1];
      if (!token) return;

      const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/mural?token=${token}&type=teacher`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => ws.send(JSON.stringify({ type: "join", muralId }));
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "presence") setOnlineUsers(msg.payload?.users || []);
          else if (
            ["card_added", "card_updated", "card_deleted", "vote_toggled", "mural_locked", "mural_unlocked"].includes(msg.type)
          ) refetchMural();
        } catch {}
      };
      ws.onclose = () => setOnlineUsers([]);
    },
    [refetchMural]
  );

  const openMural = (id: number) => {
    setSelectedMuralId(id);
    setView("board");
    connectWs(id);
  };

  useEffect(() => () => wsRef.current?.close(), []);

  // ── Vista: Lista de Murais ─────────────────────────────────────────────────
  if (view === "list") {
    return (
      <>
        <Sidebar />
        <PageWrapper className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              Mural Colaborativo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crie murais interativos em tempo real para suas turmas
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Mural
          </Button>
        </div>

        {!muralList || (muralList as any[]).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum mural criado ainda</p>
            <p className="text-sm mt-1">Clique em "Novo Mural" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(muralList as any[]).map((m: any) => (
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
                  {m.subjectName && <Badge variant="secondary" className="text-xs">{m.subjectName}</Badge>}
                  {m.className && <Badge variant="outline" className="text-xs">{m.className}</Badge>}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        )}

        </div>
        {/* Dialog: Criar Mural */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-lg">
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

              {/* Seletor de modelo */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <LayoutTemplate className="h-4 w-4" /> Modelo de Mural
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {MURAL_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      className={`text-left p-3 rounded-lg border-2 transition-colors ${
                        newMural.templateId === tpl.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setNewMural({ ...newMural, templateId: tpl.id })}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{tpl.icon}</span>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{tpl.name}</p>
                          <p className="text-xs text-gray-500">{tpl.description}</p>
                        </div>
                      </div>
                      <div className="mt-1.5 flex gap-1 flex-wrap">
                        {tpl.columns.map((col) => (
                          <span key={col.title} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {col.icon} {col.title}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button
                onClick={() => {
                  if (!newMural.title || !newMural.subjectId || !newMural.classId) {
                    toast.error("Preencha todos os campos obrigatórios");
                    return;
                  }
                  const template = MURAL_TEMPLATES.find((t) => t.id === newMural.templateId);
                  createMural.mutate({
                    title: newMural.title,
                    description: newMural.description || undefined,
                    subjectId: Number(newMural.subjectId),
                    classId: Number(newMural.classId),
                    columns: template?.columns,
                  } as any);
                }}
                disabled={createMural.isPending}
              >
                {createMural.isPending ? "Criando..." : "Criar Mural"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageWrapper>
      </>
    );
  }

  // ── Vista: Board do Mural ──────────────────────────────────────────────────
  const mural = muralData as MuralData | undefined;

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background">
      <div className="flex flex-col" style={{minHeight: 'calc(100vh - 0px)'}}>
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setView("list"); wsRef.current?.close(); stopTimer(); }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-semibold text-foreground">{mural?.title || "Carregando..."}</h2>
            {mural?.description && <p className="text-xs text-muted-foreground">{mural.description}</p>}
          </div>
          {mural?.isLocked && (
            <Badge variant="outline" className="text-orange-600 border-orange-300 gap-1">
              <Lock className="h-3 w-3" /> Bloqueado
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Temporizador ativo */}
          {(timerRunning || timerSeconds > 0) && (
            <TimerDisplay seconds={timerSeconds} isRunning={timerRunning} />
          )}

          {/* Usuários online */}
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-1 text-sm bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <Users className="h-3.5 w-3.5 text-green-600" />
              <span className="text-green-700 font-medium text-xs">{onlineUsers.length} online</span>
            </div>
          )}

          {/* Bloquear/Desbloquear */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => mural && setLocked.mutate({ id: mural.id, locked: !mural.isLocked })}
          >
            {mural?.isLocked ? <><Unlock className="h-3.5 w-3.5" /> Desbloquear</> : <><Lock className="h-3.5 w-3.5" /> Bloquear</>}
          </Button>

          {/* Adicionar card */}
          <Button size="sm" className="gap-1" onClick={() => setShowAddCardDialog(true)} disabled={mural?.isLocked}>
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
              {/* Temporizador */}
              {timerRunning ? (
                <DropdownMenuItem onClick={stopTimer}>
                  <Square className="h-4 w-4 mr-2 text-red-500" /> Parar Temporizador
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setShowTimerDialog(true)}>
                  <Timer className="h-4 w-4 mr-2" /> Iniciar Temporizador
                </DropdownMenuItem>
              )}
              {/* Exportar PDF */}
              <DropdownMenuItem onClick={() => mural && exportMuralToPDF(mural)}>
                <FileDown className="h-4 w-4 mr-2" /> Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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

      {/* Colunas */}
      <div className="flex-1 overflow-x-auto p-4" style={{minHeight: '500px'}}>
        <div className="flex gap-4 min-w-max">
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
                  <Badge className="bg-white/20 text-white border-0 text-xs">{colCards.length}</Badge>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  {colCards.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground/40 text-sm">Nenhum card ainda</div>
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

                {!mural.isLocked && (
                  <div className="p-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground hover:text-foreground gap-1 text-xs"
                      onClick={() => { setSelectedColumnId(col.id); setShowAddCardDialog(true); }}
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
          <DialogHeader><DialogTitle>Adicionar Card</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {mural && (
              <Select
                value={selectedColumnId ? String(selectedColumnId) : ""}
                onValueChange={(v) => setSelectedColumnId(Number(v))}
              >
                <SelectTrigger><SelectValue placeholder="Selecionar coluna *" /></SelectTrigger>
                <SelectContent>
                  {mural.columns.map((col) => (
                    <SelectItem key={col.id} value={String(col.id)}>{col.icon} {col.title}</SelectItem>
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
              <p className="text-sm text-muted-foreground mb-2">Cor do card:</p>
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
                addCard.mutate({ muralId: mural.id, columnId: selectedColumnId, text: newCard.text, color: newCard.color });
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
          <DialogHeader><DialogTitle>Responder Card</DialogTitle></DialogHeader>
          {replyCard && (
            <div className="space-y-3 py-2">
              <div className="bg-muted rounded-lg p-3 text-sm text-foreground border">
                <p className="font-medium text-xs text-muted-foreground mb-1">{replyCard.authorName}</p>
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

      {/* Dialog: Temporizador */}
      <Dialog open={showTimerDialog} onOpenChange={setShowTimerDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" /> Temporizador de Sessão
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-4">
            <p className="text-sm text-muted-foreground">
              Defina o tempo da atividade. A contagem regressiva ficará visível para todos os alunos no mural.
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="1"
                max="120"
                value={timerInput}
                onChange={(e) => setTimerInput(e.target.value)}
                className="w-24 text-center text-lg font-bold"
              />
              <span className="text-muted-foreground font-medium">minutos</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 15, 20, 30].map((min) => (
                <button
                  key={min}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    timerInput === String(min)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary"
                  }`}
                  onClick={() => setTimerInput(String(min))}
                >
                  {min} min
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimerDialog(false)}>Cancelar</Button>
            <Button
              className="gap-2"
              onClick={() => {
                const mins = parseInt(timerInput, 10);
                if (!mins || mins < 1) { toast.error("Informe um tempo válido"); return; }
                startTimer(mins);
                toast.success(`Temporizador iniciado: ${mins} minuto${mins > 1 ? "s" : ""}`);
              }}
            >
              <Play className="h-4 w-4" /> Iniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PageWrapper>
    </>
  );
}
