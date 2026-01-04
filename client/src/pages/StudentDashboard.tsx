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
  CheckCircle
} from "lucide-react";
import StudentLayout from '../components/StudentLayout';
import { Link } from "wouter";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { type BeltColor } from "@/components/KarateAvatarPro";
import { BeltUpgradeNotification } from "@/components/BeltUpgradeNotification";
import { useBeltUpgradeNotification } from "@/hooks/useBeltUpgradeNotification";

// Novos componentes profissionais
import { StudentDashboardHeader } from "@/components/StudentDashboardHeader";
import { StudentDashboardHeaderKimono } from "@/components/StudentDashboardHeaderKimono";
import { GamifiedStatsCards } from "@/components/GamifiedStatsCards";
import { QuickActionsGrid } from "@/components/QuickActionsGrid";
import { NextGoalsSection } from "@/components/NextGoalsSection";
import { StudentAlerts } from "@/components/StudentAlerts";

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

  // Hook para detectar e exibir notificação de upgrade de faixa
  const { upgradeData, clearNotification } = useBeltUpgradeNotification(currentBelt, studentPoints);

  const activeSubjects = enrolledSubjects?.filter(e => e.status === 'active') || [];
  const completedSubjects = enrolledSubjects?.filter(e => e.status === 'completed') || [];

  // Dados de customização do avatar (usar valores padrão ou do banco)
  const avatarSkinTone = (student as any)?.avatarSkinTone || 'light';
  const avatarHairStyle = (student as any)?.avatarHairStyle || 'short';
  const avatarKimonoColor = (student as any)?.avatarKimonoColor || 'white';

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
          {/* Alertas Importantes */}
          <div className="mb-6">
            <StudentAlerts />
          </div>

          {/* Header Profissional com Avatar de Kimono */}
          <StudentDashboardHeaderKimono
            studentName={student?.fullName || 'Aluno'}
            currentBelt={currentBelt}
            totalPoints={studentPoints}
            nextBeltThreshold={nextThreshold}
            streak={0}
          />

          {isLoading ? (
            <div className="text-center py-20">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-600 font-medium text-lg">Carregando seu painel...</p>
              <p className="text-gray-400 text-sm mt-2">Preparando sua experiência de aprendizado</p>
            </div>
          ) : (
            <>
              {/* Cards de Estatísticas Gamificados */}
              <GamifiedStatsCards
                activeSubjects={activeSubjects.length}
                completedSubjects={completedSubjects.length}
                totalSubjects={enrolledSubjects?.length || 0}
                totalPoints={studentPoints}
                exercisesCompleted={0}
                badges={0}
              />

              {/* Ações Rápidas */}
              <QuickActionsGrid />

              {/* Próximas Metas */}
              <NextGoalsSection
                currentBelt={currentBelt}
                totalPoints={studentPoints}
                exercisesCompleted={0}
                badgesEarned={0}
              />

              {/* Minhas Disciplinas */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Minhas Disciplinas</h2>
                      <p className="text-sm text-gray-500">
                        {activeSubjects.length} disciplina{activeSubjects.length !== 1 ? 's' : ''} em andamento
                      </p>
                    </div>
                  </div>
                  {activeSubjects.length > 0 && (
                    <Link href="/student-subjects">
                      <Button variant="outline" className="gap-2 font-semibold hover:bg-blue-50">
                        Ver Todas
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>

                {activeSubjects.length === 0 ? (
                  <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white">
                    <CardContent className="py-16 text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <AlertCircle className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Nenhuma disciplina ativa
                      </h3>
                      <p className="text-gray-600 text-lg mb-2">
                        Você não está matriculado em nenhuma disciplina
                      </p>
                      <p className="text-sm text-gray-500 max-w-md mx-auto">
                        Entre em contato com seu professor para se matricular e começar seus estudos
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeSubjects.slice(0, 6).map((enrollment: any, index: number) => (
                      <Card 
                        key={enrollment.id} 
                        className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-300 overflow-hidden"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Barra de cor no topo */}
                        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                        
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <CardTitle className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {enrollment.subject?.name || 'Disciplina'}
                              </CardTitle>
                              <p className="text-sm text-gray-500 font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded inline-block">
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
                            <div className="flex items-center text-gray-700 bg-gradient-to-r from-gray-50 to-white p-3 rounded-xl border border-gray-100">
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

                            <div className="pt-4 border-t border-gray-100">
                              <p className="text-xs text-gray-500 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                Matriculado em: {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR') : 'N/A'}
                              </p>
                            </div>

                            <Link href={`/student/subject-details/${enrollment.subjectId}/${enrollment.userId}`}>
                              <Button className="w-full mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold group-hover:shadow-lg transition-all">
                                Ver Detalhes
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Disciplinas Concluídas</h2>
                      <p className="text-sm text-gray-500">
                        {completedSubjects.length} disciplina{completedSubjects.length !== 1 ? 's' : ''} finalizada{completedSubjects.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {completedSubjects.map((enrollment: any) => (
                          <div
                            key={enrollment.id}
                            className="p-4 bg-white rounded-xl border border-green-200 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
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
