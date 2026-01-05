import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Belt3DProps {
  beltName: string;
  beltColor: string;
  beltLevel: number;
  beltIcon: string;
  displayName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  interactive?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-24 h-32',
  md: 'w-32 h-40',
  lg: 'w-48 h-56',
  xl: 'w-64 h-72'
};

export function Belt3D({
  beltName,
  beltColor,
  beltLevel,
  beltIcon,
  displayName,
  size = 'md',
  animated = true,
  interactive = true,
  className
}: Belt3DProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleMouseEnter = () => {
    if (!interactive) return;
    setIsHovered(true);
    
    // Gerar partículas
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100
    }));
    setParticles(newParticles);
    
    // Limpar partículas após animação
    setTimeout(() => setParticles([]), 1500);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setIsHovered(false);
  };

  // Calcular gradiente baseado na cor da faixa
  const getGradient = () => {
    if (beltColor === '#FFFFFF') {
      return 'linear-gradient(135deg, #f0f0f0 0%, #ffffff 50%, #e8e8e8 100%)';
    }
    if (beltColor === '#000000') {
      return 'linear-gradient(135deg, #1a1a1a 0%, #000000 50%, #0a0a0a 100%)';
    }
    return `linear-gradient(135deg, ${beltColor}dd 0%, ${beltColor} 50%, ${beltColor}bb 100%)`;
  };

  return (
    <div
      className={cn(
        'relative perspective-1000',
        sizeClasses[size],
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Partículas */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full pointer-events-none animate-particle-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: beltColor,
            boxShadow: `0 0 10px ${beltColor}`,
            animation: 'particle-float 1.5s ease-out forwards'
          }}
        />
      ))}

      {/* Container 3D da faixa */}
      <div
        className={cn(
          'relative w-full h-full transition-all duration-700 ease-out',
          'transform-style-3d',
          animated && 'animate-belt-float',
          isHovered && interactive && 'scale-110 rotate-y-12',
          !isHovered && 'rotate-y-0'
        )}
        style={{
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Brilho de fundo */}
        <div
          className={cn(
            'absolute inset-0 rounded-2xl blur-2xl opacity-0 transition-opacity duration-500',
            isHovered && 'opacity-60'
          )}
          style={{
            background: getGradient(),
            transform: 'translateZ(-20px)'
          }}
        />

        {/* Faixa principal */}
        <div
          className={cn(
            'relative w-full h-full rounded-2xl shadow-2xl overflow-hidden',
            'border-4 transition-all duration-500',
            isHovered ? 'border-opacity-100' : 'border-opacity-50'
          )}
          style={{
            background: getGradient(),
            borderColor: beltColor === '#FFFFFF' ? '#d0d0d0' : beltColor,
            boxShadow: isHovered
              ? `0 20px 60px ${beltColor}66, 0 0 40px ${beltColor}44 inset`
              : `0 10px 30px ${beltColor}33, 0 0 20px ${beltColor}22 inset`
          }}
        >
          {/* Reflexo superior */}
          <div
            className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent"
            style={{ transform: 'translateZ(1px)' }}
          />

          {/* Textura da faixa */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                ${beltColor}22 2px,
                ${beltColor}22 4px
              )`
            }} />
          </div>

          {/* Conteúdo */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-4">
            {/* Ícone da faixa */}
            <div
              className={cn(
                'text-6xl mb-3 transition-all duration-500',
                isHovered && 'scale-125 rotate-12',
                animated && 'animate-pulse-slow'
              )}
              style={{
                filter: `drop-shadow(0 4px 8px ${beltColor}66)`,
                textShadow: beltColor === '#FFFFFF' 
                  ? '0 2px 4px rgba(0,0,0,0.3)' 
                  : '0 2px 8px rgba(255,255,255,0.5)'
              }}
            >
              {beltIcon}
            </div>

            {/* Nome da faixa */}
            <div
              className={cn(
                'text-center font-bold transition-all duration-500',
                size === 'xl' ? 'text-2xl' : size === 'lg' ? 'text-xl' : 'text-lg',
                beltColor === '#FFFFFF' ? 'text-gray-800' : 'text-white'
              )}
              style={{
                textShadow: beltColor === '#FFFFFF'
                  ? '0 1px 2px rgba(0,0,0,0.2)'
                  : '0 2px 4px rgba(0,0,0,0.8)',
                transform: isHovered ? 'translateZ(10px)' : 'translateZ(0)'
              }}
            >
              {displayName}
            </div>

            {/* Nível */}
            <div
              className={cn(
                'mt-2 px-3 py-1 rounded-full text-sm font-semibold',
                'transition-all duration-500',
                beltColor === '#FFFFFF' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-white/20 backdrop-blur-sm',
                beltColor === '#FFFFFF' ? 'text-white' : 'text-white'
              )}
              style={{
                transform: isHovered ? 'translateZ(15px) scale(1.1)' : 'translateZ(0)',
                boxShadow: isHovered ? `0 4px 12px ${beltColor}88` : 'none'
              }}
            >
              Nível {beltLevel}
            </div>
          </div>

          {/* Brilho de interação */}
          {isHovered && (
            <div
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shine"
              style={{ transform: 'translateZ(2px)' }}
            />
          )}
        </div>

        {/* Sombra 3D */}
        <div
          className="absolute inset-0 rounded-2xl opacity-30"
          style={{
            background: 'radial-gradient(circle, transparent 40%, black 100%)',
            transform: 'translateZ(-10px)',
            filter: 'blur(10px)'
          }}
        />
      </div>

      {/* Indicador de interatividade */}
      {interactive && (
        <div className={cn(
          'absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground',
          'transition-opacity duration-300',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}>
          ✨ Interativo
        </div>
      )}

      <style>{`
        @keyframes belt-float {
          0%, 100% {
            transform: translateY(0) rotateY(0deg);
          }
          50% {
            transform: translateY(-10px) rotateY(5deg);
          }
        }

        @keyframes particle-float {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx, 0), var(--ty, -50px)) scale(0);
            opacity: 0;
          }
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%) translateZ(2px) rotate(45deg);
          }
          100% {
            transform: translateX(200%) translateZ(2px) rotate(45deg);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .perspective-1000 {
          perspective: 1000px;
        }

        .transform-style-3d {
          transform-style: preserve-3d;
        }

        .rotate-y-0 {
          transform: rotateY(0deg);
        }

        .rotate-y-12 {
          transform: rotateY(12deg);
        }

        .animate-belt-float {
          animation: belt-float 6s ease-in-out infinite;
        }

        .animate-particle-float {
          --tx: ${Math.random() * 60 - 30}px;
          --ty: ${Math.random() * -80 - 20}px;
        }

        .animate-shine {
          animation: shine 1.5s ease-in-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
