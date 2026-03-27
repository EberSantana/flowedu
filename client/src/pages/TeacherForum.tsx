import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast as sonnerToast } from "sonner";
import {
  MessageSquare, Pin, Lock, Unlock, Trash2, CheckCircle,
  Plus, ArrowLeft, ChevronRight, Eye, Reply, Star,
  BookOpen, Search, AlertCircle
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Topic = {
  id: number; title: string; content: string; authorType: string;
  isPinned: boolean; isClosed: boolean; bestReplyId: number | null;
  viewCount: number; replyCount: number; createdAt: Date; updatedAt: Date;
  subjectId: number; classId?: number | null;
};

type Reply = {
  id: number; topicId: number; content: string; authorType: string;
  authorUserId?: number | null; authorStudentId?: number | null;
  isBestAnswer: boolean; parentReplyId?: number | null; createdAt: Date;
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function TeacherForum() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  // Estado de navegação
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [view, setView] = useState<"subjects" | "topics" | "topic">("subjects");
  const [search, setSearch] = useState("");

  // Estado de formulários
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [newReplyContent, setNewReplyContent] = useState("");
  const [showNewTopic, setShowNewTopic] = useState(false);

  // Queries
  const { data: subjects = [] } = trpc.subjects.list.useQuery(undefined, { enabled: !!user });
  const { data: topics = [], refetch: refetchTopics } = trpc.forum.listTopics.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId }
  );
  const { data: topicData, refetch: refetchTopic } = trpc.forum.getTopic.useQuery(
    { topicId: selectedTopicId! },
    { enabled: !!selectedTopicId }
  );

  // Mutations
  const createTopic = trpc.forum.createTopicAsTeacher.useMutation({
    onSuccess: () => { refetchTopics(); setShowNewTopic(false); setNewTopicTitle(""); setNewTopicContent(""); sonnerToast.success("Tópico criado!"); },
    onError: (e) => sonnerToast.error("Erro ao criar tópico", { description: e.message }),
  });
  const reply = trpc.forum.replyAsTeacher.useMutation({
    onSuccess: () => { refetchTopic(); setNewReplyContent(""); sonnerToast.success("Resposta enviada!"); },
    onError: (e) => sonnerToast.error("Erro", { description: e.message }),
  });
  const pinTopic = trpc.forum.pinTopic.useMutation({ onSuccess: () => { refetchTopics(); refetchTopic(); } });
  const closeTopic = trpc.forum.closeTopic.useMutation({ onSuccess: () => { refetchTopics(); refetchTopic(); } });
  const markBest = trpc.forum.markBestAnswer.useMutation({ onSuccess: () => { refetchTopic(); sonnerToast.success("Melhor resposta marcada!"); } });
  const deleteTopic = trpc.forum.deleteTopic.useMutation({ onSuccess: () => { setView("topics"); setSelectedTopicId(null); refetchTopics(); sonnerToast.success("Tópico removido"); } });
  const deleteReply = trpc.forum.deleteReply.useMutation({ onSuccess: () => refetchTopic() });

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
      <div className="min-h-screen bg-[#0a0f1e] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate("/dashboard")} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Fórum de Discussão</h1>
              <p className="text-gray-400 text-sm">Selecione uma disciplina para acessar o fórum</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((s: any) => (
              <button
                key={s.id}
                onClick={() => { setSelectedSubjectId(s.id); setView("topics"); }}
                className="flex items-center gap-4 p-5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/50 hover:bg-white/10 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: s.color || '#3b82f6' }}>
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{s.name}</p>
                  <p className="text-gray-400 text-sm">{s.code}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-teal-400 transition-colors" />
              </button>
            ))}
          </div>

          {subjects.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma disciplina cadastrada</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── View: Lista de tópicos ───────────────────────────────────────────────
  if (view === "topics") {
    return (
      <div className="min-h-screen bg-[#0a0f1e] text-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView("subjects")} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">Fórum — {selectedSubject?.name}</h1>
              <p className="text-gray-400 text-sm">{filteredTopics.length} tópico(s)</p>
            </div>
            <Button onClick={() => setShowNewTopic(true)}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black font-semibold">
              <Plus className="w-4 h-4 mr-2" /> Novo Tópico
            </Button>
          </div>

          {/* Busca */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar tópicos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50"
            />
          </div>

          {/* Formulário novo tópico */}
          {showNewTopic && (
            <div className="mb-6 p-5 rounded-xl bg-white/5 border border-teal-500/30">
              <h3 className="font-semibold text-white mb-4">Novo Tópico</h3>
              <input
                type="text"
                placeholder="Título do tópico..."
                value={newTopicTitle}
                onChange={e => setNewTopicTitle(e.target.value)}
                className="w-full px-4 py-3 bg-[#0d1a2e] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 mb-3"
              />
              <textarea
                placeholder="Descreva o tópico..."
                value={newTopicContent}
                onChange={e => setNewTopicContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-[#0d1a2e] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 resize-none mb-3"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setShowNewTopic(false)} className="text-gray-400">Cancelar</Button>
                <Button
                  onClick={() => createTopic.mutate({ subjectId: selectedSubjectId!, title: newTopicTitle, content: newTopicContent })}
                  disabled={!newTopicTitle.trim() || !newTopicContent.trim() || createTopic.isPending}
                  className="bg-teal-500 hover:bg-teal-400 text-black font-semibold">
                  {createTopic.isPending ? "Criando..." : "Criar Tópico"}
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
                className="w-full flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/30 hover:bg-white/8 transition-all text-left"
              >
                <div className={`mt-1 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${t.isClosed ? 'bg-gray-700' : 'bg-teal-500/20'}`}>
                  <MessageSquare className={`w-5 h-5 ${t.isClosed ? 'text-gray-500' : 'text-teal-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {t.isPinned && <Pin className="w-3.5 h-3.5 text-yellow-400" />}
                    {t.isClosed && <Lock className="w-3.5 h-3.5 text-gray-500" />}
                    {t.bestReplyId && <Star className="w-3.5 h-3.5 text-green-400" />}
                    <span className="font-semibold text-white truncate">{t.title}</span>
                  </div>
                  <p className="text-gray-400 text-sm truncate">{t.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{t.viewCount}</span>
                    <span className="flex items-center gap-1"><Reply className="w-3 h-3" />{t.replyCount}</span>
                    <span>{formatDate(t.updatedAt)}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 mt-3" />
              </button>
            ))}
          </div>

          {filteredTopics.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum tópico encontrado</p>
              <p className="text-sm mt-1">Crie o primeiro tópico para iniciar as discussões</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── View: Tópico individual ──────────────────────────────────────────────
  const topic = topicData?.topic as Topic | undefined;
  const replies = (topicData?.replies || []) as Reply[];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setView("topics"); setSelectedTopicId(null); }} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{topic?.title || "Carregando..."}</h1>
            <p className="text-gray-400 text-sm">{selectedSubject?.name}</p>
          </div>
          {topic && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => pinTopic.mutate({ topicId: topic.id, isPinned: !topic.isPinned })}
                title={topic.isPinned ? "Desafixar" : "Fixar"}
                className={`p-2 rounded-lg transition-colors ${topic.isPinned ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-white/10 text-gray-400'}`}>
                <Pin className="w-4 h-4" />
              </button>
              <button
                onClick={() => closeTopic.mutate({ topicId: topic.id, isClosed: !topic.isClosed })}
                title={topic.isClosed ? "Reabrir" : "Fechar"}
                className={`p-2 rounded-lg transition-colors ${topic.isClosed ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-white/10 text-gray-400'}`}>
                {topic.isClosed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { if (confirm("Remover este tópico?")) deleteTopic.mutate({ topicId: topic.id }); }}
                className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Tópico principal */}
        {topic && (
          <div className="p-5 rounded-xl bg-white/5 border border-white/10 mb-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {topic.isPinned && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Fixado</Badge>}
              {topic.isClosed && <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Fechado</Badge>}
              <span className="text-xs text-gray-500">{formatDate(topic.createdAt)}</span>
              <span className="text-xs text-teal-400 font-medium">Professor</span>
            </div>
            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{topic.content}</p>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{topic.viewCount} visualizações</span>
              <span className="flex items-center gap-1"><Reply className="w-3 h-3" />{topic.replyCount} respostas</span>
            </div>
          </div>
        )}

        {/* Respostas */}
        <div className="space-y-4 mb-6">
          {replies.map((r: Reply) => (
            <div key={r.id} className={`p-4 rounded-xl border ${r.isBestAnswer ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {r.isBestAnswer && (
                    <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Melhor Resposta
                    </span>
                  )}
                  <span className={`text-xs font-medium ${r.authorType === 'teacher' ? 'text-teal-400' : 'text-blue-400'}`}>
                    {r.authorType === 'teacher' ? 'Professor' : 'Aluno'}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  {!r.isBestAnswer && (
                    <button
                      onClick={() => markBest.mutate({ topicId: topic!.id, replyId: r.id })}
                      title="Marcar como melhor resposta"
                      className="p-1.5 rounded hover:bg-green-500/20 text-gray-500 hover:text-green-400 transition-colors">
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm("Remover esta resposta?")) deleteReply.mutate({ replyId: r.id }); }}
                    className="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}

          {replies.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma resposta ainda. Seja o primeiro a responder!</p>
            </div>
          )}
        </div>

        {/* Caixa de resposta */}
        {topic && !topic.isClosed ? (
          <div className="p-5 rounded-xl bg-white/5 border border-white/10">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Reply className="w-4 h-4 text-teal-400" /> Sua Resposta
            </h3>
            <textarea
              placeholder="Escreva sua resposta..."
              value={newReplyContent}
              onChange={e => setNewReplyContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-[#0d1a2e] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 resize-none mb-3"
            />
            <div className="flex justify-end">
              <Button
                onClick={() => reply.mutate({ topicId: topic.id, content: newReplyContent })}
                disabled={!newReplyContent.trim() || reply.isPending}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black font-semibold">
                {reply.isPending ? "Enviando..." : "Enviar Resposta"}
              </Button>
            </div>
          </div>
        ) : topic?.isClosed ? (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Este tópico está fechado para novas respostas.</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
