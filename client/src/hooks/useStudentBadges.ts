import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';

export type BadgeType = 'velocista' | 'perfeccionista' | 'mestre' | 'dedicado';

interface Badge {
  type: BadgeType;
  label: string;
}

export function useStudentBadges(studentId?: number): Badge[] {
  const { data: stats } = trpc.gamification.getStudentStats.useQuery(undefined, {
    enabled: !!studentId,
  });

  // Especialização não é necessária para cálculo de badges

  const badges = useMemo(() => {
    const earnedBadges: Badge[] = [];

    if (!stats) return earnedBadges;

    // Badge Dedicado: streak de 30 dias ou mais
    const streak = stats.streakDays || 0;
    if (streak >= 30) {
      earnedBadges.push({
        type: 'dedicado',
        label: `Dedicado - ${streak} dias de streak`,
      });
    }

    // Badge Mestre: pontos acima de 3600 (faixa preta)
    const totalPoints = stats.totalPoints || 0;
    if (totalPoints >= 3600) {
      earnedBadges.push({
        type: 'mestre',
        label: 'Mestre - Faixa Preta conquistada',
      });
    }

    // Badge Perfeccionista: rank no top 10
    const rank = stats.rank || 0;
    if (rank > 0 && rank <= 10) {
      earnedBadges.push({
        type: 'perfeccionista',
        label: `Perfeccionista - Top ${rank} no ranking`,
      });
    }

    // Badge Velocista: mais de 1000 pontos
    if (totalPoints >= 1000) {
      earnedBadges.push({
        type: 'velocista',
        label: 'Velocista - Mais de 1000 pontos',
      });
    }

    return earnedBadges;
  }, [stats]);

  return badges;
}
