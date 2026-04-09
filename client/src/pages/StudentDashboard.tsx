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
  CheckCircle,
  CalendarClock,
  ClipboardList,
  PenTool,
  FileCheck
} from "lucide-react";
import StudentLayout from '../components/StudentLayout';
import { Link } from "wouter";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { useStudentGreeting } from "@/hooks/useMotivationalGreeting";
import { MotivationalBanner } from "@/components/MotivationalBanner";

export default function StudentDashboard() {
  const { student } = useStudentAuth();
  const { data: enrolledSubjects, isLoading } = trpc.student.getEnrolledSubjects.useQuery();
  
  // Dados para mensagem motivacional dinâmica
  const { data: pendingExercisesData } = trpc.studentExercises.getPendingCount.useQuery();
  const { data: unreadAnnouncementsData } = trpc.announcements.getUnreadCount.useQuery();
  const { data: unseenAnswersData } = trpc.studentDoubts.getUnseenAnswersCount.useQuery();
  const { data: upcomingDeadlines } = trpc.student.getUpcomingDeadlines.useQuery();

  const activeSubjects = enrolledSubjects?.filter(e => e.status === 'active') || [];
  const completedSubjects = enrolledSubjects?.filter(e => e.status === 'completed') || [];

  // Calcular progresso médio das disciplinas ativas
  const activeSubjectsForGreeting = enrolledSubjects?.filter(e => e.status === 'active') || [];
  const overallProgress = activeSubjectsForGreeting.length > 0
    ? Math.round(
        activeSubjectsForGreeting.reduce((sum, e) => {
          const prog = e.progress as any;
          const completed = prog?.completedTopics ?? 0;
          const total = prog?.totalTopics ?? 0;
          return sum + (total > 0 ? (completed / total) * 100 : 0);
        }, 0) / activeSubjectsForGreeting.length
      )
    : 0;

  // Hook de mensagem motivacional dinâmica
  const studentGreeting = useStudentGreeting({
    name: student?.fullName,
    activeSubjectsCount: activeSubjectsForGreeting.length,
    pendingExercisesCount: (pendingExercisesData as any)?.pendingCount ?? 0,
    unreadAnnouncementsCount: (unreadAnnouncementsData as any)?.count ?? 0,
    unseenAnswersCount: (unseenAnswersData as any)?.count ?? 0,
    overallProgressPercent: overallProgress,
  });

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
        {/* Banner motivacional dinâmico */}
        <MotivationalBanner
          greeting={studentGreeting}
          avatarInitial={student?.fullName?.charAt(0).toUpperCase() || 'A'}
          variant="student"
        />

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

        {/* Painel de Próximos Prazos */}
        {upcomingDeadlines && upcomingDeadlines.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500 rounded-xl">
                <CalendarClock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Próximos Prazos</h2>
                <p className="text-sm text-gray-500">{upcomingDeadlines.length} prazo{upcomingDeadlines.length !== 1 ? 's' : ''} próximo{upcomingDeadlines.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingDeadlines.slice(0, 6).map((deadline: any) => {
                const dueDate = new Date(deadline.dueDate);
                const now = new Date();
                const diffMs = dueDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                
                let urgencyColor = 'border-green-400 bg-green-50';
                let urgencyBadge = 'bg-green-100 text-green-700';
                let urgencyText = `${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
                
                if (diffDays <= 0) {
                  urgencyColor = 'border-red-400 bg-red-50';
                  urgencyBadge = 'bg-red-100 text-red-700';
                  urgencyText = diffDays === 0 ? 'Vence hoje!' : 'Atrasado';
                } else if (diffDays <= 2) {
                  urgencyColor = 'border-yellow-400 bg-yellow-50';
                  urgencyBadge = 'bg-yellow-100 text-yellow-700';
                  urgencyText = diffDays === 1 ? 'Vence amanhã' : 'Vence em 2 dias';
                }

                const typeIcon = deadline.type === 'assessment' ? PenTool 
                  : deadline.type === 'activity' ? ClipboardList 
                  : FileCheck;
                const typeLabel = deadline.type === 'assessment' ? 'Prova' 
                  : deadline.type === 'activity' ? 'Atividade' 
                  : 'Exercício';
                const TypeIcon = typeIcon;

                return (
                  <div
                    key={`${deadline.type}-${deadline.id}`}
                    className={`rounded-lg border-l-4 p-3 ${urgencyColor} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <TypeIcon className="w-4 h-4 mt-0.5 text-gray-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm line-clamp-1">{deadline.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {typeLabel} {deadline.subjectName ? `• ${deadline.subjectName}` : ''}
                          </p>
                        </div>
                      </div>
                      {deadline.submitted && (
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às {dueDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${urgencyBadge}`}>
                        {urgencyText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
