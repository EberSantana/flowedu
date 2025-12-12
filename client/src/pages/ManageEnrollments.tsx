import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { UserPlus, Users, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function ManageEnrollments() {
  const [, params] = useRoute("/subjects/:subjectId/enrollments");
  const subjectId = params?.subjectId ? parseInt(params.subjectId) : 0;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

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
      setIsAddDialogOpen(false);
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
        <div className="container mx-auto py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/subjects">
              <Button variant="ghost" size="sm" className="mb-4">
                ← Voltar para Disciplinas
              </Button>
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Gerenciar Matrículas
                </h1>
                <p className="text-gray-600">
                  {subject?.name || 'Disciplina'}
                </p>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Matricular Aluno
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Alunos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {enrollments?.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Matrículas Ativas
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {enrollments?.filter(e => e.status === 'active').length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Concluídas
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {enrollments?.filter(e => e.status === 'completed').length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enrollments List */}
          <Card>
            <CardHeader>
              <CardTitle>Alunos Matriculados</CardTitle>
              <CardDescription>
                Gerencie as matrículas e acompanhe o status dos alunos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!enrollments || enrollments.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum aluno matriculado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comece matriculando alunos nesta disciplina
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Matricular Primeiro Aluno
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Aluno</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">E-mail</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Data de Matrícula</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enrollment) => (
                        <tr key={enrollment.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium">{enrollment.student?.name || 'Aluno'}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {enrollment.student?.email || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <Select
                              value={enrollment.status}
                              onValueChange={(value) =>
                                handleUpdateStatus(enrollment.id, value as any)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Ativa</SelectItem>
                                <SelectItem value="completed">Concluída</SelectItem>
                                <SelectItem value="dropped">Cancelada</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeleteEnrollment(enrollment.id, enrollment.student?.name || 'Aluno')
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
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

          {/* Add Enrollment Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Matricular Aluno</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione o Aluno
                  </label>
                  <Select
                    value={selectedStudentId?.toString() || ""}
                    onValueChange={(value) => setSelectedStudentId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um aluno..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStudents.length === 0 ? (
                        <div className="p-2 text-sm text-gray-600">
                          Todos os alunos já estão matriculados
                        </div>
                      ) : (
                        availableStudents.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.name} ({student.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddEnrollment}
                  disabled={!selectedStudentId || createEnrollmentMutation.isPending}
                >
                  {createEnrollmentMutation.isPending ? "Matriculando..." : "Matricular"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageWrapper>
    </>
  );
}
