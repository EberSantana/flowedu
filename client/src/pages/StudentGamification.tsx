import { useState } from "react";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Trophy, Flame, Medal, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { KarateAvatar } from "@/components/KarateAvatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BELT_CONFIG = [
  { name: 'white', label: 'Branca', minPoints: 0, maxPoints: 200, color: '#9CA3AF', emoji: '⚪' },
  { name: 'yellow', label: 'Amarela', minPoints: 200, maxPoints: 400, color: '#FBBF24', emoji: '🟡' },
  { name: 'orange', label: 'Laranja', minPoints: 400, maxPoints: 600, color: '#F97316', emoji: '🟠' },
  { name: 'green', label: 'Verde', minPoints: 600, maxPoints: 900, color: '#10B981', emoji: '🟢' },
  { name: 'blue', label: 'Azul', minPoints: 900, maxPoints: 1200, color: '#3B82F6', emoji: '🔵' },
  { name: 'purple', label: 'Roxa', minPoints: 1200, maxPoints: 1600, color: '#8B5CF6', emoji: '🟣' },
  { name: 'brown', label: 'Marrom', minPoints: 1600, maxPoints: 2000, color: '#92400E', emoji: '🟤' },
  { name: 'black', label: 'Preta', minPoints: 2000, maxPoints: 999999, color: '#1F2937', emoji: '⚫' },
];

export default function StudentGamification() {
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  const { data: stats, isLoading: statsLoading } = trpc.gamification.getStudentStats.useQuery();
  const { data: badges, isLoading: badgesLoading } = trpc.gamification.getStudentBadges.useQuery();
  const { data: ranking, isLoading: rankingLoading } = trpc.gamification.getClassRanking.useQuery({ limit: 10 });

  if (statsLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando sua jornada...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const currentBelt = BELT_CONFIG.find((b: any) => b.name === stats?.currentBelt) || BELT_CONFIG[0];
  const nextBelt = BELT_CONFIG[BELT_CONFIG.indexOf(currentBelt) + 1];
  const progressToNext = nextBelt 
    ? ((stats?.totalPoints || 0) - currentBelt.minPoints) / (nextBelt.minPoints - currentBelt.minPoints) * 100
    : 100;

  // Encontrar posição do aluno no ranking
  const myPosition = ranking?.findIndex(r => r.studentId === stats?.studentId) ?? -1;
  const myRank = myPosition !== -1 ? myPosition + 1 : null;

  // Top 3 alunos
  const topThree = ranking?.slice(0, 3) || [];

  // Filtrar apenas badges conquistados
  const earnedBadges = badges?.earned || [];

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Minha Jornada 🥋</h1>
          <p className="text-gray-600 mt-2">Acompanhe seu progresso e conquistas</p>
        </div>

        {/* Card Principal Unificado */}
        <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <KarateAvatar 
                  belt={(stats?.currentBelt as any) || 'white'}
                  size="xl"
                  skinTone={stats?.avatarSkinTone as any}
                  kimonoColor={stats?.avatarKimonoColor as any}
                  hairStyle={stats?.avatarHairStyle as any}
                />
              </div>

              {/* Informações */}
              <div className="flex-1 w-full space-y-6">
                {/* Faixa e Pontos */}
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <span className="text-5xl">{currentBelt.emoji}</span>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">Faixa {currentBelt.label}</h2>
                      <p className="text-gray-600">
                        <span className="text-2xl font-bold text-blue-600">{stats?.totalPoints || 0}</span> pontos
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progresso para Próxima Faixa */}
                {nextBelt && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progresso para Faixa {nextBelt.label}</span>
                      <span className="font-semibold text-gray-900">
                        {stats?.totalPoints || 0} / {nextBelt.minPoints} pts
                      </span>
                    </div>
                    <Progress value={progressToNext} className="h-3" />
                    <p className="text-xs text-gray-500 text-right">
                      Faltam {nextBelt.minPoints - (stats?.totalPoints || 0)} pontos
                    </p>
                  </div>
                )}

                {nextBelt === undefined && (
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-yellow-800 font-semibold">🎉 Parabéns! Você alcançou a Faixa Preta!</p>
                  </div>
                )}

                {/* Sequência de Dias */}
                <div className="flex items-center justify-center md:justify-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <Flame className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Sequência Atual</p>
                    <p className="text-2xl font-bold text-orange-600">{stats?.streakDays || 0} dias</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Minhas Conquistas */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <h2 className="text-2xl font-bold text-gray-900">Minhas Conquistas</h2>
            <Badge variant="secondary" className="ml-auto">
              {earnedBadges.length} {earnedBadges.length === 1 ? 'conquista' : 'conquistas'}
            </Badge>
          </div>

          {badgesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : earnedBadges.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Você ainda não conquistou nenhum badge.</p>
                <p className="text-sm text-gray-400 mt-1">Continue praticando para desbloquear conquistas!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {earnedBadges.map((badge: any) => (
                <Card 
                  key={badge.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white"
                  onClick={() => setSelectedBadge(badge)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl mb-3">{badge.icon}</div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{badge.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{badge.description}</p>
                    {badge.earnedAt && (
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(badge.earnedAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Minha Posição no Ranking */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Medal className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Minha Posição</h2>
          </div>

          {rankingLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Posição do Aluno */}
              {myRank && (
                <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold text-purple-600">#{myRank}</div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">Sua posição na turma</p>
                          <p className="text-sm text-gray-600">
                            {stats?.totalPoints || 0} pontos • Faixa {currentBelt.label}
                          </p>
                        </div>
                      </div>
                      <Trophy className="h-12 w-12 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top 3 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Medal className="h-5 w-5 text-yellow-600" />
                    Top 3 da Turma
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topThree.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Nenhum aluno no ranking ainda.</p>
                  ) : (
                    <div className="space-y-3">
                      {topThree.map((student, index) => {
                        const medalColors = ['text-yellow-500', 'text-gray-400', 'text-orange-600'];
                        const medalEmojis = ['🥇', '🥈', '🥉'];
                        const studentBelt = BELT_CONFIG.find(b => b.name === student.currentBelt) || BELT_CONFIG[0];

                        return (
                          <div 
                            key={student.studentId}
                            className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                              myRank === index + 1 
                                ? 'bg-blue-50 border-blue-300' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className={`text-3xl ${medalColors[index]}`}>
                              {medalEmojis[index]}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {student.studentName}
                                {myRank === index + 1 && (
                                  <Badge variant="secondary" className="ml-2">Você</Badge>
                                )}
                              </p>
                              <p className="text-sm text-gray-600">
                                {student.totalPoints} pontos • Faixa {studentBelt.label} {studentBelt.emoji}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {ranking && ranking.length > 3 && (
                    <div className="mt-4 pt-4 border-t">
                      <button 
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mx-auto"
                        onClick={() => {
                          // Futura implementação: abrir modal com ranking completo
                          alert('Ranking completo em breve!');
                        }}
                      >
                        <Info className="h-4 w-4" />
                        Ver ranking completo ({ranking.length} alunos)
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Badge */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-4xl">{selectedBadge?.icon}</span>
              {selectedBadge?.name}
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <p className="text-base text-gray-700">{selectedBadge?.description}</p>
              {selectedBadge?.earnedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
                  <Trophy className="h-4 w-4 text-green-600" />
                  <span>
                    Conquistado em {new Date(selectedBadge.earnedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}
