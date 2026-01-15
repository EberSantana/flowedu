import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Clock, 
  GraduationCap, 
  AlertCircle, 
  ArrowRight,
  FileText,
  Map,
  Lightbulb,
  Bell,
  User,
  BarChart3
} from "lucide-react";
import StudentLayout from '../components/StudentLayout';
import { Link } from "wouter";
import { useStudentAuth } from "@/hooks/useStudentAuth";

export default function StudentDashboard() {
  const { student } = useStudentAuth();
  const { data: enrolledSubjects, isLoading } = trpc.student.getEnrolledSubjects.useQuery();

  const activeSubjects = enrolledSubjects?.filter(e => e.status === 'active') || [];
  const completedSubjects = enrolledSubjects?.filter(e => e.status === 'completed') || [];

  // Ações rápidas profissionais
  const quickActions = [
    { icon: BookOpen, label: "Disciplinas", path: "/student-subjects", color: "bg-primary", description: "Acesse suas disciplinas" },
    { icon: Map, label: "Trilhas", path: "/student-learning-paths", color: "bg-purple-600", description: "Trilhas de aprendizagem" },
    { icon: FileText, label: "Exercícios", path: "/student-exercises", color: "bg-orange-600", description: "Pratique e aprenda" },
    { icon: Lightbulb, label: "Revisão", path: "/student-review", color: "bg-accent", description: "Revisão inteligente" },
    { icon: BarChart3, label: "Estatísticas", path: "/student-stats", color: "bg-success", description: "Seu desempenho" },
  ];

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header de Boas-vindas */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    Olá, {student?.fullName?.split(' ')[0] || 'Aluno'}!
                  </h1>
                  <p className="text-primary-foreground/80 mt-1">
                    Bem-vindo ao seu portal de estudos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.path} href={action.path}>
                <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/50">
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{action.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium">Carregando...</p>
          </div>
        ) : (
          <>
            {/* Minhas Disciplinas */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-xl">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Minhas Disciplinas</h2>
                    <p className="text-sm text-gray-500">
                      {activeSubjects.length} disciplina{activeSubjects.length !== 1 ? 's' : ''} em andamento
                    </p>
                  </div>
                </div>
                {activeSubjects.length > 0 && (
                  <Link href="/student-subjects">
                    <Button variant="default" className="gap-2 bg-primary hover:bg-primary/90 text-white">
                      Ver Todas
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>

              {activeSubjects.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-300">
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Nenhuma disciplina ativa
                    </h3>
                    <p className="text-gray-600">
                      Entre em contato com seu professor para se matricular
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeSubjects.slice(0, 6).map((enrollment: any) => (
                    <Card 
                      key={enrollment.id} 
                      className="hover:shadow-lg transition-all border hover:border-primary/50"
                    >
                      <div 
                        className="h-1" 
                        style={{ backgroundColor: enrollment.subject?.color || '#3B82F6' }}
                      />
                      
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                              {enrollment.subject?.name || 'Disciplina'}
                            </CardTitle>
                            <p className="text-sm text-gray-500 font-mono">
                              {enrollment.subject?.code || ''}
                            </p>
                          </div>
                          <Badge className="bg-success/20 text-success border-success/30">
                            Ativa
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center text-gray-600 text-sm">
                            <GraduationCap className="w-4 h-4 mr-2 text-primary" />
                            Prof: {enrollment.professor?.name || 'N/A'}
                          </div>
                          
                          {enrollment.subject?.description && (
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {enrollment.subject.description}
                            </p>
                          )}

                          <div className="text-xs text-gray-500 flex items-center gap-1 pt-2 border-t">
                            <Clock className="w-3 h-3" />
                            Matriculado em: {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR') : 'N/A'}
                          </div>

                          <Link href={`/student/subject-details/${enrollment.subjectId}/${enrollment.userId}`}>
                            <Button className="w-full mt-2 bg-primary hover:bg-primary/90">
                              Ver Detalhes
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Resumo de Progresso */}
            {completedSubjects.length > 0 && (
              <div className="mb-10">
                <Card className="bg-success/10 border-success/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-success/20 rounded-xl">
                        <GraduationCap className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Disciplinas Concluídas</h3>
                        <p className="text-gray-600">
                          Você completou <span className="font-bold text-success">{completedSubjects.length}</span> disciplina{completedSubjects.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}
