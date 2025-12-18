import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { UserPlus, Users, Trash2, CheckCircle2, XCircle, Search, Mail, Calendar, MoreVertical, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ManageEnrollments() {
  const [, params] = useRoute("/subjects/:subjectId/enrollments");
  const subjectId = params?.subjectId ? parseInt(params.subjectId) : 0;

  
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: subjects } = trpc.subjects.list.useQuery();
  const subject = subjects?.find(s => s.id === subjectId);

  const { data: enrollments, isLoading } = trpc.enrollments.getBySubject.useQuery(
    { subjectId },
    { enabled: !!subjectId }
  );

  const { data: allUsers } = trpc.admin.listActiveUsers.useQuery();

  const utils = trpc.useUtils();

  const createEnrollmentMutation = trpc.enrollments.create.useMutation({
    onSuccess: () => {
      utils.enrollments.getBySubject.invalidate();
      toast.success("Aluno matriculado com sucesso!");
      setSelectedStudentId(null);
    },
    onError: (error) => {
      toast.error("Erro ao matricular aluno: " + error.message);
    },
  });

  const updateStatusMutation = trpc.enrollments.updateStatus.useMutation({
    onSuccess: () => {
      utils.enrollments.getBySubject.invalidate();
      toast.success("Status atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const deleteEnrollmentMutation = trpc.enrollments.delete.useMutation({
    onSuccess: () => {
      utils.enrollments.getBySubject.invalidate();
      toast.success("Matrícula removida!");
    },
    onError: (error) => {
      toast.error("Erro ao remover matrícula: " + error.message);
    },
  });

  const handleAddEnrollment = () => {
    if (!selectedStudentId) {
      toast.error("Selecione um aluno");
      return;
    }

    createEnrollmentMutation.mutate({
      studentId: selectedStudentId,
      subjectId,
    });
  };

  const handleUpdateStatus = (enrollmentId: number, status: 'active' | 'completed' | 'dropped') => {
    updateStatusMutation.mutate({ id: enrollmentId, status });
  };

  const handleDeleteEnrollment = (enrollmentId: number, studentName: string) => {
    if (confirm(`Tem certeza que deseja remover a matrícula de ${studentName}?`)) {
      deleteEnrollmentMutation.mutate({ id: enrollmentId });
    }
  };

  // Filter students who are not already enrolled
  const availableStudents = allUsers?.filter(
    (user) =>
      user.role === 'user' &&
      !enrollments?.some((e) => e.studentId === user.id)
  ) || [];

  // Filter enrollments by search query
  const filteredEnrollments = enrollments?.filter(enrollment => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (enrollment.student?.name as string | undefined)?.toLowerCase().includes(query) ||
      (enrollment.registrationNumber as string | undefined)?.toLowerCase().includes(query)
    );
  }) || [];

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativa</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Concluída</Badge>;
      case 'dropped':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <>
        <Sidebar />
        <PageWrapper>
          <div className="container mx-auto py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Carregando matrículas...</p>
              </div>
            </div>
          </div>
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <PageWrapper>
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <Link href="/subjects">
              <Button variant="ghost" size="sm" className="mb-4">
                ← Voltar para Disciplinas
              </Button>
            </Link>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Gerenciar Matrículas
                </h1>
                <p className="text-gray-600 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: subject?.color || '#3b82f6' }}></span>
                  {subject?.name || 'Disciplina'} - {subject?.code}
                </p>
              </div>

            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Alunos
                </CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {enrollments?.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Matrículas Ativas
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {enrollments?.filter(e => e.status === 'active').length || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Concluídas
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {enrollments?.filter(e => e.status === 'completed').length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Enrollments List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Alunos Matriculados
                  </CardTitle>
                  <CardDescription>
                    {filteredEnrollments.length} aluno(s) encontrado(s)
                  </CardDescription>
                </div>
                {enrollments && enrollments.length > 0 && (
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar aluno..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!enrollments || enrollments.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum aluno matriculado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Matricule alunos através da página de Disciplinas
                  </p>
                </div>
              ) : filteredEnrollments.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum aluno encontrado com "{searchQuery}"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEnrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <Avatar className="h-12 w-12 border-2 border-white shadow">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(enrollment.student?.name || 'Aluno')}&backgroundColor=6366f1&textColor=ffffff`}
                            alt={enrollment.student?.name || 'Aluno'}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                            {enrollment.student?.name?.charAt(0).toUpperCase() || 'A'}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {enrollment.student?.name || 'Aluno'}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            {enrollment.registrationNumber && (
                              <span className="flex items-center gap-1 font-medium text-gray-700">
                                <GraduationCap className="h-3 w-3" />
                                {enrollment.registrationNumber}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Matriculado em {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR') : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center gap-3">
                        {getStatusBadge(enrollment.status)}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(enrollment.id, 'active')}
                              className="text-green-600"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Marcar como Ativa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(enrollment.id, 'completed')}
                              className="text-blue-600"
                            >
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Marcar como Concluída
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(enrollment.id, 'dropped')}
                              className="text-orange-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Marcar como Cancelada
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteEnrollment(enrollment.id, enrollment.student?.name || 'Aluno')}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover Matrícula
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>


        </div>
      </PageWrapper>
    </>
  );
}
