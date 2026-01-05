import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface GamifiedProgressBarProps {
  currentPoints: number;
  pointsToNextLevel: number;
  currentBeltColor: string;
  nextBeltColor?: string;
  currentBeltName: string;
  nextBeltName?: string;
  percentage: number;
  multiplier?: number;
  animated?: boolean;
  showStats?: boolean;
  className?: string;
}

export function GamifiedProgressBar({
  currentPoints,
  pointsToNextLevel,
  currentBeltColor,
  nextBeltColor,
  currentBeltName,
  nextBeltName,
  percentage,
  multiplier = 1.0,
  animated = true,
  showStats = true,
  className
}: GamifiedProgressBarProps) {
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const [displayPoints, setDisplayPoints] = useState(0);

  useEffect(() => {
    if (animated) {
      // Animar percentual
      const percentageInterval = setInterval(() => {
        setDisplayPercentage(prev => {
          if (prev >= percentage) {
            clearInterval(percentageInterval);
            return percentage;
          }
          return Math.min(prev + 2, percentage);
        });
      }, 20);

      // Animar pontos
      const pointsInterval = setInterval(() => {
        setDisplayPoints(prev => {
          if (prev >= currentPoints) {
            clearInterval(pointsInterval);
            return currentPoints;
          }
          return Math.min(prev + Math.ceil(currentPoints / 50), currentPoints);
        });
      }, 30);

      return () => {
        clearInterval(percentageInterval);
        clearInterval(pointsInterval);
      };
    } else {
      setDisplayPercentage(percentage);
      setDisplayPoints(currentPoints);
    }
  }, [percentage, currentPoints, animated]);

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Header com informações */}
      {showStats && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {displayPoints.toLocaleString()} pontos
            </span>
            {multiplier > 1.0 && (
              <span 
                className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse"
                title="Multiplicador ativo"
              >
                ×{multiplier.toFixed(1)}
              </span>
            )}
          </div>
          <div className="text-muted-foreground">
            {pointsToNextLevel > 0 ? (
              <span>
                Faltam <span className="font-semibold text-foreground">{pointsToNextLevel.toLocaleString()}</span> para {nextBeltName}
              </span>
            ) : (
              <span className="font-semibold text-yellow-500">Nível Máximo!</span>
            )}
          </div>
        </div>
      )}

      {/* Barra de progresso */}
      <div className="relative">
        {/* Container da barra */}
        <div 
          className="relative h-8 rounded-full overflow-hidden shadow-lg"
          style={{
            background: `linear-gradient(to right, ${currentBeltColor}22, ${nextBeltColor || currentBeltColor}11)`,
            border: `2px solid ${currentBeltColor}44`
          }}
        >
          {/* Barra de progresso animada */}
          <div
            className={cn(
              'absolute inset-y-0 left-0 transition-all duration-1000 ease-out',
              'flex items-center justify-end px-3',
              animated && 'animate-shimmer'
            )}
            style={{
              width: `${displayPercentage}%`,
              background: nextBeltColor 
                ? `linear-gradient(90deg, ${currentBeltColor} 0%, ${nextBeltColor} 100%)`
                : currentBeltColor,
              boxShadow: `0 0 20px ${currentBeltColor}66, inset 0 2px 4px rgba(255,255,255,0.3)`
            }}
          >
            {/* Brilho animado */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-slide"
              style={{ width: '50%' }}
            />
            
            {/* Percentual */}
            {displayPercentage > 10 && (
              <span className="relative z-10 text-xs font-bold text-white drop-shadow-lg">
                {Math.round(displayPercentage)}%
              </span>
            )}
          </div>

          {/* Marcadores de checkpoint */}
          {[25, 50, 75].map((checkpoint) => (
            <div
              key={checkpoint}
              className={cn(
                'absolute top-0 bottom-0 w-0.5 transition-all duration-300',
                displayPercentage >= checkpoint ? 'bg-white/50' : 'bg-white/20'
              )}
              style={{ left: `${checkpoint}%` }}
            />
          ))}
        </div>

        {/* Indicador de faixas */}
        <div className="flex items-center justify-between mt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: currentBeltColor }}
            />
            <span className="font-medium text-muted-foreground">{currentBeltName}</span>
          </div>
          {nextBeltName && nextBeltColor && (
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-muted-foreground">{nextBeltName}</span>
              <div 
                className="w-3 h-3 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: nextBeltColor }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Partículas de celebração (quando próximo de 100%) */}
      {displayPercentage >= 90 && displayPercentage < 100 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-float-up"
              style={{
                left: `${10 + i * 12}%`,
                bottom: 0,
                background: nextBeltColor || currentBeltColor,
                animationDelay: `${i * 0.2}s`,
                boxShadow: `0 0 10px ${nextBeltColor || currentBeltColor}`
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.9;
          }
        }

        @keyframes slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }

        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(0);
            opacity: 0;
          }
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }

        .animate-slide {
          animation: slide 3s ease-in-out infinite;
        }

        .animate-float-up {
          animation: float-up 2s ease-out infinite;
        }
      `}</style>
    </div>
  );
}
