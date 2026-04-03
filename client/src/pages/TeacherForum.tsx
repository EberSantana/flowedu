import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, Plus, Trash2, Pin, Lock, Unlock,
  ChevronRight, ArrowLeft, Send, Award, Users, FileText,
  Loader2, BookOpen, Edit2, Check, Paperclip, Eye,
  MessageCircle, Clock, AlertCircle, CheckCircle2, Star,
  ChevronDown, MoreVertical, Search, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox } from "lucide-react";

type View = "subjects" | "forums" | "topics" | "topic_detail" | "grades";

export default function TeacherForum() {
  const [, setLocation] = useLocation();
  const [view, setView] = useState<View>("subjects");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [selectedSubjectColor, setSelectedSubjectColor] = useState("#3b82f6");
  const [selectedForumId, setSelectedForumId] = useState<number | null>(null);
  const [selectedForumTitle, setSelectedForumTitle] = useState("");
  const [selectedForumData, setSelectedForumData] = useState<any>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState("");
  const [searchTopic, setSearchTopic] = useState("");

  // Modais
  const [showCreateForum, setShowCreateForum] = useState(false);
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
    onSuccess: () => { toast.success("Fórum criado com sucesso!"); setShowCreateForum(false); refetchForums(); resetForumForm(); },
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

  const forumTypeLabel: Record<string, string> = {
    general: "Fórum geral",
    single_topic: "Uma discussão",
    qa: "Perguntas e Respostas"
  };
  const forumTypeColor: Record<string, string> = {
    general: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    single_topic: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    qa: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

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
  const aggLabel = { max: "Nota máxima", avg: "Média", sum: "Soma", first: "Primeira nota", last: "Última nota" };

  const filteredTopics = topics?.filter(t =>
    !searchTopic || t.title.toLowerCase().includes(searchTopic.toLowerCase())
  );

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4">
          {/* Botão Voltar ao Dashboard */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <Breadcrumb
            items={[
              { label: "Comunicação" },
              { label: "Fórum de Discussão" },
              ...(selectedSubjectName ? [{ label: selectedSubjectName }] : []),
              ...(selectedForumTitle ? [{ label: selectedForumTitle }] : []),
              ...(selectedTopicTitle ? [{ label: selectedTopicTitle }] : []),
            ]}
          />

          {/* ============ VIEW: DISCIPLINAS ============ */}
          {view === "subjects" && (
            <>
              {/* Header */}
              <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-primary" />
                    Fórum de Discussão
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Gerencie os fóruns de discussão das suas disciplinas
                  </p>
                </div>
              </div>
              {/* Cards de Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Inbox className="h-4 w-4 text-primary" />
                      Disciplinas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{subjects?.length ?? 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Com fórum disponível</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-green-500" />
                      Fóruns Ativos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{subjects?.length ?? 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Abertos para discussão</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4 text-yellow-500" />
                      Participação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">—</div>
                    <p className="text-xs text-muted-foreground mt-1">Selecione um fórum</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {subjects?.map(subject => (
                  <button
                    key={subject.id}
                    onClick={() => {
                      setSelectedSubjectId(subject.id);
                      setSelectedSubjectName(subject.name);
                      setSelectedSubjectColor(subject.color || "#3b82f6");
                      setView("forums");
                    }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/40 transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
                      style={{ backgroundColor: subject.color || "#3b82f6" }}>
                      {subject.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{subject.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{(subject as any).classCode || "Clique para ver os fóruns"}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </button>
                ))}
                {(!subjects || subjects.length === 0) && (
                  <div className="col-span-2 text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Nenhuma disciplina encontrada</p>
                    <p className="text-sm mt-1">Crie disciplinas primeiro para usar o fórum</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ============ VIEW: FÓRUNS DA DISCIPLINA (estilo Moodle) ============ */}
          {view === "forums" && (
            <>
              <button onClick={() => setView("subjects")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 mt-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar às Disciplinas
              </button>

              {/* Cabeçalho da disciplina estilo Moodle */}
              <div className="rounded-xl overflow-hidden border border-border mb-5">
                <div className="px-5 py-4 flex items-center justify-between"
                  style={{ backgroundColor: selectedSubjectColor + "20", borderBottom: `3px solid ${selectedSubjectColor}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: selectedSubjectColor }}>
                      {selectedSubjectName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-foreground">{selectedSubjectName}</h1>
                      <p className="text-xs text-muted-foreground">{forums?.length ?? 0} fórum(s) nesta disciplina</p>
                    </div>
                  </div>
                  <Button onClick={() => setShowCreateForum(true)} className="gap-2" size="sm">
                    <Plus className="w-4 h-4" /> Adicionar Fórum
                  </Button>
                </div>

                {/* Tabela de fóruns estilo Moodle */}
                {forums && forums.length > 0 ? (
                  <div className="bg-card">
                    {/* Cabeçalho da tabela */}
                    <div className="grid grid-cols-[1fr_90px_110px_auto] bg-muted/60 border-b border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <span>Nome do Fórum</span>
                      <span className="text-center">Tópicos</span>
                      <span className="text-center">Tipo</span>
                      <span className="text-center w-32">Ações</span>
                    </div>
                    {forums.map((forum, idx) => (
                      <div key={forum.id}
                        className={`grid grid-cols-[1fr_90px_110px_auto] items-center px-4 py-4 ${idx < forums.length - 1 ? "border-b border-border" : ""} hover:bg-accent/20 transition-colors`}>
                        {/* Info do fórum */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: selectedSubjectColor + "20" }}>
                            <MessageCircle className="w-5 h-5" style={{ color: selectedSubjectColor }} />
                          </div>
                          <div className="min-w-0">
                            <button
                              className="font-semibold text-foreground hover:text-primary transition-colors text-left leading-tight"
                              onClick={() => {
                                setSelectedForumId(forum.id);
                                setSelectedForumTitle(forum.title);
                                setSelectedForumData(forum);
                                setView("topics");
                              }}>
                              {forum.title}
                            </button>
                            {forum.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{forum.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {forum.gradeEnabled && (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                  <Award className="w-3 h-3" /> Avaliado — máx. {forum.gradeMax}
                                </span>
                              )}
                              {!forum.isOpen && (
                                <Badge variant="destructive" className="text-xs py-0 h-4">Fechado</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Tópicos */}
                        <div className="text-center">
                          <button
                            className="text-sm font-bold text-primary hover:underline"
                            onClick={() => {
                              setSelectedForumId(forum.id);
                              setSelectedForumTitle(forum.title);
                              setSelectedForumData(forum);
                              setView("topics");
                            }}>
                            {(forum as any).topicCount ?? 0}
                          </button>
                        </div>
                        {/* Tipo */}
                        <div className="text-center px-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${forumTypeColor[forum.forumType] || "bg-gray-100 text-gray-700"}`}>
                            {forumTypeLabel[forum.forumType] || forum.forumType}
                          </span>
                        </div>
                        {/* Ações */}
                        <div className="flex items-center gap-1 w-32 justify-end">
                          {forum.gradeEnabled && (
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              title="Ver notas de participação"
                              onClick={() => {
                                setSelectedForumId(forum.id);
                                setSelectedForumTitle(forum.title);
                                setSelectedForumData(forum);
                                setView("grades");
                              }}>
                              <Award className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Excluir fórum"
                            onClick={() => { if (confirm("Excluir este fórum e todos os seus tópicos?")) deleteForumMutation.mutate({ forumId: forum.id }); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground bg-card">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Nenhum fórum criado ainda</p>
                    <p className="text-sm mt-1">Clique em "Adicionar Fórum" para criar o primeiro</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ============ VIEW: TÓPICOS DO FÓRUM (estilo Moodle) ============ */}
          {view === "topics" && (
            <>
              <button onClick={() => setView("forums")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 mt-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar aos Fóruns
              </button>

              {/* Cabeçalho do fórum estilo Moodle */}
              <div className="rounded-xl overflow-hidden border border-border mb-5">
                <div className="px-5 py-4" style={{ backgroundColor: selectedSubjectColor + "15", borderBottom: `3px solid ${selectedSubjectColor}` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: selectedSubjectColor + "25" }}>
                        <MessageCircle className="w-5 h-5" style={{ color: selectedSubjectColor }} />
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-foreground">{selectedForumTitle}</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">{selectedSubjectName}</p>
                        {selectedForumData?.description && (
                          <p className="text-sm text-foreground/80 mt-2 max-w-2xl">{selectedForumData.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {selectedForumData?.forumType && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${forumTypeColor[selectedForumData.forumType] || ""}`}>
                              {forumTypeLabel[selectedForumData.forumType]}
                            </span>
                          )}
                          {selectedForumData?.gradeEnabled && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                              <Award className="w-3 h-3" /> Fórum avaliado — nota máx. {selectedForumData.gradeMax}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {selectedForumData?.gradeEnabled && (
                        <Button size="sm" variant="outline" className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50"
                          onClick={() => setView("grades")}>
                          <Award className="w-3.5 h-3.5" /> Notas
                        </Button>
                      )}
                      <Button size="sm" onClick={() => setShowCreateTopic(true)} className="gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Novo Tópico
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Barra de busca */}
                <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar tópicos..."
                      value={searchTopic}
                      onChange={e => setSearchTopic(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground ml-auto">{filteredTopics?.length ?? 0} tópico(s)</p>
                </div>

                {/* Tabela de tópicos estilo Moodle */}
                {filteredTopics && filteredTopics.length > 0 ? (
                  <div className="bg-card">
                    {/* Cabeçalho */}
                    <div className="grid grid-cols-[1fr_120px_120px_80px_auto] bg-muted/60 border-b border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <span>Discussão</span>
                      <span className="text-center">Iniciado por</span>
                      <span className="text-center">Última resposta</span>
                      <span className="text-center">Respostas</span>
                      <span className="text-center w-28">Ações</span>
                    </div>
                    {filteredTopics.map((topic, idx) => (
                      <div key={topic.id}
                        className={`grid grid-cols-[1fr_120px_120px_80px_auto] items-center px-4 py-3.5 ${idx < filteredTopics.length - 1 ? "border-b border-border" : ""} hover:bg-accent/20 transition-colors`}>
                        {/* Discussão */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
                            style={{ backgroundColor: topic.isClosed ? "#f3f4f6" : topic.isPinned ? "#fef3c7" : selectedSubjectColor + "15" }}>
                            {topic.isClosed
                              ? <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                              : topic.isPinned
                                ? <Pin className="w-3.5 h-3.5 text-amber-500" />
                                : <MessageSquare className="w-3.5 h-3.5" style={{ color: selectedSubjectColor }} />
                            }
                          </div>
                          <div className="min-w-0">
                            <button
                              className="font-medium text-sm text-foreground hover:text-primary transition-colors text-left truncate block max-w-full"
                              onClick={() => {
                                setSelectedTopicId(topic.id);
                                setSelectedTopicTitle(topic.title);
                                setView("topic_detail");
                              }}>
                              {topic.isPinned && <span className="text-amber-500 mr-1">[Fixado]</span>}
                              {topic.title}
                            </button>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{topic.viewCount} views</span>
                              {topic.isClosed && <Badge variant="secondary" className="text-xs py-0 h-4">Fechado</Badge>}
                            </div>
                          </div>
                        </div>
                        {/* Iniciado por */}
                        <div className="text-center px-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mx-auto mb-0.5">
                            {((topic as any).authorName || "P").charAt(0).toUpperCase()}
                          </div>
                          <p className="text-xs text-foreground truncate">{(topic as any).authorName || "Professor"}</p>
                          <p className="text-xs text-muted-foreground">{timeAgo(topic.createdAt)}</p>
                        </div>
                        {/* Última resposta */}
                        <div className="text-center px-2">
                          {(topic as any).lastReplyAt ? (
                            <>
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold mx-auto mb-0.5">
                                {((topic as any).lastReplyAuthor || "?").charAt(0).toUpperCase()}
                              </div>
                              <p className="text-xs text-foreground truncate">{(topic as any).lastReplyAuthor || "—"}</p>
                              <p className="text-xs text-muted-foreground">{timeAgo((topic as any).lastReplyAt)}</p>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">Sem respostas</p>
                          )}
                        </div>
                        {/* Respostas */}
                        <div className="text-center">
                          <span className={`text-lg font-bold ${(topic.replyCount ?? 0) > 0 ? "text-primary" : "text-muted-foreground"}`}>
                            {topic.replyCount ?? 0}
                          </span>
                        </div>
                        {/* Ações */}
                        <div className="flex items-center gap-0.5 w-28 justify-end">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                            title={topic.isPinned ? "Desafixar tópico" : "Fixar tópico"}
                            onClick={() => pinTopicMutation.mutate({ topicId: topic.id, isPinned: !topic.isPinned })}>
                            <Pin className={`w-3.5 h-3.5 ${topic.isPinned ? "text-amber-500" : "text-muted-foreground"}`} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                            title={topic.isClosed ? "Reabrir tópico" : "Fechar tópico"}
                            onClick={() => closeTopicMutation.mutate({ topicId: topic.id, isClosed: !topic.isClosed })}>
                            {topic.isClosed
                              ? <Unlock className="w-3.5 h-3.5 text-green-600" />
                              : <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                            }
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Excluir tópico"
                            onClick={() => { if (confirm("Excluir este tópico e todas as suas respostas?")) deleteTopicMutation.mutate({ topicId: topic.id }); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground bg-card">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{searchTopic ? "Nenhum tópico encontrado" : "Nenhum tópico ainda"}</p>
                    <p className="text-sm mt-1">{searchTopic ? "Tente outros termos de busca" : "Clique em \"Novo Tópico\" para iniciar uma discussão"}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ============ VIEW: DETALHE DO TÓPICO ============ */}
          {view === "topic_detail" && topicDetail && (
            <>
              <button onClick={() => setView("topics")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 mt-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar aos Tópicos
              </button>

              {/* Post principal estilo Moodle */}
              <div className="border border-border rounded-xl bg-card overflow-hidden mb-4">
                {/* Cabeçalho do tópico */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-border"
                  style={{ backgroundColor: selectedSubjectColor + "10" }}>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" style={{ color: selectedSubjectColor }} />
                    <span className="text-sm font-medium text-muted-foreground">{selectedForumTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {topicDetail.topic.isClosed && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Lock className="w-3 h-3" /> Fechado
                      </Badge>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 px-2 gap-1"
                      onClick={() => closeTopicMutation.mutate({ topicId: topicDetail.topic.id, isClosed: !topicDetail.topic.isClosed })}>
                      {topicDetail.topic.isClosed
                        ? <><Unlock className="w-3.5 h-3.5 text-green-600" /> <span className="text-xs">Reabrir</span></>
                        : <><Lock className="w-3.5 h-3.5" /> <span className="text-xs">Fechar</span></>
                      }
                    </Button>
                  </div>
                </div>
                {/* Conteúdo do post */}
                <div className="p-5">
                  <h2 className="text-xl font-bold text-foreground mb-3">{topicDetail.topic.title}</h2>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: selectedSubjectColor }}>
                      {topicDetail.topic.authorType === "teacher" ? "P" : "A"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {topicDetail.topic.authorType === "teacher" ? "Professor" : "Aluno"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(topicDetail.topic.createdAt).toLocaleString("pt-BR")} · {topicDetail.topic.viewCount} visualizações
                      </p>
                    </div>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{topicDetail.topic.content}</p>
                  </div>
                </div>
              </div>

              {/* Contador de respostas */}
              {topicDetail.replies && topicDetail.replies.length > 0 && (
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground font-medium px-2">
                    {topicDetail.replies.length} resposta(s)
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}

              {/* Respostas */}
              <div className="space-y-3 mb-6">
                {topicDetail.replies?.map((reply: any, idx: number) => (
                  <div key={reply.id}
                    className={`border rounded-xl bg-card overflow-hidden ${
                      reply.isBestAnswer
                        ? "border-green-400 dark:border-green-600"
                        : reply.authorType === "teacher"
                          ? "border-primary/40"
                          : "border-border"
                    }`}>
                    {/* Cabeçalho da resposta */}
                    <div className={`px-4 py-2.5 flex items-center gap-3 border-b ${
                      reply.isBestAnswer
                        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                        : reply.authorType === "teacher"
                          ? "border-border"
                          : "bg-muted/30 border-border"
                    }`}
                      style={reply.authorType === "teacher" ? { backgroundColor: selectedSubjectColor + "08" } : {}}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: reply.authorType === "teacher" ? selectedSubjectColor : "#94a3b8" }}>
                        {reply.authorType === "teacher" ? "P" : (reply.authorName || "A").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {reply.authorType === "teacher" ? "Professor" : (reply.authorName || "Aluno")}
                          </span>
                          {reply.authorType === "teacher" && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                              style={{ backgroundColor: selectedSubjectColor + "20", color: selectedSubjectColor }}>
                              Professor
                            </span>
                          )}
                          {reply.isBestAnswer && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-xs gap-1 py-0">
                              <CheckCircle2 className="w-3 h-3" /> Melhor Resposta
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(reply.createdAt).toLocaleString("pt-BR")}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                    </div>
                    {/* Conteúdo da resposta */}
                    <div className="p-4">
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                      {reply.attachmentUrl && (
                        <a href={reply.attachmentUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:underline bg-primary/5 px-2.5 py-1.5 rounded-md">
                          <Paperclip className="w-3 h-3" /> {reply.attachmentName || "Anexo"}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Caixa de resposta */}
              {!topicDetail.topic.isClosed ? (
                <div className="border border-border rounded-xl bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-muted/30">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Send className="w-4 h-4 text-primary" /> Responder como Professor
                    </p>
                  </div>
                  <div className="p-4">
                    <Textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Digite sua resposta para os alunos..."
                      rows={4}
                      className="mb-3 resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={() => replyMutation.mutate({ topicId: topicDetail.topic.id, content: replyText })}
                        disabled={!replyText.trim() || replyMutation.isPending}
                        className="gap-2">
                        {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Enviar Resposta
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 text-muted-foreground text-sm border border-dashed border-border rounded-xl flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Tópico fechado — novas respostas estão desabilitadas</span>
                </div>
              )}
            </>
          )}

          {/* ============ VIEW: NOTAS / AVALIAÇÃO ============ */}
          {view === "grades" && (
            <>
              <button onClick={() => setView("forums")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 mt-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar aos Fóruns
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Avaliação de Participação</h1>
                  <p className="text-sm text-muted-foreground">{selectedForumTitle}</p>
                </div>
              </div>

              {/* Cards de estatísticas */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="border border-border rounded-xl bg-card p-4 border-l-4 border-l-primary">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total de Alunos</p>
                  <p className="text-3xl font-bold mt-1 text-foreground">{enrolledStudents?.length ?? 0}</p>
                </div>
                <div className="border border-border rounded-xl bg-card p-4 border-l-4 border-l-amber-400">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Já Avaliados</p>
                  <p className="text-3xl font-bold mt-1 text-foreground">{forumGrades?.length ?? 0}</p>
                </div>
                <div className="border border-border rounded-xl bg-card p-4 border-l-4 border-l-green-500">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Média da Turma</p>
                  <p className="text-3xl font-bold mt-1 text-foreground">
                    {forumGrades && forumGrades.length > 0
                      ? (forumGrades.reduce((s, g) => s + parseFloat(String(g.grade)), 0) / forumGrades.length).toFixed(1)
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Tabela de alunos */}
              <div className="border border-border rounded-xl bg-card overflow-hidden">
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
                      <div key={student.id} className="flex items-center gap-4 p-4 hover:bg-accent/10 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
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
                              <span className="text-xl font-bold text-foreground">{grade.grade}</span>
                              <span className="text-xs text-muted-foreground">/{selectedForumData?.gradeMax || "10"}</span>
                              {grade.feedback && (
                                <p className="text-xs text-muted-foreground mt-0.5 max-w-32 truncate">{grade.feedback}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Sem nota</span>
                          )}
                          <Button size="sm" variant="outline" className="gap-1.5"
                            onClick={() => openGradeModal(student.id, student.name)}>
                            <Edit2 className="w-3 h-3" />
                            {grade ? "Editar" : "Avaliar"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {(!enrolledStudents || enrolledStudents.length === 0) && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>Nenhum aluno matriculado nesta disciplina</p>
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
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" /> Criar Novo Fórum
              </DialogTitle>
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
                    <SelectItem value="qa">Perguntas e Respostas (Q&A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Introdução ao Fórum</Label>
                <Textarea value={forumForm.description} onChange={e => setForumForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o objetivo deste fórum..." rows={3} className="mt-1" />
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <Label>Inscrição obrigatória</Label>
                  <p className="text-xs text-muted-foreground">Todos recebem notificações de novos posts</p>
                </div>
                <Switch checked={forumForm.requireSubscription} onCheckedChange={v => setForumForm(f => ({ ...f, requireSubscription: v }))} />
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <Label>Monitorar leitura</Label>
                  <p className="text-xs text-muted-foreground">Rastrear quem leu cada post</p>
                </div>
                <Switch checked={forumForm.monitorReading} onCheckedChange={v => setForumForm(f => ({ ...f, monitorReading: v }))} />
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label>Fórum Avaliado</Label>
                    <p className="text-xs text-muted-foreground">A nota de participação vai para o boletim</p>
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
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Novo Tópico de Discussão
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Título *</Label>
                <Input value={topicForm.title} onChange={e => setTopicForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Dúvidas sobre a prova final" className="mt-1" />
              </div>
              <div>
                <Label>Conteúdo *</Label>
                <Textarea value={topicForm.content} onChange={e => setTopicForm(f => ({ ...f, content: e.target.value }))} placeholder="Descreva o tópico de discussão em detalhes..." rows={6} className="mt-1 resize-none" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateTopic(false)}>Cancelar</Button>
              <Button onClick={() => createTopicMutation.mutate({ forumId: selectedForumId!, ...topicForm })}
                disabled={!topicForm.title.trim() || !topicForm.content.trim() || createTopicMutation.isPending}>
                {createTopicMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Publicar Tópico
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ============ MODAL: AVALIAR ALUNO ============ */}
        <Dialog open={showGradeModal} onOpenChange={setShowGradeModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Avaliar Participação
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-sm font-medium text-foreground">{gradeStudentName}</p>
                <p className="text-xs text-muted-foreground">Fórum: {selectedForumTitle}</p>
              </div>
              <div>
                <Label>Nota (0 a {selectedForumData?.gradeMax || "10"})</Label>
                <Input type="number" min="0" max={selectedForumData?.gradeMax || "10"} step="0.1" value={gradeValue}
                  onChange={e => setGradeValue(e.target.value)} placeholder="Ex: 8.5" className="mt-1 w-36" />
                <p className="text-xs text-muted-foreground mt-1">Esta nota será registrada no boletim como nota de participação</p>
              </div>
              <div>
                <Label>Feedback (opcional)</Label>
                <Textarea value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)}
                  placeholder="Comentário sobre a participação do aluno no fórum..." rows={3} className="mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGradeModal(false)}>Cancelar</Button>
              <Button onClick={() => setGradeMutation.mutate({ forumId: selectedForumId!, studentId: gradeStudentId!, grade: parseFloat(gradeValue), feedback: gradeFeedback })}
                disabled={!gradeValue || parseFloat(gradeValue) < 0 || parseFloat(gradeValue) > parseFloat(selectedForumData?.gradeMax || "10") || setGradeMutation.isPending}>
                {setGradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                Salvar Nota
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageWrapper>
    </>
  );
}
