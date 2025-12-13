import { useState } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { UserPlus, Trash2, Download, FileSpreadsheet, FileText, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

export default function SubjectEnrollments() {
  const [, params] = useRoute("/subjects/:id/enrollments");
  const subjectId = params?.id ? parseInt(params.id) : 0;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isExportingXLS, setIsExportingXLS] = useState(false);
  const [isExportingDOCX, setIsExportingDOCX] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const { data: subject } = trpc.subjects.list.useQuery(undefined, {
    select: (subjects) => subjects.find(s => s.id === subjectId),
  });

  const { data: enrolledStudents = [], refetch } = trpc.subjects.getEnrolledStudents.useQuery(
    { subjectId },
    { enabled: subjectId > 0 }
  );

  const { data: allStudents = [] } = trpc.students.list.useQuery();

  const enrollMutation = trpc.subjects.enrollStudent.useMutation({
    onSuccess: () => {
      toast.success("Aluno matriculado com sucesso!");
      refetch();
      setIsAddDialogOpen(false);
      setSelectedStudentId("");
    },
    onError: (error) => {
      toast.error(`Erro ao matricular aluno: ${error.message}`);
    },
  });

  const unenrollMutation = trpc.subjects.unenrollStudent.useMutation({
    onSuccess: () => {
      toast.success("Aluno removido da disciplina!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao remover aluno: ${error.message}`);
    },
  });

  const handleEnroll = () => {
    if (!selectedStudentId) {
      toast.error("Selecione um aluno");
      return;
    }
    enrollMutation.mutate({ studentId: parseInt(selectedStudentId), subjectId });
  };

  const handleUnenroll = (enrollmentId: number) => {
    if (confirm("Tem certeza que deseja remover este aluno da disciplina?")) {
      unenrollMutation.mutate({ enrollmentId });
    }
  };

  const handleExportXLS = async () => {
    setIsExportingXLS(true);
    try {
      // Importar xlsx dinamicamente
      const XLSX = await import('xlsx');
      
      // Preparar dados
      const data = enrolledStudents.map(s => ({
        'Matrícula': s.registrationNumber,
        'Nome Completo': s.fullName,
        'Data de Matrícula': new Date(s.enrolledAt).toLocaleDateString('pt-BR'),
      }));
      
      // Criar workbook
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Alunos");
      
      // Download
      XLSX.writeFile(wb, `alunos-${subject?.code || 'disciplina'}-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Arquivo XLS exportado!");
    } catch (error) {
      toast.error("Erro ao exportar XLS");
      console.error(error);
    } finally {
      setIsExportingXLS(false);
    }
  };

  const handleExportDOCX = async () => {
    setIsExportingDOCX(true);
    try {
      // Importar docx dinamicamente
      const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, TextRun } = await import('docx');
      
      // Criar documento
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: `Lista de Alunos - ${subject?.name || 'Disciplina'}`,
              heading: "Heading1",
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `Código: ${subject?.code || 'N/A'}`,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `Data: ${new Date().toLocaleDateString('pt-BR')}`,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "Matrícula", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Nome Completo", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Data de Matrícula", bold: true })] }),
                  ],
                }),
                ...enrolledStudents.map(s => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(s.registrationNumber)] }),
                    new TableCell({ children: [new Paragraph(s.fullName)] }),
                    new TableCell({ children: [new Paragraph(new Date(s.enrolledAt).toLocaleDateString('pt-BR'))] }),
                  ],
                })),
              ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: `Total de alunos: ${enrolledStudents.length}`,
            }),
          ],
        }],
      });
      
      // Gerar e download
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alunos-${subject?.code || 'disciplina'}-${new Date().toISOString().split('T')[0]}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Arquivo DOCX exportado!");
    } catch (error) {
      toast.error("Erro ao exportar DOCX");
      console.error(error);
    } finally {
      setIsExportingDOCX(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      // Importar jspdf dinamicamente
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.text(`Lista de Alunos - ${subject?.name || 'Disciplina'}`, 105, 20, { align: 'center' });
      
      // Subtítulo
      doc.setFontSize(12);
      doc.text(`Código: ${subject?.code || 'N/A'}`, 105, 30, { align: 'center' });
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 105, 37, { align: 'center' });
      
      // Tabela
      (doc as any).autoTable({
        startY: 45,
        head: [['Matrícula', 'Nome Completo', 'Data de Matrícula']],
        body: enrolledStudents.map(s => [
          s.registrationNumber,
          s.fullName,
          new Date(s.enrolledAt).toLocaleDateString('pt-BR'),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [68, 114, 196] },
      });
      
      // Rodapé
      const finalY = (doc as any).lastAutoTable.finalY || 45;
      doc.setFontSize(12);
      doc.text(`Total de alunos: ${enrolledStudents.length}`, 14, finalY + 10);
      
      // Download
      doc.save(`alunos-${subject?.code || 'disciplina'}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Arquivo PDF exportado!");
    } catch (error) {
      toast.error("Erro ao exportar PDF");
      console.error(error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Filtrar alunos que não estão matriculados
  const availableStudents = allStudents.filter(
    student => !enrolledStudents.some(enrolled => enrolled.studentId === student.id)
  );

  if (!subject) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p>Disciplina não encontrada</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/subjects">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Alunos Matriculados</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              {subject.name} ({subject.code})
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Aluno
            </Button>
          </div>
        </div>

        {/* Export Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Exportar Lista</CardTitle>
            <CardDescription>
              Baixe a lista de alunos matriculados em diferentes formatos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                onClick={handleExportXLS}
                disabled={isExportingXLS || enrolledStudents.length === 0}
                variant="outline"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {isExportingXLS ? "Exportando..." : "Exportar XLS"}
              </Button>
              <Button
                onClick={handleExportDOCX}
                disabled={isExportingDOCX || enrolledStudents.length === 0}
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isExportingDOCX ? "Exportando..." : "Exportar DOCX"}
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={isExportingPDF || enrolledStudents.length === 0}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExportingPDF ? "Exportando..." : "Exportar PDF"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Alunos ({enrolledStudents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {enrolledStudents.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum aluno matriculado</p>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="mt-4"
                  variant="outline"
                >
                  Adicionar primeiro aluno
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {enrolledStudents.map((student) => (
                  <div
                    key={student.enrollmentId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{student.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        Matrícula: {student.registrationNumber} • Matriculado em{" "}
                        {new Date(student.enrolledAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnenroll(student.enrollmentId)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Student Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Aluno</DialogTitle>
              <DialogDescription>
                Selecione um aluno para matricular nesta disciplina
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="student">Aluno</Label>
                <select
                  id="student"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="">Selecione um aluno</option>
                  {availableStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} ({student.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleEnroll}
                disabled={!selectedStudentId || enrollMutation.isPending}
              >
                {enrollMutation.isPending ? "Matriculando..." : "Matricular"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
