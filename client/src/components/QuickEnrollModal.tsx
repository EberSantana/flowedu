import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { UserPlus, Upload } from "lucide-react";
import ImportStudentsModal from "./ImportStudentsModal";

interface QuickEnrollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function QuickEnrollModal({ open, onOpenChange, onSuccess }: QuickEnrollModalProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  const { data: subjects = [] } = trpc.subjects.list.useQuery();
  const utils = trpc.useUtils();

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
        setRegistrationNumber("");
        setFullName("");
        setSelectedSubjectId(null);
        
        utils.subjects.getEnrollmentCounts.invalidate();
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

  const handleManualEnroll = async () => {
    if (!selectedSubjectId) {
      toast.error("Selecione uma disciplina");
      return;
    }

    if (!registrationNumber.trim() || !fullName.trim()) {
      toast.error("Preencha matrícula e nome completo");
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

  const handleImportClick = () => {
    if (!selectedSubjectId) {
      toast.error("Selecione uma disciplina primeiro");
      return;
    }
    setShowImportModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Matricular Alunos</DialogTitle>
            <DialogDescription>
              Selecione a disciplina e adicione alunos manualmente ou por importação em massa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Cadastro Manual</TabsTrigger>
                <TabsTrigger value="import">Importação em Massa</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Matrícula *</Label>
                  <Input
                    id="registrationNumber"
                    placeholder="Ex: 2024001"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    placeholder="Ex: João da Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Credenciais de acesso:</strong> A matrícula será usada como usuário e senha para o Portal do Aluno
                  </p>
                </div>

                <Button
                  onClick={handleManualEnroll}
                  disabled={importAndEnrollMutation.isPending}
                  className="w-full"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {importAndEnrollMutation.isPending ? "Matriculando..." : "Matricular Aluno"}
                </Button>
              </TabsContent>

              <TabsContent value="import" className="space-y-4 mt-4">
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    Importe múltiplos alunos de uma vez usando arquivos Excel, PDF ou DOCX
                  </p>
                  <Button onClick={handleImportClick}>
                    <Upload className="mr-2 h-4 w-4" />
                    Abrir Importação em Massa
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Importação */}
      {selectedSubjectId && (
        <ImportStudentsModal
          open={showImportModal}
          onOpenChange={setShowImportModal}
          onSuccess={() => {
            setShowImportModal(false);
            utils.subjects.getEnrollmentCounts.invalidate();
            onSuccess();
            onOpenChange(false);
          }}
          subjectId={selectedSubjectId}
        />
      )}
    </>
  );
}
