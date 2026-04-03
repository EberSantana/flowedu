import { useState, useMemo } from "react";
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
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  Tag,
  Users,
  BookMarked,
  ArrowLeft,
  Filter,
  Clock,
  CheckCircle2,
  Edit,
  Settings,
} from "lucide-react";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Breadcrumb } from "@/components/Breadcrumb";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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
  const [selectedLetter, setSelectedLetter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState<string>("all");
  const [showPending, setShowPending] = useState(false);

  // Form state - Glossary
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSubjectClassKey, setNewSubjectClassKey] = useState<string>("");
  const [allowStudentContributions, setAllowStudentContributions] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);

  // Form state - Entry
  const [entryTerm, setEntryTerm] = useState("");
  const [entryDefinition, setEntryDefinition] = useState("");
  const [entryExample, setEntryExample] = useState("");
  const [entryCategory, setEntryCategory] = useState("");

  // Queries
  const { data: glossaries = [], isLoading } = trpc.glossary.list.useQuery();
  const { data: subjectsWithClass = [] } = trpc.subjects.listWithClass.useQuery();

  // Buscar entradas de TODOS os glossários filtrados
  const filteredGlossaries = useMemo(() => {
    return (glossaries as Glossary[]).filter((g) =>
      filterSubjectId === "all" ? true : String(g.subjectId) === filterSubjectId
    );
  }, [glossaries, filterSubjectId]);

  // Buscar entradas do glossário selecionado (ou do primeiro se houver apenas um)
  const activeGlossaryId = selectedGlossary?.id || (filteredGlossaries.length === 1 ? filteredGlossaries[0]?.id : null);

  const { data: entries = [] } = trpc.glossary.listEntries.useQuery(
    { glossaryId: activeGlossaryId! },
    { enabled: !!activeGlossaryId }
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
      setSelectedGlossary(null);
      toast.success("Glossário excluído");
    },
    onError: (err) => {
      toast.error(`Erro ao excluir: ${err.message}`);
    },
  });

  const addEntry = trpc.glossary.addEntry.useMutation({
    onSuccess: () => {
      if (activeGlossaryId) utils.glossary.listEntries.invalidate({ glossaryId: activeGlossaryId });
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
      if (activeGlossaryId) utils.glossary.listEntries.invalidate({ glossaryId: activeGlossaryId });
      toast.success("Termo excluído");
    },
  });

  const approveEntry = trpc.glossary.approveEntry.useMutation({
    onSuccess: () => {
      if (activeGlossaryId) utils.glossary.listEntries.invalidate({ glossaryId: activeGlossaryId });
      toast.success("Termo aprovado!");
    },
  });

  const resetCreateForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewSubjectClassKey("");
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
    if (!newTitle.trim() || !newSubjectClassKey) {
      toast.error("Preencha o título e a disciplina");
      return;
    }
    const parts = newSubjectClassKey.split(":");
    const subjectId = parseInt(parts[0]);
    const classId = parts[1] ? parseInt(parts[1]) : undefined;
    createGlossary.mutate({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      subjectId,
      classId,
      allowStudentContributions,
      requireApproval,
    });
  };

  const handleAddEntry = () => {
    if (!entryTerm.trim() || !entryDefinition.trim()) {
      toast.error("Preencha o termo e a definição");
      return;
    }
    const glossaryId = activeGlossaryId;
    if (!glossaryId) {
      toast.error("Selecione um glossário primeiro");
      return;
    }
    addEntry.mutate({
      glossaryId,
      term: entryTerm.trim(),
      definition: entryDefinition.trim(),
      example: entryExample.trim() || undefined,
      category: entryCategory.trim() || undefined,
    });
  };

  // Entries split by status
  const allEntries = entries as GlossaryEntry[];
  const approvedEntries = allEntries.filter((e) => e.isApproved);
  const pendingEntries = allEntries.filter((e) => !e.isApproved);

  // Filter entries by letter and search
  const displayEntries = useMemo(() => {
    let filtered = showPending ? pendingEntries : approvedEntries;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.term.toLowerCase().includes(lower) ||
          e.definition.toLowerCase().includes(lower)
      );
    }

    if (selectedLetter !== "all") {
      filtered = filtered.filter((e) =>
        e.term.toUpperCase().startsWith(selectedLetter)
      );
    }

    // Ordenar alfabeticamente
    return filtered.sort((a, b) => a.term.localeCompare(b.term, "pt-BR"));
  }, [approvedEntries, pendingEntries, searchTerm, selectedLetter, showPending]);

  // Agrupar por letra para exibição estilo dicionário
  const groupedByLetter = useMemo(() => {
    const groups: Record<string, GlossaryEntry[]> = {};
    displayEntries.forEach((entry) => {
      const letter = entry.term.charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(entry);
    });
    return groups;
  }, [displayEntries]);

  // Contar termos por letra (para indicar quais letras têm termos)
  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const source = showPending ? pendingEntries : approvedEntries;
    source.forEach((entry) => {
      const letter = entry.term.charAt(0).toUpperCase();
      counts[letter] = (counts[letter] || 0) + 1;
    });
    return counts;
  }, [approvedEntries, pendingEntries, showPending]);

  const activeGlossary = selectedGlossary || (filteredGlossaries.length === 1 ? filteredGlossaries[0] : null);

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
                Dicionário de termos por disciplina — estilo alfabético A-Z
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Glossário
            </Button>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-primary" />
                  Glossários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{(glossaries as Glossary[]).length}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Termos Aprovados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{approvedEntries.length}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{pendingEntries.length}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Colaborativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {(glossaries as Glossary[]).filter((g) => g.allowStudentContributions).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seletor de Glossário + Filtros */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-4 bg-card p-4 rounded-lg border">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0 hidden md:block" />
            
            {/* Filtro por disciplina */}
            <Select value={filterSubjectId} onValueChange={(val) => {
              setFilterSubjectId(val);
              setSelectedGlossary(null);
            }}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Filtrar por disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as disciplinas</SelectItem>
                {(subjectsWithClass as any[]).map((s: any) => (
                  <SelectItem key={s.filterKey} value={String(s.id)}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Seletor de glossário */}
            {filteredGlossaries.length > 1 && (
              <Select
                value={selectedGlossary?.id ? String(selectedGlossary.id) : ""}
                onValueChange={(val) => {
                  const g = filteredGlossaries.find((g) => String(g.id) === val);
                  setSelectedGlossary(g || null);
                  setSelectedLetter("all");
                  setSearchTerm("");
                }}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Selecionar glossário" />
                </SelectTrigger>
                <SelectContent>
                  {filteredGlossaries.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.title} {g.className ? `— ${g.className}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Busca */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar termos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Toggle pendentes */}
            {pendingEntries.length > 0 && (
              <Button
                variant={showPending ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPending(!showPending)}
                className="flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Pendentes
                <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-700 text-xs">
                  {pendingEntries.length}
                </Badge>
              </Button>
            )}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {/* Empty state - sem glossários */}
          {!isLoading && filteredGlossaries.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhum glossário criado ainda.
                </p>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  Crie um glossário para sua disciplina e comece a adicionar termos no formato de dicionário.
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Glossário
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Glossário ativo - info do glossário selecionado */}
          {!isLoading && activeGlossary && (
            <>
              {/* Info do glossário ativo */}
              <div className="flex items-center justify-between bg-card border rounded-lg p-3 mb-4">
                <div className="flex items-center gap-3">
                  <BookMarked className="w-5 h-5 text-primary" />
                  <div>
                    <span className="font-semibold text-foreground">{activeGlossary.title}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {activeGlossary.subjectName && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {activeGlossary.subjectName}
                        </Badge>
                      )}
                      {activeGlossary.className && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {activeGlossary.className}
                        </Badge>
                      )}
                      {activeGlossary.allowStudentContributions && (
                        <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                          Colaborativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowEntryModal(true);
                    }}
                    className="text-primary border-primary hover:bg-primary/10"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Novo Termo
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Excluir este glossário e todos os seus termos?")) {
                        deleteGlossary.mutate({ id: activeGlossary.id });
                      }
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  NAVEGAÇÃO ALFABÉTICA A-Z (estilo Moodle)
                 ═══════════════════════════════════════════════════════════════ */}
              <div className="bg-card border rounded-lg p-3 mb-6">
                <div className="flex flex-wrap gap-1 justify-center">
                  <button
                    onClick={() => setSelectedLetter("all")}
                    className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                      selectedLetter === "all"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    Todos
                  </button>
                  {ALPHABET.map((letter) => {
                    const count = letterCounts[letter] || 0;
                    const hasEntries = count > 0;
                    return (
                      <button
                        key={letter}
                        onClick={() => setSelectedLetter(letter)}
                        className={`w-9 h-9 rounded-md text-sm font-bold transition-colors relative ${
                          selectedLetter === letter
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : hasEntries
                            ? "bg-muted/50 text-foreground hover:bg-primary/20 hover:text-primary"
                            : "bg-transparent text-muted-foreground/40 cursor-default"
                        }`}
                        disabled={!hasEntries && selectedLetter !== letter}
                      >
                        {letter}
                        {hasEntries && selectedLetter !== letter && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-normal">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  TERMOS DO GLOSSÁRIO (estilo dicionário)
                 ═══════════════════════════════════════════════════════════════ */}
              {displayEntries.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {searchTerm
                        ? `Nenhum termo encontrado para "${searchTerm}"`
                        : selectedLetter !== "all"
                        ? `Nenhum termo com a letra "${selectedLetter}"`
                        : showPending
                        ? "Nenhum termo pendente de aprovação"
                        : "Nenhum termo adicionado ainda. Clique em \"Novo Termo\" para começar."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {Object.keys(groupedByLetter)
                    .sort()
                    .map((letter) => (
                      <div key={letter}>
                        {/* Letra separadora */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="text-2xl font-black text-primary">{letter}</span>
                          </div>
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-xs text-muted-foreground">
                            {groupedByLetter[letter].length} {groupedByLetter[letter].length === 1 ? "termo" : "termos"}
                          </span>
                        </div>

                        {/* Termos desta letra */}
                        <div className="space-y-3 ml-2">
                          {groupedByLetter[letter].map((entry) => (
                            <div
                              key={entry.id}
                              className={`border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow ${
                                !entry.isApproved ? "border-l-4 border-l-yellow-400" : "border-l-4 border-l-primary/30"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  {/* Termo */}
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="text-lg font-bold text-foreground">{entry.term}</h3>
                                    {entry.category && (
                                      <Badge variant="outline" className="text-xs">
                                        <Tag className="w-3 h-3 mr-1" />
                                        {entry.category}
                                      </Badge>
                                    )}
                                    <Badge
                                      className={`text-xs ${
                                        entry.authorType === "teacher"
                                          ? "bg-blue-100 text-blue-700 border-blue-200"
                                          : "bg-purple-100 text-purple-700 border-purple-200"
                                      }`}
                                    >
                                      {entry.authorType === "teacher" ? "Professor" : "Aluno"}
                                    </Badge>
                                    {!entry.isApproved && (
                                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Pendente
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Definição */}
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {entry.definition}
                                  </p>

                                  {/* Exemplo */}
                                  {entry.example && (
                                    <p className="text-xs italic text-muted-foreground/70 mt-2 pl-3 border-l-2 border-primary/20">
                                      Exemplo: {entry.example}
                                    </p>
                                  )}
                                </div>

                                {/* Ações */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {!entry.isApproved && (
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
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      if (confirm(`Excluir o termo "${entry.term}"?`)) {
                                        deleteEntry.mutate({ id: entry.id });
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}

          {/* Quando há múltiplos glossários mas nenhum selecionado */}
          {!isLoading && filteredGlossaries.length > 1 && !selectedGlossary && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookMarked className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm mb-1">
                  Selecione um glossário acima para visualizar os termos.
                </p>
                <p className="text-xs text-muted-foreground">
                  {filteredGlossaries.length} glossários disponíveis
                </p>
              </CardContent>
            </Card>
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
                    placeholder="Ex: Glossário de Informática Básica"
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
                <div>
                  <Label>Disciplina — Turma *</Label>
                  <Select value={newSubjectClassKey} onValueChange={setNewSubjectClassKey}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar disciplina e turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {(subjectsWithClass as any[]).map((s: any) => (
                        <SelectItem key={s.filterKey} value={s.filterKey}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  Adicionar Termo ao Glossário
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="term">Termo *</Label>
                  <Input
                    id="term"
                    placeholder="Ex: Memória RAM"
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
                    placeholder="Ex: A memória RAM é usada para..."
                    value={entryExample}
                    onChange={(e) => setEntryExample(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    placeholder="Ex: Hardware, Software, Redes..."
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
