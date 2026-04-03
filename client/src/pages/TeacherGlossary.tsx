import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Tag,
  Users,
  BookMarked,
  ArrowLeft,
  Filter,
  Clock,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Breadcrumb } from "@/components/Breadcrumb";

type GlossaryEntry = {
  id: number;
  glossaryId: number;
  term: string;
  definition: string;
  example?: string | null;
  category?: string | null;
  authorType: "teacher" | "student";
  authorUserId?: number | null;
  authorStudentId?: number | null;
  isApproved: boolean;
  createdAt: Date;
};

type Glossary = {
  id: number;
  title: string;
  description?: string | null;
  subjectId: number;
  classId?: number | null;
  allowStudentContributions: boolean;
  requireApproval: boolean;
  isActive: boolean;
  createdAt: Date;
  subjectName?: string | null;
  className?: string | null;
};

export default function TeacherGlossary() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedGlossary, setSelectedGlossary] = useState<Glossary | null>(null);
  const [expandedGlossary, setExpandedGlossary] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("approved");
  const [filterSubjectId, setFilterSubjectId] = useState<string>("all");

  // Form state - Glossary
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSubjectId, setNewSubjectId] = useState<string>("");
  const [newClassId, setNewClassId] = useState<string>("");
  const [allowStudentContributions, setAllowStudentContributions] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);

  // Form state - Entry
  const [entryTerm, setEntryTerm] = useState("");
  const [entryDefinition, setEntryDefinition] = useState("");
  const [entryExample, setEntryExample] = useState("");
  const [entryCategory, setEntryCategory] = useState("");

  // Queries
  const { data: glossaries = [], isLoading } = trpc.glossary.list.useQuery();
  const { data: subjects = [] } = trpc.subjects.list.useQuery();
  const { data: classes = [] } = trpc.classes.list.useQuery();
  const { data: entries = [] } = trpc.glossary.listEntries.useQuery(
    { glossaryId: expandedGlossary! },
    { enabled: !!expandedGlossary }
  );

  // Mutations
  const createGlossary = trpc.glossary.create.useMutation({
    onSuccess: () => {
      utils.glossary.list.invalidate();
      setShowCreateModal(false);
      resetCreateForm();
      toast.success("Glossário criado com sucesso!");
    },
    onError: (err) => {
      toast.error(`Erro ao criar glossário: ${err.message}`);
    },
  });

  const deleteGlossary = trpc.glossary.delete.useMutation({
    onSuccess: () => {
      utils.glossary.list.invalidate();
      toast.success("Glossário excluído");
    },
    onError: (err) => {
      toast.error(`Erro ao excluir: ${err.message}`);
    },
  });

  const addEntry = trpc.glossary.addEntry.useMutation({
    onSuccess: () => {
      if (expandedGlossary) utils.glossary.listEntries.invalidate({ glossaryId: expandedGlossary });
      setShowEntryModal(false);
      resetEntryForm();
      toast.success("Termo adicionado com sucesso!");
    },
    onError: (err) => {
      toast.error(`Erro ao adicionar termo: ${err.message}`);
    },
  });

  const deleteEntry = trpc.glossary.deleteEntry.useMutation({
    onSuccess: () => {
      if (expandedGlossary) utils.glossary.listEntries.invalidate({ glossaryId: expandedGlossary });
      toast.success("Termo excluído");
    },
  });

  const approveEntry = trpc.glossary.approveEntry.useMutation({
    onSuccess: () => {
      if (expandedGlossary) utils.glossary.listEntries.invalidate({ glossaryId: expandedGlossary });
      toast.success("Termo aprovado!");
    },
  });

  const resetCreateForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewSubjectId("");
    setNewClassId("");
    setAllowStudentContributions(true);
    setRequireApproval(false);
  };

  const resetEntryForm = () => {
    setEntryTerm("");
    setEntryDefinition("");
    setEntryExample("");
    setEntryCategory("");
  };

  const handleCreateGlossary = () => {
    if (!newTitle.trim() || !newSubjectId) {
      toast.error("Preencha o título e a disciplina");
      return;
    }
    createGlossary.mutate({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      subjectId: parseInt(newSubjectId),
      classId: newClassId ? parseInt(newClassId) : undefined,
      allowStudentContributions,
      requireApproval,
    });
  };

  const handleAddEntry = () => {
    if (!entryTerm.trim() || !entryDefinition.trim() || !selectedGlossary) {
      toast.error("Preencha o termo e a definição");
      return;
    }
    addEntry.mutate({
      glossaryId: selectedGlossary.id,
      term: entryTerm.trim(),
      definition: entryDefinition.trim(),
      example: entryExample.trim() || undefined,
      category: entryCategory.trim() || undefined,
    });
  };

  // Filtered glossaries by subject
  const filteredGlossaries = (glossaries as Glossary[]).filter((g) =>
    filterSubjectId === "all" ? true : String(g.subjectId) === filterSubjectId
  );

  // Entries split by status
  const approvedEntries = (entries as GlossaryEntry[]).filter((e) => e.isApproved);
  const pendingEntries = (entries as GlossaryEntry[]).filter((e) => !e.isApproved);

  const filteredApproved = approvedEntries.filter(
    (e) =>
      e.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const totalGlossaries = (glossaries as Glossary[]).length;
  const totalTerms = 0; // Would need a separate query for total terms
  const pendingTotal = pendingEntries.length;

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
              { label: "Glossário Colaborativo" },
            ]}
          />

          {/* Header */}
          <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />
                Glossário Colaborativo
              </h1>
              <p className="text-muted-foreground mt-1">
                Crie e gerencie glossários por disciplina. Alunos podem contribuir com termos.
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Glossário
            </Button>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-primary" />
                  Total de Glossários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalGlossaries}</div>
                <p className="text-xs text-muted-foreground mt-1">Glossários criados</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  Aguardando Aprovação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {expandedGlossary ? pendingTotal : "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {expandedGlossary ? "Termos pendentes" : "Abra um glossário para ver"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Colaborativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {(glossaries as Glossary[]).filter((g) => g.allowStudentContributions).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Com contribuição de alunos</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtro por disciplina */}
          <div className="flex items-center gap-3 mb-6 bg-card p-4 rounded-lg border">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium text-muted-foreground">Filtrar:</span>
            <Select value={filterSubjectId} onValueChange={setFilterSubjectId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Filtrar por disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as disciplinas</SelectItem>
                {(subjects as any[]).map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} {s.code ? `(${s.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filteredGlossaries.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhum glossário criado ainda.
                </p>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  Crie um glossário para sua disciplina e comece a adicionar termos.
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Glossário
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Glossaries list */}
          {!isLoading && filteredGlossaries.length > 0 && (
            <div className="space-y-4">
              {filteredGlossaries.map((glossary: Glossary) => (
                <Card
                  key={glossary.id}
                  className={`overflow-hidden transition-all duration-200 hover:shadow-md ${
                    expandedGlossary === glossary.id
                      ? "border-l-4 border-l-primary"
                      : "border-l-4 border-l-muted"
                  }`}
                >
                  {/* Glossary header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                    onClick={() => {
                      if (expandedGlossary === glossary.id) {
                        setExpandedGlossary(null);
                      } else {
                        setExpandedGlossary(glossary.id);
                        setSearchTerm("");
                        setActiveTab("approved");
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <BookMarked className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-foreground text-base">{glossary.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {glossary.subjectName && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {glossary.subjectName}
                            </Badge>
                          )}
                          {glossary.className && (
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {glossary.className}
                            </Badge>
                          )}
                          {glossary.allowStudentContributions && (
                            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Colaborativo
                            </Badge>
                          )}
                        </div>
                        {glossary.description && (
                          <p className="text-xs text-muted-foreground mt-1">{glossary.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGlossary(glossary);
                          setExpandedGlossary(glossary.id);
                          setShowEntryModal(true);
                        }}
                        className="text-primary border-primary hover:bg-primary/10"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Termo
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Excluir este glossário e todos os seus termos?")) {
                            deleteGlossary.mutate({ id: glossary.id });
                          }
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {expandedGlossary === glossary.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded entries */}
                  {expandedGlossary === glossary.id && (
                    <div className="border-t bg-muted/10">
                      {/* Search bar */}
                      <div className="p-4 border-b bg-background">
                        <div className="relative max-w-sm">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar termos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9"
                          />
                        </div>
                      </div>

                      {/* Tabs */}
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="px-4 pt-4">
                          <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="approved" className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              Aprovados
                              {approvedEntries.length > 0 && (
                                <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 text-xs">
                                  {approvedEntries.length}
                                </Badge>
                              )}
                            </TabsTrigger>
                            <TabsTrigger value="pending" className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Aguardando Aprovação
                              {pendingEntries.length > 0 && (
                                <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-700 text-xs">
                                  {pendingEntries.length}
                                </Badge>
                              )}
                            </TabsTrigger>
                          </TabsList>
                        </div>

                        {/* Approved entries */}
                        <TabsContent value="approved" className="mt-0 px-4 pb-4">
                          {filteredApproved.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground text-sm">
                              {approvedEntries.length === 0
                                ? "Nenhum termo adicionado ainda. Clique em \"+ Termo\" para começar."
                                : "Nenhum termo encontrado para esta busca."}
                            </div>
                          ) : (
                            <div className="rounded-lg border overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b bg-muted/30">
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Termo</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Definição</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoria</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Autor</th>
                                    <th className="px-4 py-3"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredApproved.map((entry: GlossaryEntry) => (
                                    <tr key={entry.id} className="border-b last:border-0 hover:bg-accent/20 transition-colors">
                                      <td className="px-4 py-3 font-semibold text-foreground">{entry.term}</td>
                                      <td className="px-4 py-3 text-muted-foreground max-w-xs">
                                        <p className="line-clamp-2">{entry.definition}</p>
                                        {entry.example && (
                                          <p className="text-xs italic mt-1 text-muted-foreground/70">
                                            Ex: {entry.example}
                                          </p>
                                        )}
                                      </td>
                                      <td className="px-4 py-3">
                                        {entry.category ? (
                                          <Badge variant="outline" className="text-xs">
                                            <Tag className="w-3 h-3 mr-1" />
                                            {entry.category}
                                          </Badge>
                                        ) : (
                                          <span className="text-muted-foreground/50">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge
                                          className={
                                            entry.authorType === "teacher"
                                              ? "bg-blue-100 text-blue-700 border-blue-200 text-xs"
                                              : "bg-purple-100 text-purple-700 border-purple-200 text-xs"
                                          }
                                        >
                                          {entry.authorType === "teacher" ? "Professor" : "Aluno"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={() => deleteEntry.mutate({ id: entry.id })}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </TabsContent>

                        {/* Pending entries */}
                        <TabsContent value="pending" className="mt-0 px-4 pb-4">
                          {pendingEntries.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground text-sm">
                              Nenhum termo aguardando aprovação.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {pendingEntries.map((entry: GlossaryEntry) => (
                                <Card key={entry.id} className="border-l-4 border-l-yellow-400">
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-semibold text-foreground">{entry.term}</span>
                                          {entry.category && (
                                            <Badge variant="outline" className="text-xs">
                                              <Tag className="w-3 h-3 mr-1" />
                                              {entry.category}
                                            </Badge>
                                          )}
                                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Pendente
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{entry.definition}</p>
                                        {entry.example && (
                                          <p className="text-xs italic text-muted-foreground/70 mt-1">
                                            Ex: {entry.example}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex gap-2 flex-shrink-0">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 text-green-600 border-green-500 hover:bg-green-50"
                                          onClick={() => approveEntry.mutate({ id: entry.id, approved: true })}
                                          disabled={approveEntry.isPending}
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Aprovar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 text-destructive border-destructive hover:bg-destructive/10"
                                          onClick={() => deleteEntry.mutate({ id: entry.id })}
                                        >
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Rejeitar
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Create Glossary Modal */}
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Novo Glossário
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Glossário de Tecnologia Educacional"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição opcional do glossário..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="mt-1 resize-none"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Disciplina *</Label>
                    <Select value={newSubjectId} onValueChange={setNewSubjectId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {(subjects as any[]).map((s: any) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Turma</Label>
                    <Select value={newClassId} onValueChange={setNewClassId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {(classes as any[]).map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <Label>Alunos podem adicionar termos</Label>
                    <p className="text-xs text-muted-foreground">Contribuições colaborativas</p>
                  </div>
                  <Switch
                    checked={allowStudentContributions}
                    onCheckedChange={setAllowStudentContributions}
                  />
                </div>
                {allowStudentContributions && (
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <Label>Exigir aprovação do professor</Label>
                      <p className="text-xs text-muted-foreground">Revisar antes de publicar</p>
                    </div>
                    <Switch
                      checked={requireApproval}
                      onCheckedChange={setRequireApproval}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowCreateModal(false); resetCreateForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateGlossary} disabled={createGlossary.isPending}>
                  {createGlossary.isPending ? "Criando..." : "Criar Glossário"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Entry Modal */}
          <Dialog open={showEntryModal} onOpenChange={setShowEntryModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Adicionar Termo
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="term">Termo *</Label>
                  <Input
                    id="term"
                    placeholder="Ex: Aprendizagem Ativa"
                    value={entryTerm}
                    onChange={(e) => setEntryTerm(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="definition">Definição *</Label>
                  <Textarea
                    id="definition"
                    placeholder="Definição clara e objetiva do termo..."
                    value={entryDefinition}
                    onChange={(e) => setEntryDefinition(e.target.value)}
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="example">Exemplo de uso</Label>
                  <Input
                    id="example"
                    placeholder="Ex: A aprendizagem ativa é usada em..."
                    value={entryExample}
                    onChange={(e) => setEntryExample(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    placeholder="Ex: Metodologia, Tecnologia, Avaliação..."
                    value={entryCategory}
                    onChange={(e) => setEntryCategory(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowEntryModal(false); resetEntryForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleAddEntry} disabled={addEntry.isPending}>
                  {addEntry.isPending ? "Adicionando..." : "Adicionar Termo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageWrapper>
    </>
  );
}
