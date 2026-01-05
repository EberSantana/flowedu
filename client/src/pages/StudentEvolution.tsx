import { useState } from 'react';
import StudentLayout from '../components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Belt3D } from '@/components/Belt3D';
import { GamifiedProgressBar } from '@/components/GamifiedProgressBar';
import { trpc } from '@/lib/trpc';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Zap, 
  Calendar,
  Award,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function StudentEvolution() {
  const { student } = useStudentAuth();
  const [selectedBelt, setSelectedBelt] = useState<number | null>(null);

  const { data: stats, isLoading } = trpc.gamification3D.getStudentStats.useQuery(
    { studentId: student?.id || 0 },
    { enabled: !!student?.id }
  );

  const { data: allBelts } = trpc.gamification3D.getAllBelts.useQuery();
  const { data: levelUpHistory } = trpc.gamification3D.getLevelUpHistory.useQuery(
    { studentId: student?.id || 0 },
    { enabled: !!student?.id }
  );
  const { data: achievements } = trpc.gamification3D.getStudentAchievements.useQuery(
    { studentId: student?.id || 0 },
    { enabled: !!student?.id }
  );

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium text-lg">Carregando sua evolução...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!stats || !allBelts) {
    return (
      <StudentLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground">Dados não disponíveis</p>
        </div>
      </StudentLayout>
    );
  }

  const { currentBelt, nextBelt, progress, pointsToNextBelt, progressPercentage } = stats;

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Minha Evolução</h1>
            <p className="text-muted-foreground">Acompanhe sua jornada de aprendizado</p>
          </div>
        </div>

        {/* Card de Progresso Atual */}
        <Card className="border-2 shadow-xl" style={{
          borderColor: `${currentBelt.color}44`,
          background: `linear-gradient(135deg, ${currentBelt.color}05 0%, transparent 100%)`
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: currentBelt.color }} />
              Progresso Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <Belt3D
                beltName={currentBelt.name}
                beltColor={currentBelt.color}
                beltLevel={currentBelt.level}
                beltIcon={currentBelt.icon || '🥋'}
                displayName={currentBelt.displayName}
                size="xl"
                animated={true}
                interactive={true}
              />
            </div>

            <GamifiedProgressBar
              currentPoints={progress.totalPoints}
              pointsToNextLevel={pointsToNextBelt}
              currentBeltColor={currentBelt.color}
              nextBeltColor={nextBelt?.color}
              currentBeltName={currentBelt.displayName}
              nextBeltName={nextBelt?.displayName}
              percentage={progressPercentage}
              multiplier={progress.pointsMultiplier}
              animated={true}
              showStats={true}
            />

            {/* Estatísticas Detalhadas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10">
                <div className="text-3xl font-bold text-foreground">
                  {progress.totalExercisesCompleted}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Exercícios Completos</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10">
                <div className="text-3xl font-bold text-foreground">
                  {progress.totalPerfectScores}
                </div>
                <div className="text-sm text-muted-foreground mt-1">100% Acertos</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/10">
                <div className="text-3xl font-bold text-foreground">
                  {progress.streakDays}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Dias Seguidos</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10">
                <div className="text-3xl font-bold text-foreground">
                  {progress.averageAccuracy.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground mt-1">Precisão Média</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Linha do Tempo de Faixas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Linha do Tempo de Faixas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {allBelts.map((belt) => {
                const isUnlocked = belt.level <= currentBelt.level;
                const isCurrent = belt.level === currentBelt.level;
                const isNext = belt.level === currentBelt.level + 1;

                return (
                  <div
                    key={belt.id}
                    className={cn(
                      'relative cursor-pointer transition-all duration-300',
                      isUnlocked && 'hover:scale-105',
                      !isUnlocked && 'opacity-40 cursor-not-allowed'
                    )}
                    onClick={() => isUnlocked && setSelectedBelt(belt.id)}
                  >
                    {/* Badge de status */}
                    {isCurrent && (
                      <div className="absolute -top-2 -right-2 z-10 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                        Atual
                      </div>
                    )}
                    {isNext && !isCurrent && (
                      <div className="absolute -top-2 -right-2 z-10 px-2 py-1 bg-gradient-to-r from-blue-400 to-purple-500 text-white text-xs font-bold rounded-full shadow-lg">
                        Próxima
                      </div>
                    )}

                    {/* Faixa */}
                    <div className={cn(
                      'relative',
                      isCurrent && 'ring-4 ring-offset-2 rounded-2xl',
                      !isUnlocked && 'grayscale'
                    )} style={isCurrent ? { boxShadow: `0 0 0 4px ${belt.color}` } : {}}>
                      <Belt3D
                        beltName={belt.name}
                        beltColor={belt.color}
                        beltLevel={belt.level}
                        beltIcon={belt.icon || '🥋'}
                        displayName={belt.displayName}
                        size="md"
                        animated={isCurrent}
                        interactive={isUnlocked}
                      />
                    </div>

                    {/* Cadeado para faixas bloqueadas */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="p-3 bg-black/60 rounded-full backdrop-blur-sm">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Pontos necessários */}
                    <div className="mt-2 text-center text-xs text-muted-foreground">
                      {belt.pointsRequired.toLocaleString()} pts
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Level Ups */}
        {levelUpHistory && levelUpHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Histórico de Evoluções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {levelUpHistory.map((history) => (
                  <div
                    key={history.levelUp.id}
                    className="flex items-center gap-4 p-4 rounded-lg border-2 bg-gradient-to-r from-purple-500/5 to-pink-500/5 border-purple-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: history.fromBelt.color }}
                      />
                      <span className="text-sm font-medium">{history.fromBelt.displayName}</span>
                    </div>
                    <div className="text-2xl">→</div>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: history.toBelt.color }}
                      />
                      <span className="text-sm font-medium">{history.toBelt.displayName}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{history.levelUp.pointsAtLevelUp.toLocaleString()} pts</span>
                      <span>
                        {format(new Date(history.levelUp.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conquistas */}
        {achievements && achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Conquistas Desbloqueadas ({achievements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((item) => (
                  <div
                    key={item.studentAchievement.id}
                    className="p-4 rounded-lg border-2 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{item.achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground">{item.achievement.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.achievement.description}
                        </p>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {format(new Date(item.studentAchievement.unlockedAt), "dd/MM/yyyy")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}
