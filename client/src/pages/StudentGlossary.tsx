import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Tag,
  Users,
  BookMarked,
  MessageSquare,
} from "lucide-react";
import StudentLayout from "@/components/StudentLayout";

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

  const [expandedGlossary, setExpandedGlossary] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGlossary, setSelectedGlossary] = useState<Glossary | null>(null);

  // Form state
  const [entryTerm, setEntryTerm] = useState("");
  const [entryDefinition, setEntryDefinition] = useState("");
  const [entryExample, setEntryExample] = useState("");
  const [entryCategory, setEntryCategory] = useState("");

  // Queries
  const { data: glossaries = [], isLoading } = trpc.glossary.listForStudent.useQuery();
  const { data: entries = [] } = trpc.glossary.listEntries.useQuery(
    { glossaryId: expandedGlossary! },
    { enabled: !!expandedGlossary }
  );

  // Mutations
  const addEntry = trpc.glossary.addEntryStudent.useMutation({
    onSuccess: () => {
      if (expandedGlossary) utils.glossary.listEntries.invalidate({ glossaryId: expandedGlossary });
      setShowContributeModal(false);
      resetForm();
      toast.success(
        selectedGlossary?.requireApproval
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

  const approvedEntries = (entries as GlossaryEntry[]).filter((e) => e.isApproved);

  const filteredEntries = approvedEntries.filter(
    (e) =>
      e.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group entries alphabetically
  const groupedEntries = filteredEntries.reduce((acc: Record<string, GlossaryEntry[]>, entry) => {
    const letter = entry.term[0]?.toUpperCase() || "#";
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(entry);
    return acc;
  }, {});

  const sortedLetters = Object.keys(groupedEntries).sort();

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary to-accent text-white py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Glossário</h1>
                <p className="text-primary-foreground/80 mt-1">
                  Consulte os termos e definições das suas disciplinas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto py-8 px-4">
          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && (glossaries as Glossary[]).length === 0 && (
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

          {/* Glossaries list */}
          {!isLoading && (glossaries as Glossary[]).length > 0 && (
            <div className="space-y-4">
              {(glossaries as Glossary[]).map((glossary) => (
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
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/20 transition-colors"
                    onClick={() => {
                      if (expandedGlossary === glossary.id) {
                        setExpandedGlossary(null);
                      } else {
                        setExpandedGlossary(glossary.id);
                        setSearchTerm("");
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
                      {glossary.allowStudentContributions && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGlossary(glossary);
                            setExpandedGlossary(glossary.id);
                            setShowContributeModal(true);
                          }}
                          className="text-primary border-primary hover:bg-primary/10"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Contribuir
                        </Button>
                      )}
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
                      {/* Search */}
                      <div className="p-4 border-b">
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

                      {/* Alphabet navigation */}
                      {sortedLetters.length > 0 && (
                        <div className="flex flex-wrap gap-1 p-3 border-b bg-muted/20">
                          {sortedLetters.map((letter) => (
                            <button
                              key={letter}
                              className="w-7 h-7 text-xs font-medium rounded border bg-background hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => {
                                const el = document.getElementById(`letter-${letter}`);
                                el?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }}
                            >
                              {letter}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Entries */}
                      {filteredEntries.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                          {approvedEntries.length === 0
                            ? "Nenhum termo adicionado ainda."
                            : "Nenhum termo encontrado para esta busca."}
                        </div>
                      ) : (
                        <div className="divide-y">
                          {sortedLetters.map((letter) => (
                            <div key={letter} id={`letter-${letter}`}>
                              {/* Letter header */}
                              <div className="px-4 py-2 bg-muted/20 sticky top-0 z-10">
                                <span className="text-lg font-bold text-primary">{letter}</span>
                              </div>
                              {/* Entries for this letter */}
                              {groupedEntries[letter].map((entry) => (
                                <div
                                  key={entry.id}
                                  className="px-4 py-4 hover:bg-accent/20 transition-colors"
                                >
                                  <div className="flex items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h4 className="font-semibold text-foreground">{entry.term}</h4>
                                        {entry.category && (
                                          <Badge variant="outline" className="text-xs">
                                            <Tag className="w-3 h-3 mr-1" />
                                            {entry.category}
                                          </Badge>
                                        )}
                                        <Badge
                                          className={
                                            entry.authorType === "teacher"
                                              ? "bg-blue-100 text-blue-700 border-blue-200 text-xs"
                                              : "bg-purple-100 text-purple-700 border-purple-200 text-xs"
                                          }
                                        >
                                          {entry.authorType === "teacher" ? "Professor" : "Aluno"}
                                        </Badge>
                                      </div>
                                      <p className="text-muted-foreground text-sm">{entry.definition}</p>
                                      {entry.example && (
                                        <p className="text-xs italic text-muted-foreground/70 mt-1">
                                          <span className="font-medium not-italic">Exemplo:</span>{" "}
                                          {entry.example}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
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
            {selectedGlossary?.requireApproval && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm text-yellow-700 dark:text-yellow-400">
                Seu termo será revisado pelo professor antes de aparecer no glossário.
              </div>
            )}
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="term">Termo *</Label>
                <Input
                  id="term"
                  placeholder="Digite o termo..."
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
                  placeholder="Ex: Metodologia, Tecnologia..."
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
