import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Clock, 
  GraduationCap, 
  AlertCircle, 
  Trophy,
  FileText,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Palette
} from "lucide-react";
import StudentLayout from '../components/StudentLayout';
import { Link } from "wouter";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { KarateAvatar, type BeltColor } from "@/components/KarateAvatar";
import { BeltUpgradeNotification } from "@/components/BeltUpgradeNotification";
import { useBeltUpgradeNotification } from "@/hooks/useBeltUpgradeNotification";

// Função helper para determinar a faixa baseada nos pontos
function getBeltFromPoints(points: number): BeltColor {
  if (points >= 2000) return 'black';      // Faixa Preta: 2000+
  if (points >= 1600) return 'brown';      // Faixa Marrom: 1600-1999
  if (points >= 1200) return 'purple';     // Faixa Roxa: 1200-1599
  if (points >= 900) return 'blue';        // Faixa Azul: 900-1199
  if (points >= 600) return 'green';       // Faixa Verde: 600-899
  if (points >= 400) return 'orange';      // Faixa Laranja: 400-599
  if (points >= 200) return 'yellow';      // Faixa Amarela: 200-399
  return 'white';                          // Faixa Branca: 0-199
}

// Função helper para calcular pontos para próxima faixa
function getNextBeltThreshold(points: number): number {
  if (points >= 2000) return 2000; // Já é faixa preta (máximo)
  if (points >= 1600) return 2000;
  if (points >= 1200) return 1600;
  if (points >= 900) return 1200;
  if (points >= 600) return 900;
  if (points >= 400) return 600;
  if (points >= 200) return 400;
  return 200; // Próxima faixa é amarela
}

