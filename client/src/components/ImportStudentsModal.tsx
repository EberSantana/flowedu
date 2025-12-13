import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, FileText, Download, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportStudentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  subjectId?: number; // Opcional: se fornecido, matricula na disciplina
}

interface ParsedStudent {
  registrationNumber: string;
  fullName: string;
}

export default function ImportStudentsModal({ open, onOpenChange, onSuccess, subjectId }: ImportStudentsModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const parseFileMutation = trpc.students.parseImportFile.useMutation();
  const confirmImportMutation = trpc.students.confirmImport.useMutation();
  const importAndEnrollMutation = trpc.students.importAndEnrollInSubject.useMutation();
  const downloadTemplateMutation = trpc.students.downloadTemplate.useMutation();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    const validExtensions = ['.xlsx', '.xls', '.pdf', '.docx', '.doc'];
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      toast.error('Formato inválido. Use .xlsx, .pdf ou .docx');
      return;
    }

    setFile(selectedFile);
    setIsUploading(true);
    setParsedData(null);
    setParseErrors([]);

    try {
      // Ler arquivo como base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1]; // Remove "data:..." prefix

        try {
          const result = await parseFileMutation.mutateAsync({
            fileData: base64Data,
            filename: selectedFile.name,
          });

          if (result.success && result.students.length > 0) {
            setParsedData(result.students);
            setParseErrors(result.errors);
            toast.success(`${result.students.length} aluno(s) identificado(s)`);
          } else {
            setParseErrors(result.errors);
            toast.error('Não foi possível extrair dados do arquivo');
          }
        } catch (error: any) {
          toast.error(`Erro ao processar arquivo: ${error.message}`);
          setParseErrors([error.message]);
        } finally {
          setIsUploading(false);
        }
      };

      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      toast.error(`Erro ao ler arquivo: ${error.message}`);
      setIsUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData || parsedData.length === 0) return;

    try {
      // Se subjectId for fornecido, usa rota de importação + matrícula
      if (subjectId) {
        const result = await importAndEnrollMutation.mutateAsync({
          students: parsedData,
          subjectId,
        });

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
        }

        if (result.errors.length > 0) {
          toast.warning(`${result.errors.length} erro(s) durante importação`);
          setParseErrors(result.errors);
        }

        if (totalSuccess > 0) {
          onSuccess();
          handleClose();
        }
      } else {
        // Rota original: apenas criar alunos
        const result = await confirmImportMutation.mutateAsync({
          students: parsedData,
        });

        if (result.success.length > 0) {
          toast.success(`${result.success.length} aluno(s) importado(s) com sucesso!`);
        }

        if (result.errors.length > 0) {
          toast.warning(`${result.errors.length} erro(s) durante importação`);
          setParseErrors(result.errors);
        }

        if (result.success.length > 0) {
          onSuccess();
          handleClose();
        }
      }
    } catch (error: any) {
      toast.error(`Erro ao importar: ${error.message}`);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const result = await downloadTemplateMutation.mutateAsync();
      
      // Converter base64 para blob e fazer download
      const blob = base64ToBlob(result.data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Template baixado com sucesso!');
    } catch (error: any) {
      toast.error(`Erro ao baixar template: ${error.message}`);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const handleClose = () => {
    setFile(null);
    setParsedData(null);
    setParseErrors([]);
    setIsUploading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Alunos em Massa</DialogTitle>
          <DialogDescription>
            {subjectId 
              ? "Faça upload de um arquivo Excel (.xlsx), PDF ou DOCX. Os alunos serão criados (se necessário) e matriculados automaticamente nesta disciplina."
              : "Faça upload de um arquivo Excel (.xlsx), PDF ou DOCX contendo matrícula e nome completo dos alunos"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              disabled={downloadTemplateMutation.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Template Excel
            </Button>
          </div>

          {/* Upload Area */}
          {!parsedData && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
                ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary'}
              `}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.xlsx,.xls,.pdf,.docx,.doc';
                input.onchange = (e: any) => {
                  const file = e.target.files[0];
                  if (file) handleFileSelect(file);
                };
                input.click();
              }}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Processando arquivo...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Arraste um arquivo ou clique para selecionar
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Formatos aceitos: .xlsx, .pdf, .docx
                  </p>
                  <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      PDF
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      DOCX
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Parse Errors */}
          {parseErrors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Avisos durante processamento:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {parseErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Table */}
          {parsedData && parsedData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">
                  Preview dos Dados ({parsedData.length} aluno{parsedData.length > 1 ? 's' : ''})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setParsedData(null);
                    setFile(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>

              <div className="border rounded-lg max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome Completo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((student, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{student.registrationNumber}</TableCell>
                        <TableCell>{student.fullName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Alert className="mt-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Os alunos serão cadastrados com <strong>matrícula = senha</strong> para acesso ao Portal do Aluno
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          {parsedData && parsedData.length > 0 && (
            <Button
              onClick={handleConfirmImport}
              disabled={confirmImportMutation.isPending}
            >
              {confirmImportMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Importação
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
