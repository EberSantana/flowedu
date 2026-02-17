import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { UserPlus, Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface QuickEnrollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultSubjectId?: number | null;
}

interface ParsedStudent {
  registrationNumber: string;
  fullName: string;
}

export default function QuickEnrollModal({ open, onOpenChange, onSuccess, defaultSubjectId }: QuickEnrollModalProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("manual");
  
  // Manual form state
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [fullName, setFullName] = useState("");
  
  // Import state
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pré-selecionar disciplina quando defaultSubjectId mudar
  useEffect(() => {
    if (defaultSubjectId) {
      setSelectedSubjectId(defaultSubjectId);
    }
  }, [defaultSubjectId]);

  const { data: subjects = [] } = trpc.subjects.list.useQuery();

  const importAndEnrollMutation = trpc.students.importAndEnrollInSubject.useMutation({
    onSuccess: (result) => {
      const totalSuccess = result.created.length + result.enrolled.length;
      
      if (totalSuccess > 0) {
        const messages = [];
        if (result.created.length > 0) {
          messages.push(`${result.created.length} aluno(s) criado(s)`);
        }
        if (result.enrolled.length > 0) {
          messages.push(`${result.enrolled.length} matriculado(s)`);
        }
        toast.success(messages.join(', '));
        
        // Limpar formulário
        resetForm();
        onSuccess();
        onOpenChange(false);
      }

      if (result.errors.length > 0) {
        result.errors.forEach(error => toast.error(error));
      }
    },
    onError: (error) => {
      toast.error(`Erro ao matricular: ${error.message}`);
    },
  });

  const resetForm = () => {
    setRegistrationNumber("");
    setFullName("");
    setParsedStudents([]);
    setFileName("");
    setParseError("");
  };

  const handleManualEnroll = async () => {
    if (!selectedSubjectId) {
      toast.error("Selecione uma disciplina");
      return;
    }

    if (!registrationNumber.trim()) {
      toast.error("Preencha a matrícula do aluno");
      return;
    }

    if (!fullName.trim()) {
      toast.error("Preencha o nome completo do aluno");
      return;
    }

    importAndEnrollMutation.mutate({
      subjectId: selectedSubjectId,
      students: [{
        registrationNumber: registrationNumber.trim(),
        fullName: fullName.trim(),
      }],
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError("");
    setParsedStudents([]);
    setIsParsing(true);

    try {
      // Enviar arquivo para o backend para parsing
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-student-list', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.students && result.students.length > 0) {
        setParsedStudents(result.students);
        toast.success(`${result.students.length} aluno(s) encontrado(s) no arquivo`);
      } else if (result.success && (!result.students || result.students.length === 0)) {
        setParseError("Nenhum aluno encontrado no arquivo. Verifique se o formato está correto.\n\nFormato esperado: uma linha por aluno com matrícula e nome separados por tab ou espaço.\nEx:\n2024001  João da Silva\n2024002  Maria Santos");
      } else {
        setParseError(result.message || "Erro ao processar o arquivo");
      }
    } catch (error: any) {
      console.error('Erro ao enviar arquivo:', error);
      setParseError(`Erro ao processar arquivo: ${error.message || 'Erro de conexão'}`);
    } finally {
      setIsParsing(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeStudent = (index: number) => {
    setParsedStudents(prev => prev.filter((_, i) => i !== index));
  };

  const handleBulkEnroll = () => {
    if (!selectedSubjectId) {
      toast.error("Selecione uma disciplina");
      return;
    }

    if (parsedStudents.length === 0) {
      toast.error("Nenhum aluno para matricular");
      return;
    }

    importAndEnrollMutation.mutate({
      subjectId: selectedSubjectId,
      students: parsedStudents,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Matricular Alunos
          </DialogTitle>
          <DialogDescription>
            Selecione a disciplina e adicione alunos manualmente ou por importação em massa
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Seleção de Disciplina */}
          <div className="space-y-2">
            <Label>Disciplina *</Label>
            <Select
              value={selectedSubjectId?.toString() || ""}
              onValueChange={(value) => setSelectedSubjectId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma disciplina" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name} ({subject.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs: Manual ou Importação */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastro Manual
              </TabsTrigger>
              <TabsTrigger value="import">
                <Upload className="h-4 w-4 mr-2" />
                Importar Arquivo
              </TabsTrigger>
            </TabsList>

            {/* Tab: Cadastro Manual */}
            <TabsContent value="manual" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Matrícula *</Label>
                <Input
                  id="registrationNumber"
                  placeholder="Ex: 2024001"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('fullName')?.focus();
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  placeholder="Ex: João da Silva"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleManualEnroll();
                    }
                  }}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>Credenciais de acesso:</strong> A matrícula será usada como usuário e senha para o Portal do Aluno
                </p>
              </div>

              <Button
                onClick={handleManualEnroll}
                disabled={importAndEnrollMutation.isPending || !registrationNumber.trim() || !fullName.trim() || !selectedSubjectId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {importAndEnrollMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Matriculando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Matricular Aluno
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Tab: Importação por Arquivo */}
            <TabsContent value="import" className="space-y-4 mt-4">
              {/* Upload Area */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.xlsx,.xls,.csv,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Clique para selecionar um arquivo
                </p>
                <p className="text-xs text-gray-500">
                  Formatos aceitos: .docx, .xlsx, .csv, .txt
                </p>
              </div>

              {/* File name */}
              {fileName && (
                <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{fileName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-6 w-6 p-0"
                    onClick={() => {
                      setFileName("");
                      setParsedStudents([]);
                      setParseError("");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Parsing indicator */}
              {isParsing && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando arquivo...
                </div>
              )}

              {/* Parse error */}
              {parseError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700 whitespace-pre-line">{parseError}</p>
                  </div>
                </div>
              )}

              {/* Parsed students preview */}
              {parsedStudents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        {parsedStudents.length} aluno(s) encontrado(s)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setParsedStudents([])}
                      className="text-xs text-gray-500"
                    >
                      Limpar lista
                    </Button>
                  </div>

                  <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {parsedStudents.map((student, index) => (
                      <div key={index} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded shrink-0">
                            {student.registrationNumber}
                          </span>
                          <span className="text-sm truncate">{student.fullName}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 shrink-0 text-gray-400 hover:text-red-600"
                          onClick={() => removeStudent(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Format guide */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-800 mb-2">Formato esperado do arquivo:</p>
                <div className="text-xs text-amber-700 space-y-1 font-mono">
                  <p>2024001 &nbsp; João da Silva</p>
                  <p>2024002 &nbsp; Maria Santos</p>
                  <p>2024003 &nbsp; Pedro Oliveira</p>
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  Cada linha deve ter a matrícula e o nome do aluno, separados por tab, espaço, vírgula ou ponto-e-vírgula.
                </p>
              </div>

              {/* Import button */}
              <Button
                onClick={handleBulkEnroll}
                disabled={importAndEnrollMutation.isPending || parsedStudents.length === 0 || !selectedSubjectId}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                {importAndEnrollMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Matriculando {parsedStudents.length} aluno(s)...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Matricular {parsedStudents.length} Aluno(s)
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