export default function StudentDashboard() {
  const { student } = useStudentAuth();
  const { data: enrolledSubjects, isLoading } = trpc.student.getEnrolledSubjects.useQuery();
  const { data: stats } = trpc.gamification.getStudentStats.useQuery();
  
  // Buscar pontos do aluno do sistema de gamificação
  const studentPoints = stats?.totalPoints || 0;
  const currentBelt = (stats?.currentBelt as BeltColor) || getBeltFromPoints(studentPoints);
  const nextThreshold = getNextBeltThreshold(studentPoints);
  const progressPercentage = (studentPoints / nextThreshold) * 100;

  // Hook para detectar e exibir notificação de upgrade de faixa
  const { upgradeData, clearNotification } = useBeltUpgradeNotification(currentBelt, studentPoints);

  const activeSubjects = enrolledSubjects?.filter(e => e.status === 'active') || [];
  const completedSubjects = enrolledSubjects?.filter(e => e.status === 'completed') || [];

  return (
    <>
      {/* Notificação de Upgrade de Faixa */}
      {upgradeData && (
        <BeltUpgradeNotification
          oldBelt={upgradeData.oldBelt}
          newBelt={upgradeData.newBelt}
          totalPoints={upgradeData.totalPoints}
          onClose={clearNotification}
        />
      )}

      <StudentLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header com Boas-vindas e Avatar de Karatê */}
        <div className="mb-10">
          <div className="flex items-start gap-6 mb-6">
            {/* Avatar de Karatê com Faixa */}
            <div className="flex-shrink-0">
              <KarateAvatar 
                belt={currentBelt} 
                size="lg" 
                showLabel 
              />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Olá, {student?.fullName?.split(' ')[0] || 'Aluno'}! 👋
                  </h1>
                  <p className="text-lg text-gray-600">
                    Bem-vindo ao seu painel de estudos. Acompanhe seu progresso e continue aprendendo!
                  </p>
                </div>
              </div>
              
              {/* Barra de Progresso de Pontos */}
              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Progresso para próxima faixa
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {studentPoints} / {nextThreshold} pontos
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Continue completando exercícios e atividades para evoluir sua faixa!
                </p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-6 text-gray-600 font-medium text-lg">Carregando suas disciplinas...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Disciplinas Ativas
                  </CardTitle>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {activeSubjects.length}
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    em andamento
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Concluídas
                  </CardTitle>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold text-green-600 mb-2">
                    {completedSubjects.length}
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    disciplinas finalizadas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Total de Disciplinas
                  </CardTitle>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <GraduationCap className="h-6 w-6 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold text-purple-600 mb-2">
                    {enrolledSubjects?.length || 0}
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    no histórico
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Ações Rápidas */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <TrendingUp className="w-7 h-7 text-blue-600" />
                Ações Rápidas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Link href="/student-exercises">
                  <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-300 bg-gradient-to-br from-orange-50 to-white group">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <FileText className="w-8 h-8 text-orange-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">Exercícios</h3>
                      <p className="text-sm text-gray-600">Resolver atividades</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/student-leaderboard">
                  <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-yellow-300 bg-gradient-to-br from-yellow-50 to-white group">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Trophy className="w-8 h-8 text-yellow-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">Rankings</h3>
                      <p className="text-sm text-gray-600">Ver classificação</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/student-learning-paths">
                  <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-300 bg-gradient-to-br from-purple-50 to-white group">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">Trilhas</h3>
                      <p className="text-sm text-gray-600">Acompanhar progresso</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/student-subjects">
                  <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-white group">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">Disciplinas</h3>
                      <p className="text-sm text-gray-600">Ver todas</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/student/customize-avatar">
                  <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-pink-300 bg-gradient-to-br from-pink-50 to-white group">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Palette className="w-8 h-8 text-pink-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">Personalizar</h3>
                      <p className="text-sm text-gray-600">Customizar avatar</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>

            {/* Minhas Disciplinas */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <BookOpen className="w-7 h-7 text-blue-600" />
                  Minhas Disciplinas Ativas
                </h2>
                {activeSubjects.length > 0 && (
                  <Link href="/student-subjects">
                    <Button variant="outline" className="gap-2 font-semibold">
                      Ver Todas
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>

              {activeSubjects.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-300">
                  <CardContent className="py-20 text-center">
                    <div className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <AlertCircle className="w-14 h-14 text-gray-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      Nenhuma disciplina ativa
                    </h3>
                    <p className="text-gray-600 text-lg mb-3">
                      Você não está matriculado em nenhuma disciplina
                    </p>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Entre em contato com seu professor para se matricular e começar seus estudos
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeSubjects.slice(0, 6).map((enrollment: any) => (
                    <Card 
                      key={enrollment.id} 
                      className="hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-300 group"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <CardTitle className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                              {enrollment.subject?.name || 'Disciplina'}
                            </CardTitle>
                            <p className="text-sm text-gray-500 font-mono font-semibold">
                              {enrollment.subject?.code || ''}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 font-semibold">
                            Ativa
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                            <GraduationCap className="w-5 h-5 mr-3 text-blue-600 flex-shrink-0" />
                            <span className="text-sm font-medium truncate">
                              Prof: {enrollment.professor?.name || 'N/A'}
                            </span>
                          </div>
                          
                          {enrollment.subject?.description && (
                            <p className="text-gray-600 text-sm line-clamp-3 min-h-[3.75rem]">
                              {enrollment.subject.description}
                            </p>
                          )}

                          <div className="pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500 flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" />
                              Matriculado em: {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR') : 'N/A'}
                            </p>
                          </div>

                          <Link href={`/student/subject-details/${enrollment.subjectId}/${enrollment.userId}`}>
                            <Button className="w-full mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold group-hover:shadow-lg transition-all">
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

            {/* Disciplinas Concluídas */}
            {completedSubjects.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                  Disciplinas Concluídas
                </h2>
                <Card className="bg-gradient-to-br from-green-50 to-white border-2 border-green-100">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {completedSubjects.map((enrollment: any) => (
                        <div
                          key={enrollment.id}
                          className="p-4 bg-white rounded-xl border border-green-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 text-base line-clamp-1">
                              {enrollment.subject?.name || 'Disciplina'}
                            </h4>
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          </div>
                          <p className="text-sm text-gray-500 font-mono">
                            {enrollment.subject?.code || ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </StudentLayout>
    </>
  );
}
