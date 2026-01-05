import { useState, useEffect } from 'react';
import { Belt3DRealistic, BeltColor, BELT_COLORS } from './Belt3DRealistic';
import { cn } from '@/lib/utils';
import { TrendingUp, Sparkles, Zap } from 'lucide-react';

interface LearningJourneyCardProps {
  currentBelt: BeltColor;
  totalPoints: number;
  nextBeltThreshold: number;
  nextBeltName?: string;
  className?: string;
}

// Configuração de pontos por faixa
const BELT_THRESHOLDS: Record<BeltColor, { min: number; label: string }> = {
  white: { min: 0, label: 'Branca' },
  yellow: { min: 100, label: 'Amarela' },
  orange: { min: 250, label: 'Laranja' },
  green: { min: 500, label: 'Verde' },
  blue: { min: 1000, label: 'Azul' },
  purple: { min: 2000, label: 'Roxa' },
  brown: { min: 3500, label: 'Marrom' },
  black: { min: 5000, label: 'Preta' }
};

const BELT_ORDER: BeltColor[] = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black'];

export function LearningJourneyCard({
  currentBelt,
  totalPoints,
  nextBeltThreshold,
  nextBeltName,
  className
}: LearningJourneyCardProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [showSparkles, setShowSparkles] = useState(false);

  // Calcular progresso
  const currentBeltMin = BELT_THRESHOLDS[currentBelt].min;
  const progressPercent = currentBelt === 'black' 
    ? 100 
    : Math.min(100, ((totalPoints - currentBeltMin) / (nextBeltThreshold - currentBeltMin)) * 100);
  const pointsToNext = Math.max(0, nextBeltThreshold - totalPoints);

  // Determinar próxima faixa
  const currentIndex = BELT_ORDER.indexOf(currentBelt);
  const nextBelt = currentIndex < BELT_ORDER.length - 1 ? BELT_ORDER[currentIndex + 1] : null;
  const nextBeltConfig = nextBelt ? BELT_COLORS[nextBelt] : null;

  // Animar progresso
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercent);
    }, 300);

    // Mostrar sparkles quando progresso > 80%
    if (progressPercent >= 80) {
      setShowSparkles(true);
    }

    return () => clearTimeout(timer);
  }, [progressPercent]);

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-3xl',
        'bg-gradient-to-br from-slate-50 via-white to-slate-100',
        'border border-slate-200/50',
        'shadow-xl shadow-slate-200/50',
        className
      )}
    >
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30"
          style={{
            background: `radial-gradient(circle, ${BELT_COLORS[currentBelt].glow} 0%, transparent 70%)`
          }}
        />
        <div 
          className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, ${BELT_COLORS[currentBelt].primary}40 0%, transparent 70%)`
          }}
        />
      </div>

      <div className="relative p-8">
        {/* Título */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent italic">
            Sua Jornada de Aprendizado
          </h2>
        </div>

        {/* Faixa 3D */}
        <div className="flex justify-center mb-8">
          <Belt3DRealistic
            color={currentBelt}
            size="xl"
            animated={true}
            interactive={true}
            showLabel={true}
            showPoints={true}
            points={totalPoints}
          />
        </div>

        {/* Barra de Progresso Animada */}
        {currentBelt !== 'black' && (
          <div className="max-w-md mx-auto space-y-3">
            {/* Header do progresso */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium">Progresso</span>
              <span className="font-bold text-gray-700">{Math.round(animatedProgress)}%</span>
            </div>

            {/* Barra de progresso */}
            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              {/* Barra preenchida */}
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${animatedProgress}%`,
                  background: nextBeltConfig
                    ? `linear-gradient(90deg, ${BELT_COLORS[currentBelt].primary} 0%, ${nextBeltConfig.primary} 100%)`
                    : BELT_COLORS[currentBelt].primary,
                  boxShadow: `0 0 10px ${BELT_COLORS[currentBelt].glow}`
                }}
              >
                {/* Efeito de brilho */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  style={{
                    animation: 'shimmer 2s ease-in-out infinite'
                  }}
                />
              </div>

              {/* Sparkles quando próximo de completar */}
              {showSparkles && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                </div>
              )}
            </div>

            {/* Texto de pontos restantes */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Faltam <span className="font-bold text-gray-800">{pointsToNext}</span> pontos para{' '}
                <span 
                  className="font-bold"
                  style={{ color: nextBeltConfig?.primary || '#374151' }}
                >
                  Faixa {nextBeltName || BELT_THRESHOLDS[nextBelt || 'yellow'].label}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Mensagem de faixa preta */}
        {currentBelt === 'black' && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 rounded-full border border-yellow-400/30">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-yellow-700">Mestre - Nível Máximo Alcançado!</span>
            </div>
          </div>
        )}
      </div>

      {/* Estilos CSS */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

export default LearningJourneyCard;
