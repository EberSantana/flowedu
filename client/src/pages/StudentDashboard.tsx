import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Clock, 
  GraduationCap, 
  AlertCircle, 
  FileText,
  Map,
  Bell,
  User,
  BarChart3,
  CheckCircle
} from "lucide-react";
import StudentLayout from '../components/StudentLayout';
import { Link } from "wouter";
import { useStudentAuth } from "@/hooks/useStudentAuth";

export default function StudentDashboard() {
  const { student } = useStudentAuth();
  const { data: enrolledSubjects, isLoading } = trpc.student.getEnrolledSubjects.useQuery();

  const activeSubjects = enrolledSubjects?.filter(e => e.status === 'active') || [];
  const completedSubjects = enrolledSubjects?.filter(e => e.status === 'completed') || [];

  // Ações rápidas profissionais (Revisão removida conforme solicitado)
  const quickActions = [
    { icon: BookOpen, label: "Disciplinas", path: "/student-subjects", color: "bg-primary", description: "Acesse suas disciplinas" },
    { icon: Map, label: "Trilhas", path: "/student-learning-paths", color: "bg-purple-600", description: "Trilhas de aprendizagem" },
    { icon: FileText, label: "Exercícios", path: "/student-exercises", color: "bg-orange-600", description: "Pratique e aprenda" },
    { icon: BarChart3, label: "Estatísticas", path: "/student/statistics", color: "bg-success", description: "Seu desempenho" },
  ];

  return (
    <StudentLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Banner de Boas-vindas */}
        <div className="mb-8 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900">
          <div className="px-6 py-6 sm:px-8 sm:py-7">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Esquerda: Avatar + Saudação */}
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-lg shrink-0">
                  <span className="text-white text-2xl font-bold">
                    {student?.fullName?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                    Olá, {student?.fullName?.split(' ')[0] || 'Aluno'}!
                  </h1>
                  <p className="text-blue-200 mt-1 text-base">
                    Bem-vindo ao seu portal de estudos
                  </p>
                  {/* Badges de disciplinas */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-sm font-medium px-3 py-1 rounded-full border border-white/20">
                      <BookOpen className="h-3.5 w-3.5" />
                      {activeSubjects.length} Disciplinas ativas
                    </span>
                    {completedSubjects.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-sm font-medium px-3 py-1 rounded-full border border-white/20">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {completedSubjects.length} Concluídas
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Direita: Data */}
              <div className="text-right shrink-0">
                <p className="text-white/70 text-sm">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          </div>
          {/* Faixa inferior com frase motivacional */}
          <div className="bg-black/20 px-6 sm:px-8 py-3 border-t border-white/10">
            <p className="text-blue-200 text-sm italic">
              {(() => {
                const quotes = [
                  '"O sucesso é a soma de pequenos esforços repetidos dia após dia." — Robert Collier',
                  '"Aprender é a única coisa que a mente nunca se cansa, nunca tem medo e nunca se arrepende." — Leonardo da Vinci',
                  '"Cada dia é uma nova oportunidade para aprender algo novo." — Anônimo',
                  '"O conhecimento é o único bem que cresce quando é compartilhado." — Anônimo',
                  '"Grandes conquistas exigem grandes sacrifícios." — Anônimo',
                  '"Invista em conhecimento. Ele sempre paga os melhores juros." — Benjamin Franklin',
                  '"A educação é o passaporte para o futuro." — Malcolm X',
                ];
                const idx = new Date().getDay() % quotes.length;
                return quotes[idx];
              })()}
            </p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:grid-cols-4">
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
                    <p className="text-muted-foreground">
                      Entre em contato com seu professor para se matricular
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeSubjects.slice(0, 6).map((enrollment: any) => {
                    const progressPercentage = enrollment.progress?.progressPercentage || 0;
                    const completedTopics = enrollment.progress?.completedTopics || 0;
                    const totalTopics = enrollment.progress?.totalTopics || 0;
                    
                    return (
                        <Card key={enrollment.id} className="transition-all border">
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

                              {/* Barra de Progresso */}
                              <div className="pt-3 border-t">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">Progresso</span>
                                  <span className="text-sm font-bold" style={{ color: enrollment.subject?.color || '#3B82F6' }}>
                                    {progressPercentage}%
                                  </span>
                                </div>
                                <Progress 
                                  value={progressPercentage} 
                                  className="h-2"
                                  style={{ 
                                    backgroundColor: `${enrollment.subject?.color || '#3B82F6'}20`
                                  }}
                                />
                                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-success" />
                                    {completedTopics} de {totalTopics} tópicos
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    );
                  })}
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
                        <p className="text-muted-foreground">
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
