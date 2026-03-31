import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  MessageSquare, Plus, ChevronLeft, ChevronRight, Pin, Lock, Eye, ThumbsUp,
  Bell, BellOff, Star, Pencil, Trash2, Reply, CheckCircle,
  Search, Filter, BookOpen, HelpCircle, FileText, Clock
} from "lucide-react";

type ForumType = "general" | "qa" | "single";

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function timeAgo(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function AvatarCircle({ name, role }: { name: string; role?: string }) {
  const isTeacher = role === "teacher" || role === "Professor";
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${isTeacher ? "bg-primary" : "bg-emerald-500"}`}>
      {getInitials(name || "?")}
    </div>
  );
}

function forumTypeLabel(t: string) {
  return { general: "Discussão Geral", qa: "Perguntas e Respostas", single: "Discussão Única" }[t] || t;
}
function forumTypeIcon(t: string) {
  if (t === "qa") return <HelpCircle className="w-3 h-3" />;
  if (t === "single") return <FileText className="w-3 h-3" />;
  return <BookOpen className="w-3 h-3" />;
}

export default function TeacherForum() {
  const { user } = useAuth();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [newTopicType, setNewTopicType] = useState<ForumType>("general");
  const [replyContent, setReplyContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editReplyContent, setEditReplyContent] = useState("");
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [editTopicTitle, setEditTopicTitle] = useState("");
  const [editTopicContent, setEditTopicContent] = useState("");

  const subjectsQuery = trpc.subjects.list.useQuery(undefined, { enabled: !!user });
  const topicsQuery = trpc.forum.listTopics.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId }
  );
  const topicQuery = trpc.forum.getTopic.useQuery(
    { topicId: selectedTopicId! },
    { enabled: !!selectedTopicId }
  );
  const userLikesQuery = trpc.forum.getUserLikesTeacher.useQuery(
    { topicId: selectedTopicId! },
    { enabled: !!selectedTopicId && !!user }
  );
  const isSubscribedQuery = trpc.forum.isSubscribedTeacher.useQuery(
    { topicId: selectedTopicId! },
    { enabled: !!selectedTopicId && !!user }
  );

  const utils = trpc.useUtils();

  const createTopic = trpc.forum.createTopicAsTeacher.useMutation({
    onSuccess: () => {
      utils.forum.listTopics.invalidate({ subjectId: selectedSubjectId! });
      setShowNewTopicForm(false);
      setNewTopicTitle(""); setNewTopicContent(""); setNewTopicType("general");
      toast.success("Tópico criado com sucesso!");
    },
    onError: (e) => toast.error("Erro ao criar tópico", { description: e.message }),
  });

  const createReply = trpc.forum.replyAsTeacher.useMutation({
    onSuccess: () => {
      utils.forum.getTopic.invalidate({ topicId: selectedTopicId! });
      utils.forum.listTopics.invalidate({ subjectId: selectedSubjectId! });
      setReplyContent(""); setReplyingToId(null);
      toast.success("Resposta enviada!");
    },
    onError: (e) => toast.error("Erro ao responder", { description: e.message }),
  });

  const likeMutation = trpc.forum.likeAsTeacher.useMutation({
    onSuccess: () => {
      utils.forum.getTopic.invalidate({ topicId: selectedTopicId! });
      utils.forum.getUserLikesTeacher.invalidate({ topicId: selectedTopicId! });
      utils.forum.listTopics.invalidate({ subjectId: selectedSubjectId! });
    },
  });

  const subscribeMutation = trpc.forum.subscribeAsTeacher.useMutation({
    onSuccess: (data) => {
      utils.forum.isSubscribedTeacher.invalidate({ topicId: selectedTopicId! });
      toast.success(data.subscribed ? "Inscrito nas notificações!" : "Inscrição removida.");
    },
  });

  const pinMutation = trpc.forum.pinTopic.useMutation({
    onSuccess: () => utils.forum.listTopics.invalidate({ subjectId: selectedSubjectId! }),
  });

  const closeMutation = trpc.forum.closeTopic.useMutation({
    onSuccess: () => {
      utils.forum.getTopic.invalidate({ topicId: selectedTopicId! });
      utils.forum.listTopics.invalidate({ subjectId: selectedSubjectId! });
    },
  });

  const markBestMutation = trpc.forum.markBestAnswer.useMutation({
    onSuccess: () => utils.forum.getTopic.invalidate({ topicId: selectedTopicId! }),
  });

  const deleteTopicMutation = trpc.forum.deleteTopic.useMutation({
    onSuccess: () => {
      utils.forum.listTopics.invalidate({ subjectId: selectedSubjectId! });
      setSelectedTopicId(null);
      toast.success("Tópico excluído.");
    },
  });

  const deleteReplyMutation = trpc.forum.deleteReply.useMutation({
    onSuccess: () => utils.forum.getTopic.invalidate({ topicId: selectedTopicId! }),
  });

  const editReplyMutation = trpc.forum.editReplyAsTeacher.useMutation({
    onSuccess: () => {
      utils.forum.getTopic.invalidate({ topicId: selectedTopicId! });
      setEditingReplyId(null);
      toast.success("Resposta editada!");
    },
  });

  const editTopicMutation = trpc.forum.editTopicAsTeacher.useMutation({
    onSuccess: () => {
      utils.forum.getTopic.invalidate({ topicId: selectedTopicId! });
      utils.forum.listTopics.invalidate({ subjectId: selectedSubjectId! });
      setEditingTopicId(null);
      toast.success("Tópico editado!");
    },
  });

  const handleCreateTopic = useCallback(() => {
    if (!newTopicTitle.trim()) { toast.error("Informe o título."); return; }
    if (!newTopicContent.trim()) { toast.error("Informe o conteúdo."); return; }
    createTopic.mutate({ subjectId: selectedSubjectId!, title: newTopicTitle.trim(), content: newTopicContent.trim(), forumType: newTopicType });
  }, [newTopicTitle, newTopicContent, newTopicType, selectedSubjectId, createTopic, toast]);

  const handleReply = useCallback(() => {
    if (!replyContent.trim()) { toast.error("Informe o conteúdo da resposta."); return; }
    createReply.mutate({ topicId: selectedTopicId!, content: replyContent.trim(), parentReplyId: replyingToId ?? undefined });
  }, [replyContent, selectedTopicId, replyingToId, createReply, toast]);

  const likedIds = new Set((userLikesQuery.data || []).map((l: any) => `${l.targetType}-${l.targetId}`));
  const isSubscribed = isSubscribedQuery.data?.subscribed ?? false;

  const filteredTopics = (topicsQuery.data || []).filter((t: any) => {
    const matchSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterType === "all"
      || (filterType === "pinned" && t.isPinned)
      || (filterType === "closed" && t.isClosed)
      || (filterType === "open" && !t.isClosed)
      || t.forumType === filterType;
    return matchSearch && matchFilter;
  });

  // ── TELA 1: Lista de disciplinas ──
  if (!selectedSubjectId) {
    const subjects = subjectsQuery.data || [];
    return (
      <>
        <Sidebar />
        <PageWrapper>
          <div className="mb-6">
            <nav className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
              <span>Início</span><span>›</span><span>Comunicação</span><span>›</span>
              <span className="text-foreground font-medium">Fórum de Discussão</span>
            </nav>
            <div className="flex items-center gap-3 mb-1">
              <MessageSquare className="w-7 h-7 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Fórum de Discussão</h1>
            </div>
            <p className="text-muted-foreground">Selecione uma disciplina para acessar o fórum</p>
          </div>

          {subjects.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma disciplina encontrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedSubjectId(s.id); setSelectedSubjectName(s.name); }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    {s.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{s.name}</p>
                    <p className="text-sm text-muted-foreground">{s.code || "Disciplina"}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          )}
        </PageWrapper>
      </>
    );
  }

  // ── TELA 2: Lista de tópicos ──
  if (!selectedTopicId) {
    return (
      <>
        <Sidebar />
        <PageWrapper>
          <div className="mb-6">
            <nav className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
              <button onClick={() => setSelectedSubjectId(null)} className="hover:text-primary">Fórum</button>
              <span>›</span><span className="text-foreground font-medium">{selectedSubjectName}</span>
            </nav>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedSubjectId(null)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Fórum — {selectedSubjectName}</h1>
                  <p className="text-sm text-muted-foreground">{filteredTopics.length} tópico(s)</p>
                </div>
              </div>
              <Button onClick={() => setShowNewTopicForm(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Novo Tópico
              </Button>
            </div>
          </div>

          {showNewTopicForm && (
            <div className="mb-6 p-5 rounded-xl border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-4">Novo Tópico</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <Input placeholder="Título do tópico" value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} />
                  </div>
                  <Select value={newTopicType} onValueChange={v => setNewTopicType(v as ForumType)}>
                    <SelectTrigger><SelectValue placeholder="Tipo de fórum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Discussão Geral</SelectItem>
                      <SelectItem value="qa">Perguntas e Respostas</SelectItem>
                      <SelectItem value="single">Discussão Única</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea placeholder="Descreva o tópico..." value={newTopicContent} onChange={e => setNewTopicContent(e.target.value)} rows={4} />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowNewTopicForm(false)}>Cancelar</Button>
                  <Button onClick={handleCreateTopic} disabled={createTopic.isPending}>
                    {createTopic.isPending ? "Criando..." : "Criar Tópico"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar tópicos..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tópicos</SelectItem>
                <SelectItem value="open">Abertos</SelectItem>
                <SelectItem value="closed">Fechados</SelectItem>
                <SelectItem value="pinned">Fixados</SelectItem>
                <SelectItem value="general">Discussão Geral</SelectItem>
                <SelectItem value="qa">Perguntas e Respostas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {topicsQuery.isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : filteredTopics.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum tópico encontrado</p>
              <p className="text-sm mt-1">Clique em "Novo Tópico" para começar a discussão.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTopics.map((topic: any) => (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:border-primary hover:bg-primary/5 ${topic.isPinned ? "border-amber-300 bg-amber-50/50 dark:bg-amber-900/10" : "border-border bg-card"}`}
                >
                  <AvatarCircle name={topic.authorName || "?"} role={topic.authorType} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {topic.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                      {topic.isClosed && <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                      {topic.bestReplyId && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                      <span className="font-semibold text-foreground truncate">{topic.title}</span>
                      <Badge variant="outline" className="text-xs gap-1 flex-shrink-0">
                        {forumTypeIcon(topic.forumType)}{forumTypeLabel(topic.forumType)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{topic.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{topic.authorName}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(topic.updatedAt)}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{topic.replyCount}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{topic.viewCount}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{topic.likeCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageWrapper>
      </>
    );
  }

  // ── TELA 3: Tópico com respostas ──
  const topic = topicQuery.data?.topic as any;
  const replies = (topicQuery.data?.replies || []) as any[];
  const rootReplies = replies.filter((r: any) => !r.parentReplyId);
  const childReplies = (parentId: number) => replies.filter((r: any) => r.parentReplyId === parentId);

  const ReplyCard = ({ reply, depth = 0 }: { reply: any; depth?: number }) => {
    const isLiked = likedIds.has(`reply-${reply.id}`);
    const isBest = reply.isBestAnswer;
    const children = childReplies(reply.id);

    return (
      <div className={depth > 0 ? "ml-12 border-l-2 border-border pl-4" : ""}>
        <div className={`p-4 rounded-xl border mb-3 ${isBest ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-border bg-card"}`}>
          {isBest && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold mb-2">
              <Star className="w-3.5 h-3.5 fill-current" /> Melhor Resposta
            </div>
          )}
          <div className="flex items-start gap-3">
            <AvatarCircle name={reply.authorName || "?"} role={reply.authorType} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-sm text-foreground">{reply.authorName}</span>
                <Badge variant="outline" className="text-xs">{reply.authorRole || reply.authorType}</Badge>
                {reply.isEdited && <span className="text-xs text-muted-foreground italic">(editado)</span>}
                <span className="text-xs text-muted-foreground ml-auto">{timeAgo(reply.createdAt)}</span>
              </div>
              {editingReplyId === reply.id ? (
                <div className="space-y-2">
                  <Textarea value={editReplyContent} onChange={e => setEditReplyContent(e.target.value)} rows={3} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => editReplyMutation.mutate({ replyId: reply.id, content: editReplyContent })}>Salvar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingReplyId(null)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap">{reply.content}</p>
              )}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <button
                  onClick={() => likeMutation.mutate({ targetType: "reply", targetId: reply.id })}
                  className={`flex items-center gap-1 text-xs transition-colors ${isLiked ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"}`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                  {reply.likeCount > 0 ? reply.likeCount : ""} Curtir
                </button>
                {!topic?.isClosed && (
                  <button
                    onClick={() => { setReplyingToId(reply.id); setReplyContent(""); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" /> Responder
                  </button>
                )}
                <button
                  onClick={() => { setEditingReplyId(reply.id); setEditReplyContent(reply.content); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                {!isBest && (
                  <button
                    onClick={() => markBestMutation.mutate({ topicId: selectedTopicId!, replyId: reply.id })}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-600 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" /> Melhor resposta
                  </button>
                )}
                <button
                  onClick={() => deleteReplyMutation.mutate({ replyId: reply.id })}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        {children.map((child: any) => <ReplyCard key={child.id} reply={child} depth={depth + 1} />)}
      </div>
    );
  };

  return (
    <>
      <Sidebar />
      <PageWrapper>
        <nav className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
          <button onClick={() => setSelectedSubjectId(null)} className="hover:text-primary">Fórum</button>
          <span>›</span>
          <button onClick={() => setSelectedTopicId(null)} className="hover:text-primary">{selectedSubjectName}</button>
          <span>›</span>
          <span className="text-foreground font-medium truncate max-w-xs">{topic?.title || "..."}</span>
        </nav>

        {topicQuery.isLoading ? (
          <div className="space-y-4">
            <div className="h-32 rounded-xl bg-muted animate-pulse" />
            <div className="h-20 rounded-xl bg-muted animate-pulse" />
          </div>
        ) : topic ? (
          <div className="space-y-5">
            {/* Post principal */}
            <div className={`p-5 rounded-xl border ${topic.isClosed ? "border-muted bg-muted/30" : "border-border bg-card"}`}>
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {topic.isPinned && <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300"><Pin className="w-3 h-3" />Fixado</Badge>}
                  {topic.isClosed && <Badge variant="outline" className="gap-1 text-muted-foreground"><Lock className="w-3 h-3" />Fechado</Badge>}
                  {topic.bestReplyId && <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-300"><CheckCircle className="w-3 h-3" />Respondido</Badge>}
                  <Badge variant="outline" className="gap-1">{forumTypeIcon(topic.forumType)}{forumTypeLabel(topic.forumType)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => subscribeMutation.mutate({ topicId: topic.id })}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${isSubscribed ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
                  >
                    {isSubscribed ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                    {isSubscribed ? "Inscrito" : "Inscrever-se"}
                  </button>
                  <button onClick={() => pinMutation.mutate({ topicId: topic.id, isPinned: !topic.isPinned })} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-amber-500 hover:border-amber-300 transition-colors" title={topic.isPinned ? "Desafixar" : "Fixar"}>
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => closeMutation.mutate({ topicId: topic.id, isClosed: !topic.isClosed })} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors" title={topic.isClosed ? "Abrir" : "Fechar"}>
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if (confirm("Excluir este tópico?")) deleteTopicMutation.mutate({ topicId: topic.id }); }} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <AvatarCircle name={topic.authorName || "?"} role={topic.authorType} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-semibold text-foreground">{topic.authorName || "Professor"}</span>
                    <Badge variant="outline" className="text-xs">Professor</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{timeAgo(topic.createdAt)}</span>
                  </div>
                  {editingTopicId === topic.id ? (
                    <div className="space-y-2">
                      <Input value={editTopicTitle} onChange={e => setEditTopicTitle(e.target.value)} />
                      <Textarea value={editTopicContent} onChange={e => setEditTopicContent(e.target.value)} rows={4} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => editTopicMutation.mutate({ topicId: topic.id, title: editTopicTitle, content: editTopicContent })}>Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTopicId(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-foreground mb-2">{topic.title}</h2>
                      <p className="text-foreground whitespace-pre-wrap">{topic.content}</p>
                    </>
                  )}
                  <div className="flex items-center gap-4 mt-4 flex-wrap">
                    <button
                      onClick={() => likeMutation.mutate({ targetType: "topic", targetId: topic.id })}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${likedIds.has(`topic-${topic.id}`) ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"}`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${likedIds.has(`topic-${topic.id}`) ? "fill-current" : ""}`} />
                      {topic.likeCount > 0 ? topic.likeCount : ""} Curtir
                    </button>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground"><Eye className="w-4 h-4" />{topic.viewCount} visualizações</span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground"><MessageSquare className="w-4 h-4" />{topic.replyCount} respostas</span>
                    {!editingTopicId && (
                      <button onClick={() => { setEditingTopicId(topic.id); setEditTopicTitle(topic.title); setEditTopicContent(topic.content); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto">
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Respostas */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                {replies.length} {replies.length === 1 ? "Resposta" : "Respostas"}
              </h3>
              {replies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma resposta ainda. Seja o primeiro a responder!</div>
              ) : (
                <div className="space-y-1">
                  {rootReplies.map((reply: any) => <ReplyCard key={reply.id} reply={reply} />)}
                </div>
              )}
            </div>

            {/* Caixa de resposta */}
            {!topic.isClosed ? (
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <AvatarCircle name={user?.name || user?.email || "P"} role="teacher" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{user?.name || "Professor"}</p>
                    {replyingToId && (
                      <p className="text-xs text-muted-foreground">
                        Respondendo a uma mensagem —{" "}
                        <button onClick={() => setReplyingToId(null)} className="text-primary hover:underline">cancelar</button>
                      </p>
                    )}
                  </div>
                </div>
                <Textarea
                  placeholder={replyingToId ? "Escreva sua resposta..." : "Adicione uma resposta à discussão..."}
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  rows={3}
                  className="mb-3"
                />
                <div className="flex justify-end">
                  <Button onClick={handleReply} disabled={createReply.isPending} className="gap-2">
                    <Reply className="w-4 h-4" />
                    {createReply.isPending ? "Enviando..." : "Enviar Resposta"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-muted bg-muted/30 text-center text-sm text-muted-foreground">
                <Lock className="w-4 h-4 inline mr-2" />
                Este tópico está fechado para novas respostas.
              </div>
            )}
          </div>
        ) : null}
      </PageWrapper>
    </>
  );
}
