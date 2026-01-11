import { useState } from 'react';
import { Link } from 'wouter';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { LoadingButton } from '../components/ui/loading-button';
import { EmptyState } from '../components/ui/empty-state';
import { SkeletonTable } from '../components/ui/skeleton-card';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Pencil, Trash2, Search, UserPlus, Download, FileText, Eye } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import PageWrapper from '../components/PageWrapper';

type Student = {
  id: number;
  registrationNumber: string;
  fullName: string;
  createdAt: Date;
};

export default function Students() {
  const utils = trpc.useUtils();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    fullName: '',
  });

  const { data: students = [], isLoading } = trpc.students.list.useQuery();

  const createMutation = trpc.students.create.useMutation({
    onSuccess: () => {
      toast.success('Aluno cadastrado com sucesso!');
      utils.students.list.invalidate();
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao cadastrar aluno' + error.message);
    },
  });

  const updateMutation = trpc.students.update.useMutation({
    onSuccess: () => {
      toast.success('Aluno atualizado com sucesso!');
      utils.students.list.invalidate();
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar aluno' + error.message);
    },
  });

  const deleteMutation = trpc.students.delete.useMutation({
    onSuccess: () => {
      toast.success('Aluno excluído com sucesso!');
      utils.students.list.invalidate();
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir aluno' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingId(student.id);
    setFormData({
      registrationNumber: student.registrationNumber,
      fullName: student.fullName,
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
      deleteMutation.mutate({ id });
    }
  };

  const resetForm = () => {
    setFormData({ registrationNumber: '', fullName: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredStudents = students.filter((student: Student) =>
    student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportDOCXMutation = trpc.students.exportDOCX.useQuery(undefined, {
    enabled: false,
  });

  const exportPDFMutation = trpc.students.exportPDF.useQuery(undefined, {
    enabled: false,
  });

  const handleExportDOCX = async () => {
    try {
      const result = await exportDOCXMutation.refetch();
      if (result.data) {
        const blob = new Blob(
          [Uint8Array.from(atob(result.data.data), c => c.charCodeAt(0))],
          { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('DOCX exportado com sucesso!');
      }
    } catch (error: any) {
      toast.error('Erro ao exportar DOCX: ' + error.message);
    }
  };

  const handleExportPDF = async () => {
    try {
      const result = await exportPDFMutation.refetch();
      if (result.data) {
        const blob = new Blob(
          [Uint8Array.from(atob(result.data.data), c => c.charCodeAt(0))],
          { type: 'application/pdf' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('PDF exportado com sucesso!');
      }
    } catch (error: any) {
      toast.error('Erro ao exportar PDF: ' + error.message);
    }
  };

  return (
    <DashboardLayout>
      <PageWrapper>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Gerenciar Matrículas</h1>
          <p className="text-gray-600">Cadastre e gerencie os alunos matriculados</p>
        </div>

        {/* Barra de Ações */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Buscar por matrícula ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto min-h-[44px]"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {showForm ? 'Cancelar' : 'Novo Aluno'}
          </Button>
          <Button
            onClick={handleExportDOCX}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full sm:w-auto min-h-[44px]"
            disabled={exportDOCXMutation.isFetching || students.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportDOCXMutation.isFetching ? 'Gerando...' : 'Exportar DOCX'}
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50 w-full sm:w-auto min-h-[44px]"
            disabled={exportPDFMutation.isFetching || students.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            {exportPDFMutation.isFetching ? 'Gerando...' : 'Exportar PDF'}
          </Button>
        </div>

        {/* Formulário de Cadastro/Edição */}
        {showForm && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle>{editingId ? 'Editar Aluno' : 'Novo Aluno'}</CardTitle>
              <CardDescription>
                {editingId ? 'Atualize os dados do aluno' : 'Preencha os dados para cadastrar um novo aluno'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="registrationNumber">Matrícula *</Label>
                    <Input
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      placeholder="Ex: 2024001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Ex: João da Silva Santos"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <LoadingButton 
                    type="submit" 
                    loading={createMutation.isPending || updateMutation.isPending}
                    loadingText={editingId ? 'Atualizando...' : 'Cadastrando...'}
                  >
                    {editingId ? 'Atualizar' : 'Cadastrar'}
                  </LoadingButton>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Contador de Resultados */}
        <div className="mb-4 text-sm text-gray-600">
          {filteredStudents.length} {filteredStudents.length === 1 ? 'aluno encontrado' : 'alunos encontrados'}
          {searchTerm && ` para "${searchTerm}"`}
        </div>

        {/* Tabela de Alunos */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                <SkeletonTable rows={5} />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={UserPlus}
                  title={searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
                  description={searchTerm ? 'Tente buscar com outros termos.' : 'Comece cadastrando seu primeiro aluno para gerenciar matrículas.'}
                  actionLabel={!searchTerm ? 'Cadastrar Primeiro Aluno' : undefined}
                  onAction={!searchTerm ? () => setShowForm(true) : undefined}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Matrícula
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome Completo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data de Cadastro
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student: Student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.registrationNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {student.fullName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(student.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link href={`/students/${student.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-800 hover:bg-green-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(student)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 ml-2"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(student.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 ml-2"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </PageWrapper>
    </DashboardLayout>
  );
}
