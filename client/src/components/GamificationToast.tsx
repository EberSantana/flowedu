import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Award, Target, Flame, TrendingUp, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface GamificationToastProps {
  type: 'points' | 'level_up' | 'streak' | 'achievement' | 'perfect_score' | 'multiplier';
  title: string;
  description: string;
  points?: number;
  icon?: React.ReactNode;
}

const TOAST_ICONS = {
  points: <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />,
  level_up: <Trophy className="w-6 h-6 text-orange-500" />,
  streak: <Flame className="w-6 h-6 text-red-500" />,
  achievement: <Award className="w-6 h-6 text-purple-500" />,
  perfect_score: <Target className="w-6 h-6 text-green-500" />,
  multiplier: <Zap className="w-6 h-6 text-blue-500" />,
};

const TOAST_COLORS = {
  points: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
  level_up: 'from-orange-500/20 to-red-600/20 border-orange-500/30',
  streak: 'from-red-500/20 to-orange-600/20 border-red-500/30',
  achievement: 'from-purple-500/20 to-pink-600/20 border-purple-500/30',
  perfect_score: 'from-green-500/20 to-emerald-600/20 border-green-500/30',
  multiplier: 'from-blue-500/20 to-cyan-600/20 border-blue-500/30',
};

export function showGamificationToast({
  type,
  title,
  description,
  points,
  icon,
}: GamificationToastProps) {
  const toastIcon = icon || TOAST_ICONS[type];
  const colorClass = TOAST_COLORS[type];

  toast.custom(
    (t: any) => (
      <AnimatePresence>
        {t.visible && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`relative overflow-hidden rounded-xl border-2 bg-gradient-to-br ${colorClass} backdrop-blur-sm shadow-2xl p-4 min-w-[320px] max-w-md`}
          >
            {/* Brilho de fundo animado */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Conteúdo */}
            <div className="relative flex items-start gap-4">
              {/* Ícone com animação */}
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: 3,
                  ease: 'easeInOut',
                }}
                className="flex-shrink-0"
              >
                {toastIcon}
              </motion.div>

              {/* Texto */}
              <div className="flex-1 space-y-1">
                <div className="font-bold text-lg text-foreground">{title}</div>
                <div className="text-sm text-muted-foreground">{description}</div>
                {points && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold mt-2"
                  >
                    <Star className="w-4 h-4 fill-current" />
                    +{points} pontos
                  </motion.div>
                )}
              </div>
            </div>

            {/* Partículas decorativas */}
            {type === 'level_up' && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    initial={{
                      x: '50%',
                      y: '50%',
                      opacity: 1,
                      scale: 0,
                    }}
                    animate={{
                      x: `${Math.random() * 100}%`,
                      y: `${Math.random() * 100}%`,
                      opacity: 0,
                      scale: 1,
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.1,
                      ease: 'easeOut',
                    }}
                  >
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    ),
    {
      duration: 4000,
      position: 'top-center',
    }
  );
}

// Funções auxiliares para tipos específicos de notificações
export function showPointsEarned(points: number, reason: string) {
  showGamificationToast({
    type: 'points',
    title: 'Pontos Ganhos!',
    description: reason,
    points,
  });
}

export function showLevelUp(newBelt: string, beltName: string) {
  showGamificationToast({
    type: 'level_up',
    title: '🎉 NOVA FAIXA CONQUISTADA!',
    description: `Parabéns! Você alcançou a Faixa ${beltName}!`,
    icon: <Crown className="w-6 h-6 text-yellow-500" />,
  });
}

export function showStreakBonus(days: number, bonusPoints: number) {
  showGamificationToast({
    type: 'streak',
    title: `🔥 ${days} Dias de Sequência!`,
    description: 'Continue assim! Você está em chamas!',
    points: bonusPoints,
  });
}

export function showAchievementUnlocked(name: string, description: string, points?: number) {
  showGamificationToast({
    type: 'achievement',
    title: '🏆 Conquista Desbloqueada!',
    description: `${name}: ${description}`,
    points,
  });
}

export function showPerfectScore(points: number) {
  showGamificationToast({
    type: 'perfect_score',
    title: '💯 PERFEITO!',
    description: 'Você acertou todas as questões!',
    points,
    icon: <Target className="w-6 h-6 text-green-500" />,
  });
}

export function showMultiplierBonus(multiplier: number, totalPoints: number) {
  showGamificationToast({
    type: 'multiplier',
    title: `⚡ Multiplicador ${multiplier}x Ativo!`,
    description: 'Seus pontos foram multiplicados!',
    points: totalPoints,
  });
}

// Hook para detectar mudança de faixa e mostrar animação
export function useDetectLevelUp(currentBelt: string, previousBelt: string | null) {
  useEffect(() => {
    if (previousBelt && currentBelt !== previousBelt) {
      const BELT_NAMES: Record<string, string> = {
        white: 'Branca',
        yellow: 'Amarela',
        orange: 'Laranja',
        green: 'Verde',
        blue: 'Azul',
        purple: 'Roxa',
        brown: 'Marrom',
        black: 'Preta',
      };

      showLevelUp(currentBelt, BELT_NAMES[currentBelt] || currentBelt);
    }
  }, [currentBelt, previousBelt]);
}
