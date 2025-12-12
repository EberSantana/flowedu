import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { BookOpen, User, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function StudentDashboard() {
  const { data: enrolledSubjects, isLoading } = trpc.student.getEnrolledSubjects.useQuery();

  if (isLoading) {
    return (
      <>
        <Sidebar />
        <PageWrapper>
          <div className="container mx-auto py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Carregando suas disciplinas...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Portal do Aluno
            </h1>
            <p className="text-gray-600">
              Acompanhe seu progresso e acesse os materiais das suas disciplinas
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Disciplinas Ativas
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {enrolledSubjects?.filter(e => e.status === 'active').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  disciplinas em andamento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Disciplinas Concluídas
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {enrolledSubjects?.filter(e => e.status === 'completed').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  disciplinas finalizadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Progresso Geral
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {enrolledSubjects && enrolledSubjects.length > 0
                    ? Math.round(
                        (enrolledSubjects.filter(e => e.status === 'completed').length /
                          enrolledSubjects.length) *
                          100
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  de conclusão
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enrolled Subjects */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Minhas Disciplinas
            </h2>

            {!enrolledSubjects || enrolledSubjects.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma disciplina matriculada
                  </h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Você ainda não está matriculado em nenhuma disciplina. Entre em contato com seu professor para solicitar matrícula.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledSubjects.map((enrollment) => (
                  <Card key={enrollment.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">
                            {enrollment.subject?.name || 'Disciplina'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3" />
                            {enrollment.professor?.name || 'Professor'}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            enrollment.status === 'active'
                              ? 'default'
                              : enrollment.status === 'completed'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {enrollment.status === 'active'
                            ? 'Ativa'
                            : enrollment.status === 'completed'
                            ? 'Concluída'
                            : 'Cancelada'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {enrollment.subject?.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {enrollment.subject.description}
                        </p>
                      )}
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Código:</span>
                          <span className="font-medium">{enrollment.subject?.code}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Carga Horária:</span>
                          <span className="font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {enrollment.subject?.workload || 0}h
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <Link href={`/student/subject/${enrollment.subjectId}/${enrollment.professorId}`}>
                          <Button className="w-full" size="sm">
                            Acessar Trilha de Aprendizagem
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
