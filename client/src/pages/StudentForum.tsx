import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, ChevronRight, ArrowLeft, Send,
  Loader2, BookOpen, Plus, Lock, Pin, Eye, Paperclip,
  Award, FileText, Home, ChevronRight as Chevron,
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

export default function StudentForum() {
  const [view, setView] = useState<View>("subjects");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [selectedSubjectCode, setSelectedSubjectCode] = useState("");
  const [selectedSubjectColor, setSelectedSubjectColor] = useState("#3b82f6");
  const [selectedForumId, setSelectedForumId] = useState<number | null>(null);
  const [selectedForumTitle, setSelectedForumTitle] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState("");
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [topicForm, setTopicForm] = useState({ title: "", content: "" });
  const [replyText, setReplyText] = useState("");

  // Queries
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

  // Mutations
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

  // ── Breadcrumb dinâmico ──────────────────────────────────────────────────
  function renderBreadcrumb() {
    return (
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Home className="w-3.5 h-3.5" />
        <Chevron className="w-3.5 h-3.5" />
        <span>Comunicação</span>
        <Chevron className="w-3.5 h-3.5" />
        <button
          onClick={() => { setView("subjects"); setSelectedSubjectId(null); setSelectedForumId(null); setSelectedTopicId(null); }}
          className={view === "subjects" ? "font-semibold text-foreground" : "hover:text-foreground"}
        >
          Fórum de Discussão
        </button>
        {view !== "subjects" && (
          <>
            <Chevron className="w-3.5 h-3.5" />
            <button
              onClick={() => { setView("forums"); setSelectedForumId(null); setSelectedTopicId(null); }}
              className={view === "forums" ? "font-semibold text-foreground" : "hover:text-foreground"}
            >
              {selectedSubjectName}
            </button>
          </>
        )}
        {(view === "topics" || view === "topic_detail") && (
          <>
            <Chevron className="w-3.5 h-3.5" />
            <button
              onClick={() => { setView("topics"); setSelectedTopicId(null); }}
              className={view === "topics" ? "font-semibold text-foreground" : "hover:text-foreground"}
            >
              {selectedForumTitle}
            </button>
          </>
        )}
        {view === "topic_detail" && (
          <>
            <Chevron className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground truncate max-w-[200px]">{selectedTopicTitle}</span>
          </>
        )}
      </nav>
    );
  }

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header gradiente padrão */}
        <div className="bg-gradient-to-r from-primary to-accent text-white py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">
                    {view === "subjects" && "Fórum de Discussão"}
                    {view === "forums" && `Fóruns — ${selectedSubjectName}`}
                    {view === "topics" && selectedForumTitle}
                    {view === "topic_detail" && selectedTopicTitle}
                  </h1>
                  <p className="text-primary-foreground/80 mt-1">
                    {view === "subjects" && "Participe das discussões das suas disciplinas"}
                    {view === "forums" && `Disciplina: ${selectedSubjectCode || selectedSubjectName}`}
                    {view === "topics" && "Selecione um tópico para participar"}
                    {view === "topic_detail" && "Leia e responda o tópico"}
                  </p>
                </div>
              </div>
              {/* Botão voltar */}
              {view !== "subjects" && (
                <Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => {
                  if (view === "topic_detail") { setView("topics"); setSelectedTopicId(null); }
                  else if (view === "topics") { setView("forums"); setSelectedForumId(null); }
                  else { setView("subjects"); setSelectedSubjectId(null); }
                }}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
              )}
            </div>
          </div>
        </div>
        {/* Breadcrumb */}
        <div className="p-6 max-w-5xl mx-auto w-full">
        {renderBreadcrumb()}

        {/* ══════════════════════════════════════════════════════════
            VIEW: DISCIPLINAS
        ══════════════════════════════════════════════════════════ */}
        {view === "subjects" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: subjectColor }}
                  >
                    {subjectName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{subjectName}</p>
                    <p className="text-xs text-muted-foreground">{subjectCode || "Código não disponível"}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
            {(!enrolledSubjects || enrolledSubjects.length === 0) && (
              <div className="col-span-2 text-center py-16 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhuma disciplina encontrada</p>
                <p className="text-sm mt-1">Você ainda não está matriculado em nenhuma disciplina.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: FÓRUNS
        ══════════════════════════════════════════════════════════ */}
        {view === "forums" && (
          <div className="space-y-4">
            {/* Minhas notas de fórum */}
            {myGrades && myGrades.length > 0 && (
              <div className="border-l-4 border-amber-400 bg-amber-50 rounded-r-lg p-4 mb-2">
                <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4" /> Suas Notas de Fórum
                </h3>
                <div className="space-y-1">
                  {myGrades.map((g: any) => (
                    <div key={g.id} className="flex items-center justify-between text-sm">
                      <span className="text-amber-700">{g.forumTitle}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-amber-400 text-amber-700">
                          {g.grade}/10
                        </Badge>
                        {g.feedback && <span className="text-xs text-amber-600 italic">"{g.feedback}"</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {forums?.map((forum: any) => (
              <button
                key={forum.id}
                onClick={() => { setSelectedForumId(forum.id); setSelectedForumTitle(forum.title); setView("topics"); }}
                className="w-full flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: selectedSubjectColor + "20" }}>
                  <MessageSquare className="w-5 h-5" style={{ color: selectedSubjectColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">{forum.title}</p>
                    <Badge variant="secondary" className="text-xs">{forumTypeLabel[forum.forumType] || forum.forumType}</Badge>
                    {forum.gradeEnabled && (
                      <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">
                        <Award className="w-3 h-3 mr-1" /> Avaliado
                      </Badge>
                    )}
                  </div>
                  {forum.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{forum.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{forum.topicCount ?? 0} tópicos</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </button>
            ))}
            {(!forums || forums.length === 0) && (
              <div className="text-center py-16 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhum fórum disponível</p>
                <p className="text-sm mt-1">O professor ainda não criou fóruns para esta disciplina.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: TÓPICOS
        ══════════════════════════════════════════════════════════ */}
        {view === "topics" && (
          <div className="space-y-3">
            <div className="flex justify-end mb-2">
              <Button size="sm" onClick={() => setShowCreateTopic(true)}>
                <Plus className="w-4 h-4 mr-1" /> Novo Tópico
              </Button>
            </div>
            {topics?.map((topic: any) => (
              <button
                key={topic.id}
                onClick={() => { setSelectedTopicId(topic.id); setSelectedTopicTitle(topic.title); setView("topic_detail"); }}
                className="w-full flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {topic.isPinned && <Pin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                    {topic.isClosed && <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                    <p className="font-semibold text-foreground truncate">{topic.title}</p>
                    {topic.bestReplyId && (
                      <Badge variant="outline" className="text-xs border-green-400 text-green-700">Resolvido</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{topic.replyCount ?? 0} respostas</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{topic.viewCount ?? 0} visualizações</span>
                    <span>{topic.authorName || "Aluno"}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </button>
            ))}
            {(!topics || topics.length === 0) && (
              <div className="text-center py-16 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhum tópico ainda</p>
                <p className="text-sm mt-1">Seja o primeiro a criar um tópico!</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: DETALHE DO TÓPICO
        ══════════════════════════════════════════════════════════ */}
        {view === "topic_detail" && topicDetail && (
          <div className="space-y-4">
            {/* Post principal */}
            <div className="border-l-4 border-blue-500 bg-card rounded-r-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                  {(topicDetail.topic?.authorName || "A").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{topicDetail.topic?.authorName || "Aluno"}</p>
                  <p className="text-xs text-muted-foreground">
                    {topicDetail.topic?.createdAt ? new Date(topicDetail.topic.createdAt).toLocaleString("pt-BR") : ""}
                  </p>
                </div>
                {topicDetail.topic?.isClosed && (
                  <Badge variant="outline" className="ml-auto border-red-300 text-red-600 text-xs">
                    <Lock className="w-3 h-3 mr-1" /> Fechado
                  </Badge>
                )}
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{topicDetail.topic?.content}</p>
            </div>

            {/* Respostas */}
            {topicDetail.replies?.map((reply: any) => (
              <div
                key={reply.id}
                className={`rounded-lg p-4 border ${reply.id === topicDetail.topic?.bestReplyId
                  ? "border-l-4 border-green-500 bg-green-50"
                  : "border-border bg-card"
                }`}
              >
                {reply.id === topicDetail.topic?.bestReplyId && (
                  <div className="flex items-center gap-1 text-green-700 text-xs font-semibold mb-2">
                    <Award className="w-3.5 h-3.5" /> Melhor Resposta
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                    {(reply.authorName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-xs">{reply.authorName || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground">
                      {reply.createdAt ? new Date(reply.createdAt).toLocaleString("pt-BR") : ""}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{reply.content}</p>
                {reply.attachmentUrl && (
                  <a href={reply.attachmentUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2">
                    <Paperclip className="w-3 h-3" /> Ver anexo
                  </a>
                )}
              </div>
            ))}

            {/* Caixa de resposta */}
            {!topicDetail.topic?.isClosed ? (
              <div className="border border-border rounded-lg p-4 bg-card">
                <Label className="text-sm font-medium mb-2 block">Sua resposta</Label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escreva sua resposta..."
                  className="min-h-[100px] mb-3"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={!replyText.trim() || replyMutation.isPending}
                    onClick={() => replyMutation.mutate({ topicId: selectedTopicId!, content: replyText })}
                  >
                    {replyMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                    Enviar Resposta
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground border border-border rounded-lg bg-card">
                <Lock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Este tópico está fechado para novas respostas.</p>
              </div>
            )}
          </div>
        )}

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
      </div>
    </StudentLayout>
  );
}
