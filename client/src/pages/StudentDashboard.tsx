import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, GraduationCap, AlertCircle } from "lucide-react";
import DashboardLayout from '../components/DashboardLayout';
import PageWrapper from '../components/PageWrapper';

export default function StudentDashboard() {
  const { data: enrolledSubjects, isLoading } = trpc.student.getEnrolledSubjects.useQuery();

  const activeSubjects = enrolledSubjects?.filter(e => e.status === 'active') || [];
  const completedSubjects = enrolledSubjects?.filter(e => e.status === 'completed') || [];

  return (
    <DashboardLayout>
      <PageWrapper>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Portal do Aluno</h1>
          <p className="text-gray-600">Bem-vindo ao seu espaço de aprendizado</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando suas disciplinas...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Disciplinas Ativas
                  </CardTitle>
                  <BookOpen className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {activeSubjects.length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    em andamento
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Concluídas
                  </CardTitle>
                  <GraduationCap className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {completedSubjects.length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    disciplinas finalizadas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Total de Disciplinas
                  </CardTitle>
                  <Clock className="h-5 w-5 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {enrolledSubjects?.length || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    no histórico
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Disciplinas Ativas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Minhas Disciplinas</CardTitle>
                <CardDescription>
                  Acompanhe suas disciplinas matriculadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeSubjects.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Você não está matriculado em nenhuma disciplina</p>
                    <p className="text-sm text-gray-500">Entre em contato com seu professor para se matricular</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeSubjects.map((enrollment: any) => (
                      <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-1">
                                {enrollment.subject?.name || 'Disciplina'}
                              </CardTitle>
                              <p className="text-sm text-gray-500">
                                {enrollment.subject?.code || ''}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Ativa
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-600">
                              <BookOpen className="w-4 h-4 mr-2" />
                              <span>Professor: {enrollment.professor?.name || 'N/A'}</span>
                            </div>
                            {enrollment.subject?.description && (
                              <p className="text-gray-600 line-clamp-2">
                                {enrollment.subject.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-xs text-gray-500">
                              Matriculado em: {new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Disciplinas Concluídas */}
            {completedSubjects.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-xl">Disciplinas Concluídas</CardTitle>
                  <CardDescription>
                    Histórico de disciplinas finalizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedSubjects.map((enrollment: any) => (
                      <Card key={enrollment.id} className="opacity-75">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-1">
                                {enrollment.subject?.name || 'Disciplina'}
                              </CardTitle>
                              <p className="text-sm text-gray-500">
                                {enrollment.subject?.code || ''}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                              Concluída
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-600">
                              <BookOpen className="w-4 h-4 mr-2" />
                              <span>Professor: {enrollment.professor?.name || 'N/A'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </PageWrapper>
    </DashboardLayout>
  );
}
