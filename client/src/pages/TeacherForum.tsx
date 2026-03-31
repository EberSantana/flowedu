import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, Plus, Settings, Trash2, Pin, Lock, Unlock,
  ChevronRight, ArrowLeft, Send, Star, Award, Users, FileText,
  Loader2, BookOpen, Edit2, X, Check, Paperclip, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Breadcrumb } from "@/components/Breadcrumb";

type View = "subjects" | "forums" | "topics" | "topic_detail" | "grades";

export default function TeacherForum() {
  const [, setLocation] = useLocation();
  const [view, setView] = useState<View>("subjects");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [selectedForumId, setSelectedForumId] = useState<number | null>(null);
  const [selectedForumTitle, setSelectedForumTitle] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState("");

  // Modais
  const [showCreateForum, setShowCreateForum] = useState(false);
  const [showEditForum, setShowEditForum] = useState(false);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeStudentId, setGradeStudentId] = useState<number | null>(null);
  const [gradeStudentName, setGradeStudentName] = useState("");
  const [gradeValue, setGradeValue] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");

  // Formulários
  const [forumForm, setForumForm] = useState({
    title: "", description: "", forumType: "general" as "general" | "single_topic" | "qa",
    requireSubscription: false, monitorReading: false, maxAttachmentSizeKb: 500,
    gradeEnabled: false, gradeMax: "10.0", gradeAggregation: "max" as "max" | "avg" | "sum" | "first" | "last",
  });
  const [topicForm, setTopicForm] = useState({ title: "", content: "" });
  const [replyText, setReplyText] = useState("");

  // Queries
  const { data: subjects } = trpc.subjects.list.useQuery();
  const { data: forums, refetch: refetchForums } = trpc.forum.listForums.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId && view === "forums" }
  );
  const { data: topics, refetch: refetchTopics } = trpc.forum.listTopicsByForum.useQuery(
    { forumId: selectedForumId! },
    { enabled: !!selectedForumId && (view === "topics" || view === "topic_detail") }
  );
  const { data: topicDetail, refetch: refetchTopicDetail } = trpc.forum.getTopic.useQuery(
    { topicId: selectedTopicId! },
    { enabled: !!selectedTopicId && view === "topic_detail" }
  );
  const { data: forumGrades, refetch: refetchGrades } = trpc.forum.getForumGrades.useQuery(
    { forumId: selectedForumId! },
    { enabled: !!selectedForumId && view === "grades" }
  );
  const { data: participationStats } = trpc.forum.getForumParticipationStats.useQuery(
    { forumId: selectedForumId! },
    { enabled: !!selectedForumId && view === "grades" }
  );
  const { data: enrolledStudents } = trpc.students.list.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId && view === "grades" }
  );

  // Mutations
  const createForumMutation = trpc.forum.createForum.useMutation({
    onSuccess: () => { toast.success("Fórum criado!"); setShowCreateForum(false); refetchForums(); resetForumForm(); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
  const deleteForumMutation = trpc.forum.deleteForum.useMutation({
    onSuccess: () => { toast.success("Fórum excluído!"); refetchForums(); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
  const createTopicMutation = trpc.forum.createTopicInForum.useMutation({
    onSuccess: () => { toast.success("Tópico criado!"); setShowCreateTopic(false); refetchTopics(); setTopicForm({ title: "", content: "" }); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
  const pinTopicMutation = trpc.forum.pinTopic.useMutation({ onSuccess: () => refetchTopics() });
  const closeTopicMutation = trpc.forum.closeTopic.useMutation({ onSuccess: () => { refetchTopics(); refetchTopicDetail(); } });
  const deleteTopicMutation = trpc.forum.deleteTopic.useMutation({
    onSuccess: () => { toast.success("Tópico excluído!"); setView("topics"); refetchTopics(); },
  });
  const replyMutation = trpc.forum.replyWithAttachmentAsTeacher.useMutation({
    onSuccess: () => { toast.success("Resposta enviada!"); setReplyText(""); refetchTopicDetail(); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
  const setGradeMutation = trpc.forum.setForumGrade.useMutation({
    onSuccess: () => { toast.success("Nota salva!"); setShowGradeModal(false); refetchGrades(); setGradeValue(""); setGradeFeedback(""); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  function resetForumForm() {
    setForumForm({ title: "", description: "", forumType: "general", requireSubscription: false, monitorReading: false, maxAttachmentSizeKb: 500, gradeEnabled: false, gradeMax: "10.0", gradeAggregation: "max" });
  }

  function openGradeModal(studentId: number, studentName: string) {
    setGradeStudentId(studentId);
    setGradeStudentName(studentName);
    const existing = forumGrades?.find(g => g.studentId === studentId);
    setGradeValue(existing ? String(existing.grade) : "");
    setGradeFeedback(existing?.feedback ?? "");
    setShowGradeModal(true);
  }

  const forumTypeLabel = { general: "Fórum geral", single_topic: "Uma discussão", qa: "Perguntas e Respostas" };
  const aggLabel = { max: "Nota máxima", avg: "Média", sum: "Soma", first: "Primeira nota", last: "Última nota" };

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background">
        <div className="p-6 max-w-5xl mx-auto w-full">
          {/* Breadcrumb */}
          <Breadcrumb items={[
            { label: "Início", href: "/" },
            { label: "Comunicação" },
            { label: "Fórum de Discussão", href: "/teacher/forum" },
            ...(selectedSubjectName ? [{ label: selectedSubjectName }] : []),
            ...(selectedForumTitle ? [{ label: selectedForumTitle }] : []),
            ...(selectedTopicTitle ? [{ label: selectedTopicTitle }] : []),
          ]} />

          {/* ============ VIEW: DISCIPLINAS ============ */}
          {view === "subjects" && (
            <>
              <div className="flex items-center gap-3 mb-2 mt-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Fórum de Discussão</h1>
                  <p className="text-sm text-muted-foreground">Selecione uma disciplina para gerenciar os fóruns</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {subjects?.map(subject => (
                  <button
                    key={subject.id}
                    onClick={() => { setSelectedSubjectId(subject.id); setSelectedSubjectName(subject.name); setView("forums"); }}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: subject.color || "#3b82f6" }}>
                      {subject.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">{(subject as any).classCode || "Todas as turmas"}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
                {(!subjects || subjects.length === 0) && (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>Nenhuma disciplina encontrada</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ============ VIEW: FÓRUNS DA DISCIPLINA ============ */}
          {view === "forums" && (
            <>
              <button onClick={() => setView("subjects")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 mt-4">
                <ArrowLeft className="w-4 h-4" /> Voltar às Disciplinas
              </button>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Fóruns — {selectedSubjectName}</h1>
                    <p className="text-sm text-muted-foreground">{forums?.length ?? 0} fórum(s) criado(s)</p>
                  </div>
                </div>
                <Button onClick={() => setShowCreateForum(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> Novo Fórum
                </Button>
              </div>

              {/* Cards de fóruns */}
              <div className="space-y-3">
                {forums?.map(forum => (
                  <div key={forum.id} className="border border-border rounded-lg bg-card overflow-hidden">
                    <div className="flex items-center gap-4 p-4 border-l-4 border-l-blue-500">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{forum.title}</h3>
                          <Badge variant="outline" className="text-xs">{forumTypeLabel[forum.forumType as keyof typeof forumTypeLabel]}</Badge>
                          {forum.gradeEnabled && <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">Avaliado — Nota {forum.gradeMax}</Badge>}
                          {!forum.isOpen && <Badge variant="destructive" className="text-xs">Fechado</Badge>}
                        </div>
                        {forum.description && <p className="text-sm text-muted-foreground mt-1 truncate">{forum.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {forum.gradeEnabled && (
                          <Button size="sm" variant="outline" className="gap-1 text-amber-600 border-amber-300"
                            onClick={() => { setSelectedForumId(forum.id); setSelectedForumTitle(forum.title); setView("grades"); }}>
                            <Award className="w-3 h-3" /> Notas
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="gap-1"
                          onClick={() => { setSelectedForumId(forum.id); setSelectedForumTitle(forum.title); setView("topics"); }}>
                          <MessageSquare className="w-3 h-3" /> Tópicos
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("Excluir este fórum e todos os seus tópicos?")) deleteForumMutation.mutate({ forumId: forum.id }); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {(!forums || forums.length === 0) && (
                  <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Nenhum fórum criado ainda</p>
                    <p className="text-sm mt-1">Clique em "Novo Fórum" para criar o primeiro</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ============ VIEW: TÓPICOS DO FÓRUM ============ */}
          {view === "topics" && (
            <>
              <button onClick={() => setView("forums")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 mt-4">
                <ArrowLeft className="w-4 h-4" /> Voltar aos Fóruns
              </button>

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{selectedForumTitle}</h1>
                  <p className="text-sm text-muted-foreground">{topics?.length ?? 0} tópico(s)</p>
                </div>
                <Button onClick={() => setShowCreateTopic(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> Novo Tópico
                </Button>
              </div>

              <div className="space-y-3">
                {topics?.map(topic => (
                  <div key={topic.id}
                    className={`border rounded-lg bg-card overflow-hidden border-l-4 ${topic.isPinned ? "border-l-amber-400" : topic.isClosed ? "border-l-gray-300" : "border-l-blue-400"}`}>
                    <div className="flex items-center gap-4 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {topic.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
                          {topic.isClosed && <Lock className="w-3 h-3 text-gray-400" />}
                          <h3 className="font-medium text-foreground truncate">{topic.title}</h3>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{topic.viewCount} visualizações</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{topic.replyCount} respostas</span>
                          <span>{new Date(topic.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button size="sm" variant="ghost" title={topic.isPinned ? "Desafixar" : "Fixar"}
                          onClick={() => pinTopicMutation.mutate({ topicId: topic.id, isPinned: !topic.isPinned })}>
                          <Pin className={`w-4 h-4 ${topic.isPinned ? "text-amber-500" : ""}`} />
                        </Button>
                        <Button size="sm" variant="ghost" title={topic.isClosed ? "Reabrir" : "Fechar"}
                          onClick={() => closeTopicMutation.mutate({ topicId: topic.id, isClosed: !topic.isClosed })}>
                          {topic.isClosed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive"
                          onClick={() => { if (confirm("Excluir este tópico?")) deleteTopicMutation.mutate({ topicId: topic.id }); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1"
                          onClick={() => { setSelectedTopicId(topic.id); setSelectedTopicTitle(topic.title); setView("topic_detail"); }}>
                          Ver <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {(!topics || topics.length === 0) && (
                  <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum tópico ainda. Crie o primeiro!</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ============ VIEW: DETALHE DO TÓPICO ============ */}
          {view === "topic_detail" && topicDetail && (
            <>
              <button onClick={() => setView("topics")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 mt-4">
                <ArrowLeft className="w-4 h-4" /> Voltar aos Tópicos
              </button>

              {/* Post principal */}
              <div className="border border-border rounded-lg bg-card overflow-hidden mb-4">
                <div className="border-l-4 border-l-blue-500 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-foreground mb-1">{topicDetail.topic.title}</h2>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <span>{topicDetail.topic.authorType === "teacher" ? "Professor" : "Aluno"}</span>
                        <span>•</span>
                        <span>{new Date(topicDetail.topic.createdAt).toLocaleString("pt-BR")}</span>
                        <span>•</span>
                        <span>{topicDetail.topic.viewCount} visualizações</span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{topicDetail.topic.content}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost"
                        onClick={() => closeTopicMutation.mutate({ topicId: topicDetail.topic.id, isClosed: !topicDetail.topic.isClosed })}>
                        {topicDetail.topic.isClosed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Respostas */}
              <div className="space-y-3 mb-6">
                {topicDetail.replies?.map((reply: any) => (
                  <div key={reply.id} className={`border rounded-lg bg-card overflow-hidden border-l-4 ${reply.isBestAnswer ? "border-l-green-500" : reply.authorType === "teacher" ? "border-l-blue-400" : "border-l-gray-300"}`}>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                        {reply.isBestAnswer && <Badge className="bg-green-100 text-green-700 text-xs">Melhor Resposta</Badge>}
                        <span className="font-medium">{reply.authorType === "teacher" ? "Professor" : "Aluno"}</span>
                        <span>•</span>
                        <span>{new Date(reply.createdAt).toLocaleString("pt-BR")}</span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{reply.content}</p>
                      {reply.attachmentUrl && (
                        <a href={reply.attachmentUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline">
                          <Paperclip className="w-3 h-3" /> {reply.attachmentName || "Anexo"}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Caixa de resposta */}
              {!topicDetail.topic.isClosed && (
                <div className="border border-border rounded-lg bg-card p-4">
                  <Label className="text-sm font-medium mb-2 block">Sua resposta</Label>
                  <Textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Digite sua resposta..."
                    rows={4}
                    className="mb-3"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => replyMutation.mutate({ topicId: topicDetail.topic.id, content: replyText })}
                      disabled={!replyText.trim() || replyMutation.isPending}
                      className="gap-2">
                      {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Responder
                    </Button>
                  </div>
                </div>
              )}
              {topicDetail.topic.isClosed && (
                <div className="text-center py-4 text-muted-foreground text-sm border border-dashed rounded-lg">
                  <Lock className="w-4 h-4 mx-auto mb-1" />
                  Tópico fechado — respostas desabilitadas
                </div>
              )}
            </>
          )}

          {/* ============ VIEW: NOTAS / AVALIAÇÃO ============ */}
          {view === "grades" && (
            <>
              <button onClick={() => setView("forums")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 mt-4">
                <ArrowLeft className="w-4 h-4" /> Voltar aos Fóruns
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Avaliação de Participação</h1>
                  <p className="text-sm text-muted-foreground">{selectedForumTitle}</p>
                </div>
              </div>

              {/* Cards de estatísticas */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="border border-border rounded-lg bg-card p-4 border-l-4 border-l-blue-500">
                  <p className="text-sm text-muted-foreground">Total de Alunos</p>
                  <p className="text-2xl font-bold mt-1">{enrolledStudents?.length ?? 0}</p>
                </div>
                <div className="border border-border rounded-lg bg-card p-4 border-l-4 border-l-amber-400">
                  <p className="text-sm text-muted-foreground">Já Avaliados</p>
                  <p className="text-2xl font-bold mt-1">{forumGrades?.length ?? 0}</p>
                </div>
                <div className="border border-border rounded-lg bg-card p-4 border-l-4 border-l-green-500">
                  <p className="text-sm text-muted-foreground">Média da Turma</p>
                  <p className="text-2xl font-bold mt-1">
                    {forumGrades && forumGrades.length > 0
                      ? (forumGrades.reduce((s, g) => s + parseFloat(String(g.grade)), 0) / forumGrades.length).toFixed(1)
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Tabela de alunos */}
              <div className="border border-border rounded-lg bg-card overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> Alunos Matriculados
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {enrolledStudents?.map((student: any) => {
                    const grade = forumGrades?.find(g => g.studentId === student.id);
                    const stats = participationStats?.find(s => s.studentId === student.id);
                    return (
                      <div key={student.id} className="flex items-center gap-4 p-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {student.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {stats ? `${stats.topicCount} tópico(s) · ${stats.replyCount} resposta(s)` : "Sem participação registrada"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {grade ? (
                            <div className="text-right">
                              <span className="text-lg font-bold text-foreground">{grade.grade}</span>
                              <span className="text-xs text-muted-foreground">/10</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Sem nota</span>
                          )}
                          <Button size="sm" variant="outline" className="gap-1"
                            onClick={() => openGradeModal(student.id, student.name)}>
                            <Edit2 className="w-3 h-3" />
                            {grade ? "Editar" : "Avaliar"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {(!enrolledStudents || enrolledStudents.length === 0) && (
                    <div className="text-center py-10 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>Nenhum aluno matriculado</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ============ MODAL: CRIAR FÓRUM ============ */}
        <Dialog open={showCreateForum} onOpenChange={setShowCreateForum}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Novo Fórum</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Nome do Fórum *</Label>
                <Input value={forumForm.title} onChange={e => setForumForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Debate sobre Avaliação" className="mt-1" />
              </div>
              <div>
                <Label>Tipo de Fórum</Label>
                <Select value={forumForm.forumType} onValueChange={v => setForumForm(f => ({ ...f, forumType: v as any }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Fórum geral (múltiplos tópicos)</SelectItem>
                    <SelectItem value="single_topic">Uma única discussão</SelectItem>
                    <SelectItem value="qa">Perguntas e Respostas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Introdução ao Fórum</Label>
                <Textarea value={forumForm.description} onChange={e => setForumForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o objetivo deste fórum..." rows={3} className="mt-1" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Obrigar todos a serem assinantes?</Label>
                  <p className="text-xs text-muted-foreground">Todos recebem notificações de novos posts</p>
                </div>
                <Switch checked={forumForm.requireSubscription} onCheckedChange={v => setForumForm(f => ({ ...f, requireSubscription: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Monitorar a leitura deste fórum?</Label>
                </div>
                <Switch checked={forumForm.monitorReading} onCheckedChange={v => setForumForm(f => ({ ...f, monitorReading: v }))} />
              </div>
              <div>
                <Label>Tamanho máximo do anexo (KB)</Label>
                <Input type="number" value={forumForm.maxAttachmentSizeKb} onChange={e => setForumForm(f => ({ ...f, maxAttachmentSizeKb: parseInt(e.target.value) || 500 }))} className="mt-1 w-32" />
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label>Fórum Avaliado?</Label>
                    <p className="text-xs text-muted-foreground">A nota cai no boletim como nota extra</p>
                  </div>
                  <Switch checked={forumForm.gradeEnabled} onCheckedChange={v => setForumForm(f => ({ ...f, gradeEnabled: v }))} />
                </div>
                {forumForm.gradeEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Nota máxima</Label>
                      <Input value={forumForm.gradeMax} onChange={e => setForumForm(f => ({ ...f, gradeMax: e.target.value }))} className="mt-1" placeholder="10.0" />
                    </div>
                    <div>
                      <Label>Tipo de agregação</Label>
                      <Select value={forumForm.gradeAggregation} onValueChange={v => setForumForm(f => ({ ...f, gradeAggregation: v as any }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(aggLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateForum(false)}>Cancelar</Button>
              <Button onClick={() => createForumMutation.mutate({ ...forumForm, subjectId: selectedSubjectId! })}
                disabled={!forumForm.title.trim() || createForumMutation.isPending}>
                {createForumMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Criar Fórum
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ============ MODAL: CRIAR TÓPICO ============ */}
        <Dialog open={showCreateTopic} onOpenChange={setShowCreateTopic}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Tópico</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Título *</Label>
                <Input value={topicForm.title} onChange={e => setTopicForm(f => ({ ...f, title: e.target.value }))} placeholder="Título do tópico" className="mt-1" />
              </div>
              <div>
                <Label>Conteúdo *</Label>
                <Textarea value={topicForm.content} onChange={e => setTopicForm(f => ({ ...f, content: e.target.value }))} placeholder="Descreva o tópico..." rows={5} className="mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateTopic(false)}>Cancelar</Button>
              <Button onClick={() => createTopicMutation.mutate({ forumId: selectedForumId!, ...topicForm })}
                disabled={!topicForm.title.trim() || !topicForm.content.trim() || createTopicMutation.isPending}>
                {createTopicMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Criar Tópico
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ============ MODAL: AVALIAR ALUNO ============ */}
        <Dialog open={showGradeModal} onOpenChange={setShowGradeModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Avaliar Participação — {gradeStudentName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Nota (0 a 10)</Label>
                <Input type="number" min="0" max="10" step="0.1" value={gradeValue}
                  onChange={e => setGradeValue(e.target.value)} placeholder="Ex: 8.5" className="mt-1 w-32" />
                <p className="text-xs text-muted-foreground mt-1">Esta nota será registrada no boletim como nota extra</p>
              </div>
              <div>
                <Label>Feedback (opcional)</Label>
                <Textarea value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)}
                  placeholder="Comentário sobre a participação do aluno..." rows={3} className="mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGradeModal(false)}>Cancelar</Button>
              <Button onClick={() => setGradeMutation.mutate({ forumId: selectedForumId!, studentId: gradeStudentId!, grade: parseFloat(gradeValue), feedback: gradeFeedback })}
                disabled={!gradeValue || parseFloat(gradeValue) < 0 || parseFloat(gradeValue) > 10 || setGradeMutation.isPending}>
                {setGradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-1" />}
                Salvar Nota
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageWrapper>
    </>
  );
}
