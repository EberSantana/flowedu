import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Belt3D } from './Belt3D';
import { GamifiedProgressBar } from './GamifiedProgressBar';
import { LevelUpModal } from './LevelUpModal';
import { trpc } from '@/lib/trpc';
import { Trophy, Zap, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Gamification3DCardProps {
  studentId: number;
  className?: string;
}

export function Gamification3DCard({ studentId, className }: Gamification3DCardProps) {
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<any>(null);

  // Buscar dados de gamificação
  const { data: stats, isLoading } = trpc.gamification3D.getStudentStats.useQuery(
    { studentId },
    {
      refetchInterval: 30000, // Atualizar a cada 30 segundos
    }
  );

  const { data: levelUpHistory } = trpc.gamification3D.getLevelUpHistory.useQuery(
    { studentId }
  );

  // Verificar se há level up não visto
  useEffect(() => {
    if (levelUpHistory && levelUpHistory.length > 0) {
      const latestLevelUp = levelUpHistory[0];
      if (!latestLevelUp.levelUp.celebrationSeen) {
        setLevelUpData({
          oldBelt: latestLevelUp.fromBelt,
          newBelt: latestLevelUp.toBelt,
          totalPoints: latestLevelUp.levelUp.pointsAtLevelUp
        });
        setShowLevelUpModal(true);
      }
    }
  }, [levelUpHistory]);

  const markLevelUpSeenMutation = trpc.gamification3D.markLevelUpSeen.useMutation();

  const handleCloseLevelUpModal = async () => {
    setShowLevelUpModal(false);
    if (levelUpData && levelUpHistory && levelUpHistory.length > 0) {
      // Marcar como visto
      await markLevelUpSeenMutation.mutateAsync({
        levelUpId: levelUpHistory[0].levelUp.id
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Sua Jornada de Aprendizado
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || !stats.currentBelt) {
    return null;
  }

  const { currentBelt, nextBelt, progress, pointsToNextBelt, progressPercentage } = stats;

  return (
    <>
      {/* Modal de Level Up */}
      {levelUpData && (
        <LevelUpModal
          isOpen={showLevelUpModal}
          onClose={handleCloseLevelUpModal}
          oldBelt={levelUpData.oldBelt}
          newBelt={levelUpData.newBelt}
          totalPoints={levelUpData.totalPoints}
        />
      )}

      <Card className={cn('overflow-hidden border-2 shadow-xl', className)}
        style={{
          borderColor: `${currentBelt.color}44`,
          background: `linear-gradient(135deg, ${currentBelt.color}05 0%, transparent 100%)`
        }}
      >
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: currentBelt.color }} />
              Sua Jornada de Aprendizado
            </span>
            {progress.pointsMultiplier > 1.0 && (
              <span 
                className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse"
                title="Multiplicador ativo"
              >
                <Zap className="w-4 h-4" />
                ×{progress.pointsMultiplier.toFixed(1)}
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Faixa 3D Central */}
          <div className="flex justify-center py-4">
            <Belt3D
              beltName={currentBelt.name}
              beltColor={currentBelt.color}
              beltLevel={currentBelt.level}
              beltIcon={currentBelt.icon || '🥋'}
              displayName={currentBelt.displayName}
              size="lg"
              animated={true}
              interactive={true}
            />
          </div>

          {/* Barra de Progresso */}
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

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {progress.totalExercisesCompleted}
              </div>
              <div className="text-xs text-muted-foreground">Exercícios</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {progress.totalPerfectScores}
              </div>
              <div className="text-xs text-muted-foreground">100% Acertos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {progress.streakDays}
              </div>
              <div className="text-xs text-muted-foreground">Dias Seguidos</div>
            </div>
          </div>

          {/* Conquistas Recentes */}
          {stats.achievements && stats.achievements.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">
                  Conquistas Desbloqueadas ({stats.totalAchievements})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.achievements.slice(0, 6).map((achievement: any) => (
                  <div
                    key={achievement.id}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center gap-1.5"
                    title={achievement.description}
                  >
                    <span>{achievement.icon}</span>
                    <span>{achievement.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
