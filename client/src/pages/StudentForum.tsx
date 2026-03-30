import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast as sonnerToast } from "sonner";
import StudentLayout from "@/components/StudentLayout";
import {
  MessageSquare, Pin, Lock, CheckCircle,
  Plus, ArrowLeft, ChevronRight, Eye, Reply, Star,
  BookOpen, Search, AlertCircle, GraduationCap
} from "lucide-react";

type Topic = {
  id: number; title: string; content: string; authorType: string;
  isPinned: boolean; isClosed: boolean; bestReplyId: number | null;
  viewCount: number; replyCount: number; createdAt: Date; updatedAt: Date;
  subjectId: number;
};

type ReplyType = {
  id: number; topicId: number; content: string; authorType: string;
  isBestAnswer: boolean; createdAt: Date;
};

export default function StudentForum() {
  const [, navigate] = useLocation();

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [view, setView] = useState<"subjects" | "topics" | "topic">("subjects");
  const [search, setSearch] = useState("");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [newReplyContent, setNewReplyContent] = useState("");
  const [showNewTopic, setShowNewTopic] = useState(false);

  // Buscar disciplinas do aluno via matrículas
  const { data: enrollments = [] } = trpc.student.getEnrolledSubjects.useQuery(undefined, {
    retry: false,
  });

  const { data: topics = [], refetch: refetchTopics } = trpc.forum.listTopics.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId }
  );

  const { data: topicData, refetch: refetchTopic } = trpc.forum.getTopic.useQuery(
    { topicId: selectedTopicId! },
    { enabled: !!selectedTopicId }
  );

  const createTopic = trpc.forum.createTopicAsStudent.useMutation({
    onSuccess: () => {
      refetchTopics();
      setShowNewTopic(false);
      setNewTopicTitle("");
      setNewTopicContent("");
      sonnerToast.success("Dúvida enviada!", { description: "O professor será notificado." });
    },
    onError: (e) => sonnerToast.error("Erro", { description: e.message }),
  });

  const reply = trpc.forum.replyAsStudent.useMutation({
    onSuccess: () => { refetchTopic(); setNewReplyContent(""); sonnerToast.success("Resposta enviada!"); },
    onError: (e) => sonnerToast.error("Erro", { description: e.message }),
  });

  // Extrair disciplinas das matrículas
  const subjects = (enrollments as any[]).map((e: any) => ({
    id: e.subjectId,
    name: e.subject?.name || `Disciplina ${e.subjectId}`,
    color: e.subject?.color || '#3b82f6',
  }));

  const selectedSubject = subjects.find((s: any) => s.id === selectedSubjectId);
  const filteredTopics = topics.filter((t: Topic) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  // ─── View: Seleção de disciplina ──────────────────────────────────────────
  if (view === "subjects") {
    return (
      <StudentLayout>
        <div className="min-h-screen bg-background">
          {/* Header colorido padrão */}
          <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-10 px-4">
            <div className="container mx-auto">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Fórum de Discussão</h1>
                  <p className="text-primary-foreground/80 mt-1">Tire suas dúvidas com o professor</p>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto py-8 px-4 max-w-3xl">
            <p className="text-muted-foreground text-sm mb-4">Selecione a disciplina para acessar o fórum:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedSubjectId(s.id); setView("topics"); }}
                  className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-accent/10 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ background: s.color || '#3b82f6' }}>
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{s.name}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>

            {subjects.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Você ainda não está matriculado em nenhuma disciplina</p>
              </div>
            )}
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ─── View: Lista de tópicos ───────────────────────────────────────────────
  if (view === "topics") {
    return (
      <StudentLayout>
        <div className="min-h-screen bg-background">
          {/* Header colorido padrão */}
          <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-10 px-4">
            <div className="container mx-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView("subjects")}
                  className="bg-white/20 p-3 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  <ArrowLeft className="h-8 w-8" />
                </button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold truncate">Fórum — {selectedSubject?.name}</h1>
                  <p className="text-primary-foreground/80 mt-1">{filteredTopics.length} tópico(s)</p>
                </div>
                <Button
                  onClick={() => setShowNewTopic(true)}
                  className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0 backdrop-blur-sm font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" /> Nova Dúvida
                </Button>
              </div>
            </div>
          </div>

          <div className="container mx-auto py-8 px-4 max-w-3xl">
            {/* Busca */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar tópicos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Formulário nova dúvida */}
            {showNewTopic && (
              <div className="mb-6 p-5 rounded-xl bg-card border border-primary/30">
                <h3 className="font-semibold text-foreground mb-1">Enviar Nova Dúvida</h3>
                <p className="text-muted-foreground text-sm mb-4">O professor será notificado automaticamente</p>
                <input
                  type="text"
                  placeholder="Título da dúvida..."
                  value={newTopicTitle}
                  onChange={e => setNewTopicTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary mb-3"
                />
                <textarea
                  placeholder="Descreva sua dúvida com detalhes..."
                  value={newTopicContent}
                  onChange={e => setNewTopicContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none mb-3"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setShowNewTopic(false)}>Cancelar</Button>
                  <Button
                    onClick={() => createTopic.mutate({ subjectId: selectedSubjectId!, title: newTopicTitle, content: newTopicContent })}
                    disabled={!newTopicTitle.trim() || !newTopicContent.trim() || createTopic.isPending}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    {createTopic.isPending ? "Enviando..." : "Enviar Dúvida"}
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de tópicos */}
            <div className="space-y-3">
              {filteredTopics.map((t: Topic) => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTopicId(t.id); setView("topic"); }}
                  className="w-full flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-accent/5 transition-all text-left"
                >
                  <div className={`mt-1 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    t.isClosed ? 'bg-muted' : t.bestReplyId ? 'bg-green-100 dark:bg-green-900/20' : 'bg-primary/10'
                  }`}>
                    <MessageSquare className={`w-5 h-5 ${
                      t.isClosed ? 'text-muted-foreground' : t.bestReplyId ? 'text-green-600 dark:text-green-400' : 'text-primary'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {t.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
                      {t.isClosed && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                      {t.bestReplyId && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-xs py-0">
                          Resolvido
                        </Badge>
                      )}
                      <span className="font-semibold text-foreground truncate">{t.title}</span>
                    </div>
                    <p className="text-muted-foreground text-sm truncate">{t.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{t.viewCount}</span>
                      <span className="flex items-center gap-1"><Reply className="w-3 h-3" />{t.replyCount}</span>
                      <span>{formatDate(t.updatedAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground mt-3" />
                </button>
              ))}
            </div>

            {filteredTopics.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum tópico ainda</p>
                <p className="text-sm mt-1">Seja o primeiro a enviar uma dúvida!</p>
              </div>
            )}
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ─── View: Tópico individual ──────────────────────────────────────────────
  const topic = topicData?.topic as Topic | undefined;
  const replies = (topicData?.replies || []) as ReplyType[];

  return (
    <StudentLayout>
      <div className="min-h-screen bg-background">
        {/* Header colorido padrão */}
        <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-10 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setView("topics"); setSelectedTopicId(null); }}
                className="bg-white/20 p-3 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-8 w-8" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold truncate">{topic?.title || "Carregando..."}</h1>
                <p className="text-primary-foreground/80 mt-1">{selectedSubject?.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4 max-w-3xl">
          {/* Tópico principal */}
          {topic && (
            <div className="p-5 rounded-xl bg-card border border-border mb-6">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {topic.isPinned && <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400">Fixado</Badge>}
                {topic.isClosed && <Badge className="bg-muted text-muted-foreground">Fechado</Badge>}
                {topic.bestReplyId && <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">Resolvido</Badge>}
                <span className="text-xs text-muted-foreground">{formatDate(topic.createdAt)}</span>
                <span className={`text-xs font-medium ${topic.authorType === 'teacher' ? 'text-primary' : 'text-blue-600 dark:text-blue-400'}`}>
                  {topic.authorType === 'teacher' ? 'Professor' : 'Aluno'}
                </span>
              </div>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{topic.content}</p>
            </div>
          )}

          {/* Respostas */}
          <div className="space-y-4 mb-6">
            {replies.map((r: ReplyType) => (
              <div key={r.id} className={`p-4 rounded-xl border ${
                r.isBestAnswer
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                  : 'bg-card border-border'
              }`}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {r.isBestAnswer && (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Melhor Resposta
                    </span>
                  )}
                  {r.authorType === 'teacher' && (
                    <span className="flex items-center gap-1 text-xs text-primary font-medium">
                      <GraduationCap className="w-3.5 h-3.5" /> Professor
                    </span>
                  )}
                  {r.authorType === 'student' && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Aluno</span>
                  )}
                  <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                </div>
                <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
              </div>
            ))}

            {replies.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aguardando resposta do professor...</p>
              </div>
            )}
          </div>

          {/* Caixa de resposta */}
          {topic && !topic.isClosed ? (
            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Reply className="w-4 h-4 text-primary" /> Adicionar Comentário
              </h3>
              <textarea
                placeholder="Escreva seu comentário..."
                value={newReplyContent}
                onChange={e => setNewReplyContent(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none mb-3"
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => reply.mutate({ topicId: topic.id, content: newReplyContent })}
                  disabled={!newReplyContent.trim() || reply.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {reply.isPending ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          ) : topic?.isClosed ? (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-orange-50 border border-orange-200 dark:bg-orange-900/10 dark:border-orange-800 text-orange-600 dark:text-orange-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Este tópico está fechado.</span>
            </div>
          ) : null}
        </div>
      </div>
    </StudentLayout>
  );
}
