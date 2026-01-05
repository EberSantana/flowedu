import { useState, useEffect } from 'react';
import { Belt3DRealistic, BeltColor, BELT_COLORS } from './Belt3DRealistic';
import { cn } from '@/lib/utils';
import { Zap, TrendingUp, Sparkles } from 'lucide-react';

interface StudentDashboardHeaderRealisticProps {
  studentName: string;
  currentBelt: BeltColor;
  totalPoints: number;
  nextBeltThreshold: number;
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

export function StudentDashboardHeaderRealistic({
  studentName,
  currentBelt,
  totalPoints,
  nextBeltThreshold,
}: StudentDashboardHeaderRealisticProps) {
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
  const currentBeltConfig = BELT_COLORS[currentBelt];

  // Saudação baseada na hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  // Animar progresso
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercent);
    }, 300);

    if (progressPercent >= 80) {
      setShowSparkles(true);
    }

    return () => clearTimeout(timer);
  }, [progressPercent]);

  return (
    <div className="mb-8">
      <div 
        className={cn(
          'relative overflow-hidden rounded-3xl p-6 md:p-8',
          'bg-gradient-to-br from-slate-50 via-white to-slate-100',
          'border border-slate-200/50',
          'shadow-xl shadow-slate-200/50'
        )}
      >
        {/* Background decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20"
            style={{
              background: `radial-gradient(circle, ${currentBeltConfig.glow} 0%, transparent 70%)`
            }}
          />
          <div 
            className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-15"
            style={{
              background: `radial-gradient(circle, ${currentBeltConfig.primary}40 0%, transparent 70%)`
            }}
          />
        </div>

        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Faixa 3D Realista */}
          <div className="flex-shrink-0">
            <div 
              className={cn(
                'bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50',
                'transition-all duration-300 hover:shadow-xl'
              )}
            >
              <Belt3DRealistic 
                color={currentBelt} 
                size="lg"
                animated={true}
                interactive={true}
                showLabel={false}
              />
            </div>
          </div>

          {/* Informações */}
          <div className="flex-1 text-center md:text-left space-y-4">
            {/* Saudação */}
            <div>
              <p className="text-gray-500 text-sm">{getGreeting()},</p>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 uppercase tracking-wide">
                {studentName}
              </h1>
            </div>

            {/* Faixa e Pontos */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div 
                className="px-4 py-2 rounded-full font-semibold text-sm border-2 transition-all duration-300 hover:scale-105"
                style={{ 
                  backgroundColor: `${currentBeltConfig.primary}15`,
                  borderColor: currentBeltConfig.primary,
                  color: currentBelt === 'white' ? '#374151' : currentBeltConfig.primary
                }}
              >
                Faixa {BELT_THRESHOLDS[currentBelt].label}
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200 transition-all duration-300 hover:scale-105 hover:bg-blue-100">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-600">{totalPoints}</span>
                <span className="text-sm text-blue-500">Tech Coins</span>
              </div>
            </div>

            {/* Progresso para próxima faixa */}
            {currentBelt !== 'black' && (
              <div className="max-w-md">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Próxima faixa
                  </span>
                  <span className="font-medium">{pointsToNext} Tech Coins restantes</span>
                </div>
                
                {/* Barra de progresso animada */}
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${animatedProgress}%`,
                      background: nextBeltConfig
                        ? `linear-gradient(90deg, ${currentBeltConfig.primary} 0%, ${nextBeltConfig.primary} 100%)`
                        : currentBeltConfig.primary,
                      boxShadow: `0 0 10px ${currentBeltConfig.glow}`
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
                      <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentBelt === 'black' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 rounded-full border border-yellow-400/30">
                <span className="text-lg">🏆</span>
                <span className="font-bold text-yellow-700">Mestre - Faixa Preta conquistada!</span>
              </div>
            )}
          </div>
        </div>
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

export default StudentDashboardHeaderRealistic;
