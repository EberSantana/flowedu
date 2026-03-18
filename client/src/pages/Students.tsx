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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Pencil, Trash2, Search, UserPlus, Download, FileText, Eye, Mail, Calendar, User } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import PageWrapper from '../components/PageWrapper';
import { Breadcrumb } from '@/components/Breadcrumb';

type Student = {
  id: number;
  registrationNumber: string;
  fullName: string;
  email?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  genderCustom?: string | null;
  pronoun?: string | null;
  createdAt: Date;
};

const GENDER_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'nao_binario', label: 'Não-binário' },
  { value: 'personalizar', label: 'Personalizar' },
  { value: 'prefiro_nao_informar', label: 'Prefiro não informar' },
];

const PRONOUN_OPTIONS = [
  { value: 'ele_dele', label: 'Ele/Dele' },
  { value: 'ela_dela', label: 'Ela/Dela' },
  { value: 'elu_delu', label: 'Elu/Delu' },
  { value: 'prefiro_nao_informar', label: 'Prefiro não informar' },
];

const MONTHS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

function getGenderLabel(gender?: string | null) {
  if (!gender) return '-';
  const opt = GENDER_OPTIONS.find(o => o.value === gender);
  return opt ? opt.label : gender;
}

function getPronounLabel(pronoun?: string | null) {
  if (!pronoun) return '-';
  const opt = PRONOUN_OPTIONS.find(o => o.value === pronoun);
  return opt ? opt.label : pronoun;
}

function formatBirthDate(birthDate?: string | null) {
  if (!birthDate) return '-';
  const parts = birthDate.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return birthDate;
}

export default function Students() {
  const utils = trpc.useUtils();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    fullName: '',
    email: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    gender: 'prefiro_nao_informar',
    genderCustom: '',
    pronoun: 'prefiro_nao_informar',
  });

  const { data: students = [], isLoading } = trpc.students.list.useQuery();

  const createMutation = trpc.students.create.useMutation({
    onSuccess: () => {
      toast.success('Aluno cadastrado com sucesso!');
      utils.students.list.invalidate();
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao cadastrar aluno: ' + error.message);
    },
  });

  const updateMutation = trpc.students.update.useMutation({
    onSuccess: () => {
      toast.success('Aluno atualizado com sucesso!');
      utils.students.list.invalidate();
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar aluno: ' + error.message);
    },
  });

  const deleteMutation = trpc.students.delete.useMutation({
    onSuccess: () => {
      toast.success('Aluno excluído com sucesso!');
      utils.students.list.invalidate();
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir aluno: ' + error.message);
    },
  });

  const buildBirthDate = () => {
    if (formData.birthDay && formData.birthMonth && formData.birthYear) {
      const day = formData.birthDay.padStart(2, '0');
      return `${formData.birthYear}-${formData.birthMonth}-${day}`;
    }
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const birthDate = buildBirthDate();
    const payload = {
      registrationNumber: formData.registrationNumber,
      fullName: formData.fullName,
      email: formData.email || undefined,
      birthDate: birthDate || undefined,
      gender: formData.gender as any,
      genderCustom: formData.gender === 'personalizar' ? formData.genderCustom : undefined,
      pronoun: formData.pronoun as any,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (student: Student) => {
    const parts = student.birthDate ? student.birthDate.split('-') : ['', '', ''];
    setEditingId(student.id);
    setFormData({
      registrationNumber: student.registrationNumber,
      fullName: student.fullName,
      email: student.email || '',
      birthYear: parts[0] || '',
      birthMonth: parts[1] || '',
      birthDay: parts[2] || '',
      gender: student.gender || 'prefiro_nao_informar',
      genderCustom: student.genderCustom || '',
      pronoun: student.pronoun || 'prefiro_nao_informar',
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
      deleteMutation.mutate({ id });
    }
  };

  const resetForm = () => {
    setFormData({
      registrationNumber: '',
      fullName: '',
      email: '',
      birthDay: '',
      birthMonth: '',
      birthYear: '',
      gender: 'prefiro_nao_informar',
      genderCustom: '',
      pronoun: 'prefiro_nao_informar',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredStudents = students.filter((student: Student) =>
    student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
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
      <PageWrapper className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
        <Breadcrumb items={[{ label: "Gestão Acadêmica" }, { label: "Matrículas" }]} />
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gerenciar Matrículas</h1>
          <p className="text-muted-foreground">Cadastre e gerencie os alunos matriculados</p>
        </div>

        {/* Barra de Ações */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Buscar por matrícula, nome ou e-mail..."
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Seção 1: Dados Básicos */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados Básicos
                  </h3>
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
                </div>

                {/* Seção 2: Contato */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contato
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Ex: aluno@email.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">Utilizado para comunicações e envio de materiais</p>
                    </div>
                  </div>
                </div>

                {/* Seção 3: Data de Nascimento */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data de Nascimento
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="birthDay">Dia</Label>
                      <Input
                        id="birthDay"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.birthDay}
                        onChange={(e) => setFormData({ ...formData, birthDay: e.target.value })}
                        placeholder="Dia"
                      />
                    </div>
                    <div>
                      <Label htmlFor="birthMonth">Mês</Label>
                      <Select
                        value={formData.birthMonth}
                        onValueChange={(val) => setFormData({ ...formData, birthMonth: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="birthYear">Ano</Label>
                      <Input
                        id="birthYear"
                        type="number"
                        min="1950"
                        max={new Date().getFullYear()}
                        value={formData.birthYear}
                        onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                        placeholder="Ano"
                      />
                    </div>
                  </div>
                </div>

                {/* Seção 4: Informações de Identidade */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Informações Pessoais</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Essas informações são opcionais e tratadas com total respeito e confidencialidade. 
                    Utilizamos para personalizar a comunicação e promover um ambiente inclusivo.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gender">Gênero</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(val) => setFormData({ ...formData, gender: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.gender === 'personalizar' && (
                      <div>
                        <Label htmlFor="genderCustom">Qual é seu gênero?</Label>
                        <Input
                          id="genderCustom"
                          value={formData.genderCustom}
                          onChange={(e) => setFormData({ ...formData, genderCustom: e.target.value })}
                          placeholder="Como você se identifica?"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="pronoun">Pode me tratar como</Label>
                      <Select
                        value={formData.pronoun}
                        onValueChange={(val) => setFormData({ ...formData, pronoun: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRONOUN_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Matrícula
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome Completo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        E-mail
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Nascimento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Pronome
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student: Student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.registrationNumber}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          {student.fullName}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {student.email || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                          {formatBirthDate(student.birthDate)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                          {getPronounLabel(student.pronoun)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 ml-1"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(student.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 ml-1"
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
        </div>
      </PageWrapper>
    </DashboardLayout>
  );
}
