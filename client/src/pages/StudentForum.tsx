import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, ChevronRight, ArrowLeft, Send,
  Loader2, BookOpen, Plus, Lock, Pin, Eye, Paperclip,
  Award, Home, ChevronRight as Chevron, Users, Clock,
  MessageCircle, FileText, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import StudentLayout from "@/components/StudentLayout";

type View = "subjects" | "forums" | "topics" | "topic_detail";

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
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

export default function StudentForum() {
  const [view, setView] = useState<View>("subjects");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [selectedSubjectCode, setSelectedSubjectCode] = useState("");
  const [selectedSubjectColor, setSelectedSubjectColor] = useState("#3b82f6");
  const [selectedForumId, setSelectedForumId] = useState<number | null>(null);
  const [selectedForumTitle, setSelectedForumTitle] = useState("");
  const [selectedForumDesc, setSelectedForumDesc] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState("");
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [topicForm, setTopicForm] = useState({ title: "", content: "" });
  const [replyText, setReplyText] = useState("");

  const { data: enrolledSubjects } = trpc.student.getEnrolledSubjects.useQuery();
  const { data: forums } = trpc.forum.listForumsForStudent.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId && view === "forums" }
  );
  const { data: topics, refetch: refetchTopics } = trpc.forum.listTopicsByForumForStudent.useQuery(
    { forumId: selectedForumId! },
    { enabled: !!selectedForumId && (view === "topics" || view === "topic_detail") }
  );
  const { data: topicDetail, refetch: refetchTopicDetail } = trpc.forum.getTopic.useQuery(
    { topicId: selectedTopicId! },
    { enabled: !!selectedTopicId && view === "topic_detail" }
  );
  const { data: myGrades } = trpc.forum.getStudentForumGrades.useQuery(
    { subjectId: selectedSubjectId ?? undefined },
    { enabled: !!selectedSubjectId }
  );

  const createTopicMutation = trpc.forum.createTopicInForumAsStudent.useMutation({
    onSuccess: () => { toast.success("Tópico criado!"); setShowCreateTopic(false); refetchTopics(); setTopicForm({ title: "", content: "" }); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
  const replyMutation = trpc.forum.replyWithAttachmentAsStudent.useMutation({
    onSuccess: () => { toast.success("Resposta enviada!"); setReplyText(""); refetchTopicDetail(); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const forumTypeLabel: Record<string, string> = {
    general: "Fórum geral",
    single_topic: "Uma discussão",
    qa: "Perguntas e Respostas",
  };

  // ── Breadcrumb ──────────────────────────────────────────────────────────
  function renderBreadcrumb() {
    return (
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap">
        <Home className="w-3.5 h-3.5 flex-shrink-0" />
        <Chevron className="w-3.5 h-3.5 flex-shrink-0" />
        <button onClick={() => { setView("subjects"); setSelectedSubjectId(null); setSelectedForumId(null); setSelectedTopicId(null); }}
          className={view === "subjects" ? "font-semibold text-foreground" : "hover:text-primary transition-colors"}>
          Fórum de Discussão
        </button>
        {view !== "subjects" && (
          <>
            <Chevron className="w-3.5 h-3.5 flex-shrink-0" />
            <button onClick={() => { setView("forums"); setSelectedForumId(null); setSelectedTopicId(null); }}
              className={view === "forums" ? "font-semibold text-foreground" : "hover:text-primary transition-colors"}>
              {selectedSubjectName}
            </button>
          </>
        )}
        {(view === "topics" || view === "topic_detail") && (
          <>
            <Chevron className="w-3.5 h-3.5 flex-shrink-0" />
            <button onClick={() => { setView("topics"); setSelectedTopicId(null); }}
              className={view === "topics" ? "font-semibold text-foreground" : "hover:text-primary transition-colors"}>
              {selectedForumTitle}
            </button>
          </>
        )}
        {view === "topic_detail" && (
          <>
            <Chevron className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-semibold text-foreground truncate max-w-[180px]">{selectedTopicTitle}</span>
          </>
        )}
      </nav>
    );
  }

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Banner padrão */}
        <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-10 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Fórum de Discussão</h1>
                <p className="text-primary-foreground/80 mt-1">Participe das discussões e tire suas dúvidas com colegas e professores</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto py-6 px-4 max-w-5xl">

          {/* ── Navegação interna ── */}
          <div className="mb-5">
            {view !== "subjects" && (
              <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={() => {
                if (view === "topic_detail") { setView("topics"); setSelectedTopicId(null); }
                else if (view === "topics") { setView("forums"); setSelectedForumId(null); }
                else { setView("subjects"); setSelectedSubjectId(null); }
              }}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
            )}
            {view !== "subjects" && (
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-1">
                {view === "forums" && selectedSubjectName}
                {view === "topics" && selectedForumTitle}
                {view === "topic_detail" && selectedTopicTitle}
              </h2>
            )}
            {view !== "subjects" && (
              <p className="text-sm text-muted-foreground">
                {view === "forums" && (selectedForumDesc || `Fóruns da disciplina ${selectedSubjectCode || selectedSubjectName}`)}
                {view === "topics" && "Selecione um tópico para participar da discussão"}
                {view === "topic_detail" && "Leia e responda o tópico"}
              </p>
            )}
          </div>

          {renderBreadcrumb()}

          {/* ══════════════════════════════════════════════════════════
              VIEW: DISCIPLINAS — grade de cards estilo Moodle
          ══════════════════════════════════════════════════════════ */}
          {view === "subjects" && (
            <div className="space-y-2">
              {enrolledSubjects?.map((enrollment: any) => {
                const subj = enrollment.subject || enrollment;
                const subjectName = subj?.name || enrollment.subjectName || "Disciplina";
                const subjectCode = subj?.code || enrollment.subjectCode || "";
                const subjectColor = subj?.color || "#3b82f6";
                const subjectId = enrollment.subjectId || subj?.id || enrollment.id;
                return (
                  <button
                    key={subjectId}
                    onClick={() => {
                      setSelectedSubjectId(subjectId);
                      setSelectedSubjectName(subjectName);
                      setSelectedSubjectCode(subjectCode);
                      setSelectedSubjectColor(subjectColor);
                      setView("forums");
                    }}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-md border border-border bg-card hover:bg-accent/40 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-md flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                      style={{ backgroundColor: subjectColor }}>
                      {subjectName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{subjectName}</p>
                      {subjectCode && <p className="text-xs text-muted-foreground">{subjectCode}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })}
              {(!enrolledSubjects || enrolledSubjects.length === 0) && (
                <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-lg">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Nenhuma disciplina encontrada</p>
                  <p className="text-sm mt-1">Você ainda não está matriculado em nenhuma disciplina.</p>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW: FÓRUNS — lista estilo Moodle com ícone + descrição + contagem
          ══════════════════════════════════════════════════════════ */}
          {view === "forums" && (
            <div>
              {/* Notas de fórum */}
              {myGrades && myGrades.length > 0 && (
                <div className="mb-4 border border-amber-200 bg-amber-50 rounded-md p-4">
                  <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-2 text-sm">
                    <Award className="w-4 h-4" /> Suas Notas de Fórum
                  </h3>
                  <div className="space-y-1">
                    {myGrades.map((g: any) => (
                      <div key={g.id} className="flex items-center justify-between text-sm">
                        <span className="text-amber-700">{g.forumTitle}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-amber-400 text-amber-700 text-xs">{g.grade}/10</Badge>
                          {g.feedback && <span className="text-xs text-amber-600 italic">"{g.feedback}"</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabela de fóruns estilo Moodle */}
              {forums && forums.length > 0 ? (
                <div className="border border-border rounded-md overflow-hidden">
                  {/* Cabeçalho da tabela */}
                  <div className="grid grid-cols-[1fr_auto_auto] bg-muted/50 border-b border-border px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <span>Fórum</span>
                    <span className="text-center w-24">Tópicos</span>
                    <span className="text-center w-28">Tipo</span>
                  </div>
                  {forums.map((forum: any, idx: number) => (
                    <button
                      key={forum.id}
                      onClick={() => {
                        setSelectedForumId(forum.id);
                        setSelectedForumTitle(forum.title);
                        setSelectedForumDesc(forum.description || "");
                        setView("topics");
                      }}
                      className={`w-full grid grid-cols-[1fr_auto_auto] items-center px-4 py-4 text-left hover:bg-accent/40 transition-colors group ${idx < forums.length - 1 ? "border-b border-border" : ""}`}
                    >
                      {/* Coluna principal */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: selectedSubjectColor + "20" }}>
                          <MessageCircle className="w-5 h-5" style={{ color: selectedSubjectColor }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {forum.title}
                          </p>
                          {forum.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{forum.description}</p>
                          )}
                          {forum.gradeEnabled && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-1">
                              <Award className="w-3 h-3" /> Avaliado
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Tópicos */}
                      <div className="w-24 text-center">
                        <span className="text-sm font-medium text-foreground">{forum.topicCount ?? 0}</span>
                        <p className="text-xs text-muted-foreground">tópicos</p>
                      </div>
                      {/* Tipo */}
                      <div className="w-28 text-center">
                        <Badge variant="secondary" className="text-xs">
                          {forumTypeLabel[forum.forumType] || forum.forumType}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-md">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Nenhum fórum disponível</p>
                  <p className="text-sm mt-1">O professor ainda não criou fóruns para esta disciplina.</p>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW: TÓPICOS — tabela estilo Moodle
          ══════════════════════════════════════════════════════════ */}
          {view === "topics" && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm text-muted-foreground">{topics?.length ?? 0} tópico(s)</p>
                <Button size="sm" onClick={() => setShowCreateTopic(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Novo Tópico
                </Button>
              </div>

              {topics && topics.length > 0 ? (
                <div className="border border-border rounded-md overflow-hidden">
                  {/* Cabeçalho */}
                  <div className="grid grid-cols-[1fr_120px_120px_80px] bg-muted/50 border-b border-border px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <span>Discussão</span>
                    <span className="text-center">Iniciado por</span>
                    <span className="text-center">Última resposta</span>
                    <span className="text-center">Respostas</span>
                  </div>
                  {topics.map((topic: any, idx: number) => (
                    <button
                      key={topic.id}
                      onClick={() => { setSelectedTopicId(topic.id); setSelectedTopicTitle(topic.title); setView("topic_detail"); }}
                      className={`w-full grid grid-cols-[1fr_120px_120px_80px] items-center px-4 py-3 text-left hover:bg-accent/40 transition-colors group ${idx < topics.length - 1 ? "border-b border-border" : ""}`}
                    >
                      {/* Discussão */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex-shrink-0">
                          {topic.isClosed
                            ? <Lock className="w-4 h-4 text-muted-foreground" />
                            : topic.isPinned
                              ? <Pin className="w-4 h-4 text-primary" />
                              : <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                            {topic.title}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{topic.viewCount ?? 0}</span>
                            {topic.bestReplyId && (
                              <Badge variant="outline" className="text-xs border-green-400 text-green-700 py-0">Resolvido</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Iniciado por */}
                      <div className="text-center px-2">
                        <p className="text-xs text-foreground truncate">{topic.authorName || "Aluno"}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(topic.createdAt)}</p>
                      </div>
                      {/* Última resposta */}
                      <div className="text-center px-2">
                        {topic.lastReplyAt ? (
                          <>
                            <p className="text-xs text-foreground truncate">{topic.lastReplyAuthor || "—"}</p>
                            <p className="text-xs text-muted-foreground">{timeAgo(topic.lastReplyAt)}</p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">—</p>
                        )}
                      </div>
                      {/* Respostas */}
                      <div className="text-center">
                        <span className="text-sm font-semibold text-foreground">{topic.replyCount ?? 0}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-md">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Nenhum tópico ainda</p>
                  <p className="text-sm mt-1">Seja o primeiro a criar um tópico neste fórum!</p>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW: DETALHE DO TÓPICO — estilo thread Moodle
          ══════════════════════════════════════════════════════════ */}
          {view === "topic_detail" && topicDetail && (
            <div className="space-y-3">
              {/* Post principal */}
              <div className="border border-border rounded-md overflow-hidden">
                <div className="bg-primary/5 border-b border-border px-4 py-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Post inicial</span>
                  {topicDetail.topic?.isClosed && (
                    <Badge variant="outline" className="border-red-300 text-red-600 text-xs">
                      <Lock className="w-3 h-3 mr-1" /> Fechado
                    </Badge>
                  )}
                </div>
                <div className="flex gap-4 p-4">
                  {/* Avatar lateral */}
                  <div className="flex-shrink-0 text-center w-20">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm mx-auto mb-1">
                      {(topicDetail.topic?.authorName || "A").charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs font-medium text-foreground leading-tight">{topicDetail.topic?.authorName || "Aluno"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Aluno</p>
                  </div>
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-2">
                      {topicDetail.topic?.createdAt ? new Date(topicDetail.topic.createdAt).toLocaleString("pt-BR") : ""}
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{topicDetail.topic?.content}</p>
                  </div>
                </div>
              </div>

              {/* Respostas */}
              {topicDetail.replies && topicDetail.replies.length > 0 && (
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="bg-muted/40 border-b border-border px-4 py-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {topicDetail.replies.length} {topicDetail.replies.length === 1 ? "Resposta" : "Respostas"}
                    </span>
                  </div>
                  {topicDetail.replies.map((reply: any, idx: number) => (
                    <div key={reply.id}
                      className={`flex gap-4 p-4 ${reply.id === topicDetail.topic?.bestReplyId ? "bg-green-50 border-l-4 border-green-500" : ""} ${idx < topicDetail.replies.length - 1 ? "border-b border-border" : ""}`}>
                      {/* Avatar lateral */}
                      <div className="flex-shrink-0 text-center w-20">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm mx-auto mb-1">
                          {(reply.authorName || "U").charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs font-medium text-foreground leading-tight">{reply.authorName || "Usuário"}</p>
                      </div>
                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        {reply.id === topicDetail.topic?.bestReplyId && (
                          <div className="flex items-center gap-1 text-green-700 text-xs font-semibold mb-2">
                            <Award className="w-3.5 h-3.5" /> Melhor Resposta
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mb-2">
                          {reply.createdAt ? new Date(reply.createdAt).toLocaleString("pt-BR") : ""}
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{reply.content}</p>
                        {reply.attachmentUrl && (
                          <a href={reply.attachmentUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                            <Paperclip className="w-3 h-3" /> Ver anexo
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Caixa de resposta */}
              {!topicDetail.topic?.isClosed ? (
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="bg-muted/40 border-b border-border px-4 py-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sua Resposta</span>
                  </div>
                  <div className="p-4">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escreva sua resposta..."
                      className="min-h-[100px] mb-3"
                    />
                    <div className="flex justify-end">
                      <Button size="sm"
                        disabled={!replyText.trim() || replyMutation.isPending}
                        onClick={() => replyMutation.mutate({ topicId: selectedTopicId!, content: replyText })}>
                        {replyMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                        Enviar Resposta
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground border border-border rounded-md bg-muted/20">
                  <Lock className="w-7 h-7 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Este tópico está fechado para novas respostas.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modal: Criar Tópico */}
      <Dialog open={showCreateTopic} onOpenChange={setShowCreateTopic}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Tópico</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={topicForm.title}
                onChange={(e) => setTopicForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Título do tópico"
              />
            </div>
            <div>
              <Label>Conteúdo *</Label>
              <Textarea
                value={topicForm.content}
                onChange={(e) => setTopicForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Descreva sua dúvida ou discussão..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTopic(false)}>Cancelar</Button>
            <Button
              disabled={!topicForm.title.trim() || !topicForm.content.trim() || createTopicMutation.isPending}
              onClick={() => createTopicMutation.mutate({ forumId: selectedForumId!, title: topicForm.title, content: topicForm.content })}
            >
              {createTopicMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Criar Tópico
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}
