import { useState, useMemo } from "react";
import { useStudentAuth } from "@/hooks/useStudentAuth";
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
  BookMarked,
  MessageSquare,
  User,
  GraduationCap,
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

export default function StudentGlossary() {
  const utils = trpc.useUtils();
  const { student } = useStudentAuth();
  const currentStudentId = student?.id;

  const [selectedGlossaryId, setSelectedGlossaryId] = useState<string>("");
  const [selectedLetter, setSelectedLetter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributeLetter, setContributeLetter] = useState<string>("");

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
    setContributeLetter("");
  };

  const openContributeForLetter = (letter: string) => {
    setContributeLetter(letter);
    setEntryTerm(letter); // Pré-preenche com a letra para o aluno continuar digitando
    setShowContributeModal(true);
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

  // Mostrar: termos aprovados + termos pendentes do próprio aluno
  const visibleEntries = (entries as GlossaryEntry[]).filter(
    (e) => e.isApproved || (e.authorType === 'student' && e.authorStudentId === currentStudentId)
  );

  // Filter by letter and search
  const displayEntries = useMemo(() => {
    let filtered = visibleEntries;

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
  }, [visibleEntries, searchTerm, selectedLetter]);

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
    visibleEntries.forEach((entry) => {
      const letter = entry.term.charAt(0).toUpperCase();
      counts[letter] = (counts[letter] || 0) + 1;
    });
    return counts;
  }, [visibleEntries]);

  const totalTerms = visibleEntries.length;

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-8 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Glossário Colaborativo</h1>
                <p className="text-white/80 mt-1">
                  Dicionário de termos construído por todos — clique em uma letra e contribua!
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
            </div>
          )}

          {/* Empty state - sem glossários */}
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
              {/* Seletor de glossário + busca */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-4 bg-white p-4 rounded-lg border shadow-sm">
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
                    <BookMarked className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-foreground">{glossaryList[0]?.title}</span>
                    {glossaryList[0]?.subjectName && (
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
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

                {/* Total de termos */}
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                  {totalTerms} {totalTerms === 1 ? "termo" : "termos"}
                </Badge>
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

              {activeGlossary && (
                <>
                  {/* Info do glossário */}
                  {activeGlossary.description && (
                    <p className="text-sm text-muted-foreground mb-4 bg-white p-3 rounded-lg border">
                      {activeGlossary.description}
                    </p>
                  )}

                  {/* ═══════════════════════════════════════════════════════════
                      NAVEGAÇÃO ALFABÉTICA A-Z — TODAS AS LETRAS CLICÁVEIS
                     ═══════════════════════════════════════════════════════════ */}
                  <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium text-gray-600">Navegar por letra:</span>
                      <span className="text-xs text-gray-400">Clique em uma letra para ver ou adicionar termos</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      <button
                        onClick={() => setSelectedLetter("all")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                          selectedLetter === "all"
                            ? "bg-emerald-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700"
                        }`}
                      >
                        Todos
                      </button>
                      {ALPHABET.map((letter) => {
                        const count = letterCounts[letter] || 0;
                        const isSelected = selectedLetter === letter;
                        return (
                          <button
                            key={letter}
                            onClick={() => setSelectedLetter(letter)}
                            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all relative ${
                              isSelected
                                ? "bg-emerald-600 text-white shadow-md scale-110"
                                : count > 0
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                : "bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-200 hover:border-emerald-200"
                            }`}
                          >
                            {letter}
                            {count > 0 && !isSelected && (
                              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-600 text-white text-[10px] rounded-full flex items-center justify-center font-semibold shadow-sm">
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════════════════
                      CONTEÚDO DA LETRA SELECIONADA
                     ═══════════════════════════════════════════════════════════ */}
                  
                  {/* Quando uma letra específica está selecionada */}
                  {selectedLetter !== "all" && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <span className="text-3xl font-black text-emerald-700">{selectedLetter}</span>
                          </div>
                          <div>
                            <h2 className="text-lg font-bold text-gray-900">
                              Letra {selectedLetter}
                            </h2>
                            <p className="text-sm text-gray-500">
                              {displayEntries.length === 0
                                ? "Nenhum termo ainda — seja o primeiro a contribuir!"
                                : `${displayEntries.length} ${displayEntries.length === 1 ? "termo" : "termos"} encontrado${displayEntries.length === 1 ? "" : "s"}`}
                            </p>
                          </div>
                        </div>
                        {activeGlossary.allowStudentContributions && (
                          <Button
                            onClick={() => openContributeForLetter(selectedLetter)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar termo com "{selectedLetter}"
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botão contribuir geral (quando "Todos" está selecionado) */}
                  {selectedLetter === "all" && activeGlossary.allowStudentContributions && (
                    <div className="flex justify-end mb-4">
                      <Button
                        onClick={() => {
                          setContributeLetter("");
                          setEntryTerm("");
                          setShowContributeModal(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Contribuir com um Termo
                      </Button>
                    </div>
                  )}

                  {/* Lista de termos */}
                  {displayEntries.length === 0 ? (
                    <Card className="border-dashed border-2 border-emerald-200 bg-emerald-50/30">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                          {selectedLetter !== "all" ? (
                            <span className="text-4xl font-black text-emerald-400">{selectedLetter}</span>
                          ) : (
                            <BookOpen className="w-10 h-10 text-emerald-400" />
                          )}
                        </div>
                        <p className="text-lg font-medium text-gray-600 mb-1">
                          {searchTerm
                            ? `Nenhum termo encontrado para "${searchTerm}"`
                            : selectedLetter !== "all"
                            ? `Nenhum termo com a letra "${selectedLetter}" ainda`
                            : "Nenhum termo adicionado ainda"}
                        </p>
                        <p className="text-sm text-gray-400 mb-4 text-center max-w-md">
                          {selectedLetter !== "all"
                            ? `Clique no botão acima para ser o primeiro a adicionar um termo com a letra "${selectedLetter}". Seus colegas também poderão ver!`
                            : "Clique em uma letra do alfabeto e adicione termos para construir o dicionário colaborativo da turma!"}
                        </p>
                        {activeGlossary.allowStudentContributions && !searchTerm && (
                          <Button
                            onClick={() => {
                              if (selectedLetter !== "all") {
                                openContributeForLetter(selectedLetter);
                              } else {
                                setContributeLetter("");
                                setEntryTerm("");
                                setShowContributeModal(true);
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            {selectedLetter !== "all"
                              ? `Adicionar termo com "${selectedLetter}"`
                              : "Seja o primeiro a contribuir!"}
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
                            {/* Letra separadora (só mostra quando "Todos" está selecionado) */}
                            {selectedLetter === "all" && (
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                  <span className="text-2xl font-black text-emerald-700">{letter}</span>
                                </div>
                                <div className="flex-1 h-px bg-emerald-200" />
                                <span className="text-xs text-gray-400">
                                  {groupedByLetter[letter].length} {groupedByLetter[letter].length === 1 ? "termo" : "termos"}
                                </span>
                                {activeGlossary.allowStudentContributions && (
                                  <button
                                    onClick={() => openContributeForLetter(letter)}
                                    className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Adicionar
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Termos desta letra */}
                            <div className="space-y-3 ml-2">
                              {groupedByLetter[letter].map((entry) => (
                                <div
                                  key={entry.id}
                                  className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow border-l-4 border-l-emerald-400"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                      {/* Termo */}
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                                          {entry.authorType === "teacher" ? (
                                            <><GraduationCap className="w-3 h-3 mr-1" /> Professor</>
                                          ) : (
                                            <><User className="w-3 h-3 mr-1" /> Aluno</>
                                          )}
                                        </Badge>
                                        {!entry.isApproved && (
                                          <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 animate-pulse">
                                            ⏳ Aguardando aprovação
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Definição */}
                                      <p className="text-sm text-gray-600 leading-relaxed">
                                        {entry.definition}
                                      </p>

                                      {/* Exemplo */}
                                      {entry.example && (
                                        <div className="mt-3 pl-3 border-l-2 border-emerald-200 bg-emerald-50/50 rounded-r-md py-2 pr-3">
                                          <p className="text-xs text-emerald-700">
                                            <span className="font-semibold">Exemplo:</span> {entry.example}
                                          </p>
                                        </div>
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

        {/* ═══════════════════════════════════════════════════════════
            MODAL DE CONTRIBUIÇÃO
           ═══════════════════════════════════════════════════════════ */}
        <Dialog open={showContributeModal} onOpenChange={(open) => {
          if (!open) resetForm();
          setShowContributeModal(open);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                {contributeLetter
                  ? `Adicionar Termo — Letra ${contributeLetter}`
                  : "Contribuir com um Termo"}
              </DialogTitle>
            </DialogHeader>

            {activeGlossary?.requireApproval && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-700 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">⚠</span>
                Seu termo será revisado pelo professor antes de aparecer no glossário.
              </div>
            )}

            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-sm text-emerald-700 flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">💡</span>
              Seu termo ficará visível para todos os colegas da disciplina. Contribua com definições claras e exemplos práticos!
            </div>

            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="term" className="font-semibold">Termo *</Label>
                <Input
                  id="term"
                  placeholder={contributeLetter ? `Ex: ${contributeLetter === "M" ? "Memória RAM" : contributeLetter === "S" ? "Software" : contributeLetter + "..."}` : "Ex: Memória RAM"}
                  value={entryTerm}
                  onChange={(e) => setEntryTerm(e.target.value)}
                  className="mt-1"
                  autoFocus
                />
                {contributeLetter && entryTerm && !entryTerm.toUpperCase().startsWith(contributeLetter) && (
                  <p className="text-xs text-red-500 mt-1">
                    O termo deve começar com a letra "{contributeLetter}"
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="definition" className="font-semibold">Definição *</Label>
                <Textarea
                  id="definition"
                  placeholder="Explique o significado do termo com suas palavras..."
                  value={entryDefinition}
                  onChange={(e) => setEntryDefinition(e.target.value)}
                  className="mt-1 resize-none"
                  rows={4}
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
              <Button
                onClick={handleContribute}
                disabled={addEntry.isPending || (!!contributeLetter && !!entryTerm && !entryTerm.toUpperCase().startsWith(contributeLetter))}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {addEntry.isPending ? "Enviando..." : "Enviar Termo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StudentLayout>
  );
}
