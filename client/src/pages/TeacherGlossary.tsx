import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  ChevronDown,
  ChevronUp,
  MessageSquare,
  CheckCircle,
  XCircle,
  Tag,
  Users,
  BookMarked,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

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
  const utils = trpc.useUtils();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedGlossary, setSelectedGlossary] = useState<Glossary | null>(null);
  const [expandedGlossary, setExpandedGlossary] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredEntries = entries.filter((e: GlossaryEntry) =>
    e.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingEntries = entries.filter((e: GlossaryEntry) => !e.isApproved);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span>Início</span>
              <span>›</span>
              <span>Comunicação</span>
              <span>›</span>
              <span className="text-foreground">Glossário</span>
            </div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Glossário Colaborativo
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Crie e gerencie glossários por disciplina. Alunos podem contribuir com termos.
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Glossário
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && glossaries.length === 0 && (
          <div className="border rounded-lg p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">Nenhum glossário criado ainda.</p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie um glossário para sua disciplina e comece a adicionar termos.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Glossário
            </Button>
          </div>
        )}

        {/* Glossaries list */}
        {!isLoading && glossaries.length > 0 && (
          <div className="space-y-4">
            {glossaries.map((glossary: Glossary) => (
              <div key={glossary.id} className="border rounded-lg overflow-hidden">
                {/* Glossary header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => {
                    if (expandedGlossary === glossary.id) {
                      setExpandedGlossary(null);
                    } else {
                      setExpandedGlossary(glossary.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <BookMarked className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground">{glossary.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {glossary.subjectName && (
                          <Badge variant="outline" className="text-xs">
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
                          <Badge variant="secondary" className="text-xs">
                            Colaborativo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGlossary(glossary);
                        setExpandedGlossary(glossary.id);
                        setShowEntryModal(true);
                      }}
                      className="text-primary hover:text-primary"
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
                      className="text-destructive hover:text-destructive"
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
                  <div className="border-t bg-background">
                    {/* Pending approvals */}
                    {pendingEntries.length > 0 && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border-b">
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2">
                          {pendingEntries.length} termo(s) aguardando aprovação
                        </p>
                        {pendingEntries.map((entry: GlossaryEntry) => (
                          <div key={entry.id} className="flex items-center justify-between py-1">
                            <span className="text-sm font-medium">{entry.term}</span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-green-600 border-green-600"
                                onClick={() => approveEntry.mutate({ id: entry.id, approved: true })}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-red-600 border-red-600"
                                onClick={() => deleteEntry.mutate({ id: entry.id })}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Rejeitar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Search */}
                    <div className="p-3 border-b">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar termos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Entries table */}
                    {filteredEntries.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        {entries.length === 0
                          ? "Nenhum termo adicionado ainda. Clique em \"+ Termo\" para começar."
                          : "Nenhum termo encontrado para esta busca."}
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Termo</th>
                            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Definição</th>
                            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Categoria</th>
                            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Autor</th>
                            <th className="px-4 py-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEntries.map((entry: GlossaryEntry) => (
                            <tr key={entry.id} className="border-b hover:bg-accent/30 transition-colors">
                              <td className="px-4 py-3 font-medium text-foreground">{entry.term}</td>
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
                                  variant={entry.authorType === "teacher" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {entry.authorType === "teacher" ? "Professor" : "Aluno"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => deleteEntry.mutate({ id: entry.id })}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Glossary Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Glossário</DialogTitle>
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
                  rows={3}
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
                  <Label>Turma *</Label>
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
              <div className="flex items-center justify-between">
                <div>
                  <Label>Alunos podem adicionar termos</Label>
                  <p className="text-xs text-muted-foreground">
                    Termos de alunos precisam de aprovação
                  </p>
                </div>
                <Switch
                  checked={allowStudentContributions}
                  onCheckedChange={setAllowStudentContributions}
                />
              </div>
              {allowStudentContributions && (
                <div className="flex items-center justify-between">
                  <Label>Exigir aprovação do professor</Label>
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
              <DialogTitle>Adicionar Termo</DialogTitle>
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
    </DashboardLayout>
  );
}
