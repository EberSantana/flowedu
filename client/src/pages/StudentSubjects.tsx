import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, AlertCircle, ExternalLink, FolderOpen, Users } from "lucide-react";
import StudentLayout from '../components/StudentLayout';
import { Link } from "wouter";

export default function StudentSubjects() {
  const { data: enrolledSubjects, isLoading } = trpc.student.getEnrolledSubjects.useQuery();

  const activeSubjects = enrolledSubjects?.filter(e => e.status === 'active') || [];
  const completedSubjects = enrolledSubjects?.filter(e => e.status === 'completed') || [];
  const droppedSubjects = enrolledSubjects?.filter(e => e.status === 'dropped') || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-600 text-white">Ativa</Badge>;
      case 'completed':
        return <Badge className="bg-blue-600 text-white">Concluída</Badge>;
      case 'dropped':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Minhas Disciplinas</h1>
                <p className="text-primary-foreground/80 mt-1">
                  Acompanhe todas as suas disciplinas matriculadas
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4">
          {isLoading ? (
            <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando suas disciplinas...</p>
            </div>
          ) : (
            <>
            {/* Disciplinas Ativas */}
            <Card className="bg-white mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">Disciplinas Ativas ({activeSubjects.length})</CardTitle>
              </div>
              <CardDescription>
                Disciplinas em andamento neste período
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeSubjects.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Você não está matriculado em nenhuma disciplina ativa</p>
                  <p className="text-sm text-gray-500">Entre em contato com seu professor para se matricular</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeSubjects.map((enrollment: any) => (
                    <Card key={enrollment.id} className="hover:shadow-lg transition-shadow border group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg mb-1 truncate">
                              {enrollment.subject?.name || 'Disciplina'}
                            </CardTitle>
                            <p className="text-sm text-gray-500 font-mono">
                              {enrollment.subject?.code || ''}
                            </p>
                          </div>
                          {getStatusBadge(enrollment.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">Professor: {enrollment.professor?.name || 'N/A'}</span>
                          </div>
                          
                          {enrollment.subject?.description && (
                            <p className="text-gray-600 line-clamp-2">
                              {enrollment.subject.description}
                            </p>
                          )}

                          {/* Links do Google */}
                          <div className="flex gap-2 flex-wrap">
                            {enrollment.subject?.googleClassroomUrl && (
                              <a
                                href={enrollment.subject.googleClassroomUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs text-primary hover:text-primary/80"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Classroom
                              </a>
                            )}
                            {enrollment.subject?.googleDriveUrl && (
                              <a
                                href={enrollment.subject.googleDriveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs text-success hover:text-success/80"
                              >
                                <FolderOpen className="w-3 h-3 mr-1" />
                                Drive
                              </a>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            Matriculado em: {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR') : 'N/A'}
                          </p>
                          <Link href={`/student/subject/${enrollment.subjectId}/${enrollment.userId}`}>
                            <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              Ver Trilha
                            </Button>
                          </Link>
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
            <Card className="bg-white mb-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <CardTitle className="text-xl">Disciplinas Concluídas ({completedSubjects.length})</CardTitle>
                </div>
                <CardDescription>
                  Histórico de disciplinas finalizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedSubjects.map((enrollment: any) => (
                    <Card key={enrollment.id} className="opacity-75 border hover:opacity-100 transition-opacity">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg mb-1 truncate">
                              {enrollment.subject?.name || 'Disciplina'}
                            </CardTitle>
                            <p className="text-sm text-gray-500 font-mono">
                              {enrollment.subject?.code || ''}
                            </p>
                          </div>
                          {getStatusBadge(enrollment.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Users className="w-4 h-4 mr-2" />
                            <span>Professor: {enrollment.professor?.name || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-gray-500">
                            Concluído em: {enrollment.updatedAt ? new Date(enrollment.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disciplinas Canceladas */}
          {droppedSubjects.length > 0 && (
            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <CardTitle className="text-xl">Matrículas Canceladas ({droppedSubjects.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {droppedSubjects.map((enrollment: any) => (
                    <Card key={enrollment.id} className="opacity-50 border">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg mb-1 truncate">
                              {enrollment.subject?.name || 'Disciplina'}
                            </CardTitle>
                          </div>
                          {getStatusBadge(enrollment.status)}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          </>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
