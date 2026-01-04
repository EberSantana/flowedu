import { useEffect, useState } from 'react';
import { BeltColor } from '@/components/KarateAvatar';

interface BeltTransitionAnimationProps {
  oldBelt: BeltColor;
  newBelt: BeltColor;
  isActive: boolean;
  onComplete?: () => void;
}

const BELT_COLORS: Record<BeltColor, { color: string; glow: string }> = {
  white: { color: '#FFFFFF', glow: '#E5E7EB' },
  yellow: { color: '#FBBF24', glow: '#FCD34D' },
  orange: { color: '#F97316', glow: '#FB923C' },
  green: { color: '#22C55E', glow: '#86EFAC' },
  blue: { color: '#3B82F6', glow: '#93C5FD' },
  purple: { color: '#A855F7', glow: '#D8B4FE' },
  brown: { color: '#92400E', glow: '#B45309' },
  black: { color: '#1F2937', glow: '#FFD700' },
};

export function BeltTransitionAnimation({
  oldBelt,
  newBelt,
  isActive,
  onComplete,
}: BeltTransitionAnimationProps) {
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'transition' | 'exit'>('enter');

  useEffect(() => {
    if (!isActive) return;

    // Fase 1: Entrada (0-500ms)
    const phase1Timer = setTimeout(() => {
      setAnimationPhase('transition');
    }, 500);

    // Fase 2: Transição (500-2000ms)
    const phase2Timer = setTimeout(() => {
      setAnimationPhase('exit');
    }, 2000);

    // Fase 3: Saída (2000-2500ms)
    const phase3Timer = setTimeout(() => {
      onComplete?.();
    }, 2500);

    return () => {
      clearTimeout(phase1Timer);
      clearTimeout(phase2Timer);
      clearTimeout(phase3Timer);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  const oldColor = BELT_COLORS[oldBelt];
  const newColor = BELT_COLORS[newBelt];

  return (
    <>
      <style>{`
        @keyframes beltEnter {
          0% {
            opacity: 0;
            transform: scale(0.5) rotate(-180deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes beltTransition {
          0% {
            box-shadow: 0 0 20px ${oldColor.glow}, 0 0 40px ${oldColor.glow};
            border-color: ${oldColor.color};
          }
          50% {
            box-shadow: 0 0 40px ${oldColor.glow}, 0 0 60px ${newColor.glow};
            border-color: ${oldColor.color};
          }
          100% {
            box-shadow: 0 0 20px ${newColor.glow}, 0 0 40px ${newColor.glow};
            border-color: ${newColor.color};
          }
        }

        @keyframes beltPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes colorShift {
          0% {
            background: ${oldColor.color};
          }
          50% {
            background: linear-gradient(90deg, ${oldColor.color}, ${newColor.color});
          }
          100% {
            background: ${newColor.color};
          }
        }

        @keyframes particleFloat {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) translateX(var(--tx)) scale(0);
          }
        }

        @keyframes confettiFall {
          0% {
            opacity: 1;
            transform: translateY(-50px) translateX(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(200px) translateX(var(--confetti-tx)) rotate(720deg);
          }
        }

        @keyframes lightRayPulse {
          0%, 100% {
            opacity: 0.3;
            transform: rotate(var(--ray-angle)) scaleY(1);
          }
          50% {
            opacity: 0.8;
            transform: rotate(var(--ray-angle)) scaleY(1.2);
          }
        }

        .belt-transition-container {
          animation: ${
            animationPhase === 'enter'
              ? 'beltEnter 0.5s ease-out'
              : animationPhase === 'transition'
                ? 'beltTransition 1.5s ease-in-out'
                : 'beltPulse 0.5s ease-out'
          };
        }

        .belt-color-bar {
          animation: colorShift 1.5s ease-in-out;
        }

        .belt-particle {
          animation: particleFloat 1s ease-out forwards;
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
        {/* Container principal */}
        <div className="belt-transition-container relative w-32 h-32">
          {/* Faixa animada */}
          <div
            className="belt-color-bar absolute inset-0 rounded-full border-4"
            style={{
              borderColor: animationPhase === 'transition' ? newColor.color : oldColor.color,
              boxShadow:
                animationPhase === 'transition'
                  ? `0 0 40px ${newColor.glow}, 0 0 60px ${newColor.glow}`
                  : `0 0 20px ${oldColor.glow}, 0 0 40px ${oldColor.glow}`,
            }}
          />

          {/* Partículas de transição */}
          {animationPhase === 'transition' &&
            Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const tx = Math.cos(angle) * 100;
              const ty = Math.sin(angle) * 100;
              return (
                <div
                  key={i}
                  className="belt-particle absolute w-3 h-3 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    background: newColor.color,
                    '--tx': `${tx}px`,
                    boxShadow: `0 0 10px ${newColor.glow}`,
                  } as React.CSSProperties}
                />
              );
            })}

          {/* Texto de evolução */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-white drop-shadow-lg">
                {animationPhase === 'enter' && '✨'}
                {animationPhase === 'transition' && '⚡'}
                {animationPhase === 'exit' && '🎉'}
              </div>
              <p className="text-xs font-bold text-white drop-shadow-lg mt-2 uppercase">
                {animationPhase === 'enter' && 'Evoluindo...'}
                {animationPhase === 'transition' && 'Transformando...'}
                {animationPhase === 'exit' && 'Conquistada!'}
              </p>
            </div>
          </div>
        </div>

        {/* Raios de luz pulsantes */}
        {animationPhase === 'transition' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  width: '3px',
                  height: '150px',
                  background: `linear-gradient(to top, ${newColor.glow}, transparent)`,
                  left: '50%',
                  top: '50%',
                  '--ray-angle': `${(i / 12) * 360}deg`,
                  transformOrigin: '0 0',
                  animation: 'lightRayPulse 1s ease-in-out infinite',
                  animationDelay: `${i * 0.08}s`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}

        {/* Confetes caindo */}
        {animationPhase === 'exit' && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => {
              const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#A8E6CF'];
              const randomColor = colors[Math.floor(Math.random() * colors.length)];
              const randomTx = (Math.random() - 0.5) * 300;
              return (
                <div
                  key={i}
                  className="absolute w-3 h-3 rounded-sm"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '0',
                    background: randomColor,
                    '--confetti-tx': `${randomTx}px`,
                    animation: 'confettiFall 2s ease-out forwards',
                    animationDelay: `${Math.random() * 0.5}s`,
                  } as React.CSSProperties}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
