import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
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
  Search,
  Tag,
  Users,
  BookMarked,
  MessageSquare,
} from "lucide-react";
import StudentLayout from "@/components/StudentLayout";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type GlossaryEntry = {
  id: number;
  glossaryId: number;
  term: string;
  definition: string;
  example?: string | null;
  category?: string | null;
  authorType: "teacher" | "student";
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

export default function StudentGlossary() {
  const utils = trpc.useUtils();

  const [selectedGlossaryId, setSelectedGlossaryId] = useState<string>("");
  const [selectedLetter, setSelectedLetter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showContributeModal, setShowContributeModal] = useState(false);

  // Form state
  const [entryTerm, setEntryTerm] = useState("");
  const [entryDefinition, setEntryDefinition] = useState("");
  const [entryExample, setEntryExample] = useState("");
  const [entryCategory, setEntryCategory] = useState("");

  // Queries
  const { data: glossaries = [], isLoading } = trpc.glossary.listForStudent.useQuery();

  const glossaryList = glossaries as Glossary[];

  // Auto-selecionar se houver apenas 1 glossário
  const activeGlossaryId = selectedGlossaryId
    ? parseInt(selectedGlossaryId)
    : glossaryList.length === 1
    ? glossaryList[0]?.id
    : null;

  const activeGlossary = glossaryList.find((g) => g.id === activeGlossaryId) || null;

  const { data: entries = [] } = trpc.glossary.listEntries.useQuery(
    { glossaryId: activeGlossaryId! },
    { enabled: !!activeGlossaryId }
  );

  // Mutations
  const addEntry = trpc.glossary.addEntryStudent.useMutation({
    onSuccess: () => {
      if (activeGlossaryId) utils.glossary.listEntries.invalidate({ glossaryId: activeGlossaryId });
      setShowContributeModal(false);
      resetForm();
      toast.success(
        activeGlossary?.requireApproval
          ? "Termo enviado! Aguardando aprovação do professor."
          : "Termo adicionado ao glossário com sucesso!"
      );
    },
    onError: (err) => {
      toast.error(`Erro ao enviar termo: ${err.message}`);
    },
  });

  const resetForm = () => {
    setEntryTerm("");
    setEntryDefinition("");
    setEntryExample("");
    setEntryCategory("");
  };

  const handleContribute = () => {
    if (!entryTerm.trim() || !entryDefinition.trim() || !activeGlossaryId) {
      toast.error("Preencha o termo e a definição");
      return;
    }
    addEntry.mutate({
      glossaryId: activeGlossaryId,
      term: entryTerm.trim(),
      definition: entryDefinition.trim(),
      example: entryExample.trim() || undefined,
      category: entryCategory.trim() || undefined,
    });
  };

  const approvedEntries = (entries as GlossaryEntry[]).filter((e) => e.isApproved);

  // Filter by letter and search
  const displayEntries = useMemo(() => {
    let filtered = approvedEntries;

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

    return filtered.sort((a, b) => a.term.localeCompare(b.term, "pt-BR"));
  }, [approvedEntries, searchTerm, selectedLetter]);

  // Group by letter
  const groupedByLetter = useMemo(() => {
    const groups: Record<string, GlossaryEntry[]> = {};
    displayEntries.forEach((entry) => {
      const letter = entry.term.charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(entry);
    });
    return groups;
  }, [displayEntries]);

  // Count per letter
  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    approvedEntries.forEach((entry) => {
      const letter = entry.term.charAt(0).toUpperCase();
      counts[letter] = (counts[letter] || 0) + 1;
    });
    return counts;
  }, [approvedEntries]);

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary to-accent text-white py-10 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Glossário</h1>
                <p className="text-primary-foreground/80 mt-1">
                  Dicionário de termos das suas disciplinas — A a Z
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto py-6 px-4">
          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && glossaryList.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhum glossário disponível ainda.
                </p>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Seu professor ainda não criou glossários para as suas disciplinas.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Glossário disponível */}
          {!isLoading && glossaryList.length > 0 && (
            <>
              {/* Seletor de glossário + busca + botão contribuir */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-4 bg-white p-4 rounded-lg border shadow-sm">
                {/* Seletor de glossário */}
                {glossaryList.length > 1 ? (
                  <Select
                    value={selectedGlossaryId}
                    onValueChange={(val) => {
                      setSelectedGlossaryId(val);
                      setSelectedLetter("all");
                      setSearchTerm("");
                    }}
                  >
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Selecionar glossário" />
                    </SelectTrigger>
                    <SelectContent>
                      {glossaryList.map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.title} {g.subjectName ? `— ${g.subjectName}` : ""} {g.className ? `(${g.className})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">{glossaryList[0]?.title}</span>
                    {glossaryList[0]?.subjectName && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {glossaryList[0].subjectName}
                      </Badge>
                    )}
                  </div>
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

                {/* Botão contribuir */}
                {activeGlossary?.allowStudentContributions && (
                  <Button
                    onClick={() => setShowContributeModal(true)}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                    Contribuir
                  </Button>
                )}
              </div>

              {/* Selecione um glossário */}
              {!activeGlossary && glossaryList.length > 1 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookMarked className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Selecione um glossário acima para visualizar os termos.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Glossário ativo */}
              {activeGlossary && (
                <>
                  {/* Info do glossário */}
                  {activeGlossary.description && (
                    <p className="text-sm text-muted-foreground mb-4 bg-white p-3 rounded-lg border">
                      {activeGlossary.description}
                    </p>
                  )}

                  {/* ═══════════════════════════════════════════════════════════
                      NAVEGAÇÃO ALFABÉTICA A-Z (estilo Moodle)
                     ═══════════════════════════════════════════════════════════ */}
                  <div className="bg-white border rounded-lg p-3 mb-6 shadow-sm">
                    <div className="flex flex-wrap gap-1 justify-center">
                      <button
                        onClick={() => setSelectedLetter("all")}
                        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                          selectedLetter === "all"
                            ? "bg-primary text-white shadow-sm"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
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
                            onClick={() => hasEntries && setSelectedLetter(letter)}
                            className={`w-9 h-9 rounded-md text-sm font-bold transition-colors relative ${
                              selectedLetter === letter
                                ? "bg-primary text-white shadow-sm"
                                : hasEntries
                                ? "bg-gray-100 text-gray-700 hover:bg-primary/20 hover:text-primary"
                                : "bg-transparent text-gray-300 cursor-default"
                            }`}
                          >
                            {letter}
                            {hasEntries && selectedLetter !== letter && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-normal">
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════════════════
                      TERMOS DO GLOSSÁRIO (estilo dicionário)
                     ═══════════════════════════════════════════════════════════ */}
                  {displayEntries.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">
                          {searchTerm
                            ? `Nenhum termo encontrado para "${searchTerm}"`
                            : selectedLetter !== "all"
                            ? `Nenhum termo com a letra "${selectedLetter}"`
                            : "Nenhum termo adicionado ainda."}
                        </p>
                        {activeGlossary.allowStudentContributions && !searchTerm && selectedLetter === "all" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => setShowContributeModal(true)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Seja o primeiro a contribuir!
                          </Button>
                        )}
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
                              <div className="flex-1 h-px bg-gray-200" />
                              <span className="text-xs text-muted-foreground">
                                {groupedByLetter[letter].length} {groupedByLetter[letter].length === 1 ? "termo" : "termos"}
                              </span>
                            </div>

                            {/* Termos desta letra */}
                            <div className="space-y-3 ml-2">
                              {groupedByLetter[letter].map((entry) => (
                                <div
                                  key={entry.id}
                                  className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow border-l-4 border-l-primary/30"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                      {/* Termo */}
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="text-lg font-bold text-gray-900">{entry.term}</h3>
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
                                      </div>

                                      {/* Definição */}
                                      <p className="text-sm text-gray-600 leading-relaxed">
                                        {entry.definition}
                                      </p>

                                      {/* Exemplo */}
                                      {entry.example && (
                                        <p className="text-xs italic text-gray-400 mt-2 pl-3 border-l-2 border-primary/20">
                                          Exemplo: {entry.example}
                                        </p>
                                      )}
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
            </>
          )}
        </div>

        {/* Contribute Modal */}
        <Dialog open={showContributeModal} onOpenChange={setShowContributeModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Contribuir com um Termo
              </DialogTitle>
            </DialogHeader>
            {activeGlossary?.requireApproval && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-700">
                Seu termo será revisado pelo professor antes de aparecer no glossário.
              </div>
            )}
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
                  placeholder="Explique o significado do termo com suas palavras..."
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
                  placeholder="Como este termo é usado na prática?"
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
              <Button
                variant="outline"
                onClick={() => {
                  setShowContributeModal(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleContribute} disabled={addEntry.isPending}>
                {addEntry.isPending ? "Enviando..." : "Enviar Termo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StudentLayout>
  );
}
