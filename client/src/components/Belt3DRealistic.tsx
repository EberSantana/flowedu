import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export type BeltColor = 
  | 'white' 
  | 'yellow' 
  | 'orange' 
  | 'green' 
  | 'blue' 
  | 'purple' 
  | 'brown' 
  | 'black';

interface Belt3DRealisticProps {
  color: BeltColor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  interactive?: boolean;
  showLabel?: boolean;
  showPoints?: boolean;
  points?: number;
  className?: string;
  onInteraction?: () => void;
}

// Configuração de cores e gradientes para cada faixa
const BELT_COLORS: Record<BeltColor, {
  primary: string;
  secondary: string;
  glow: string;
  shadow: string;
  label: string;
  textColor: string;
  buckleColor: string;
}> = {
  white: {
    primary: '#FFFFFF',
    secondary: '#F0F0F0',
    glow: 'rgba(255, 255, 255, 0.8)',
    shadow: 'rgba(200, 200, 200, 0.5)',
    label: 'Faixa Branca',
    textColor: '#374151',
    buckleColor: '#E5E7EB'
  },
  yellow: {
    primary: '#FFD700',
    secondary: '#FFC107',
    glow: 'rgba(255, 215, 0, 0.6)',
    shadow: 'rgba(255, 193, 7, 0.4)',
    label: 'Faixa Amarela',
    textColor: '#92400E',
    buckleColor: '#F59E0B'
  },
  orange: {
    primary: '#FF8C00',
    secondary: '#FF6B00',
    glow: 'rgba(255, 140, 0, 0.6)',
    shadow: 'rgba(255, 107, 0, 0.4)',
    label: 'Faixa Laranja',
    textColor: '#FFFFFF',
    buckleColor: '#EA580C'
  },
  green: {
    primary: '#22C55E',
    secondary: '#16A34A',
    glow: 'rgba(34, 197, 94, 0.6)',
    shadow: 'rgba(22, 163, 74, 0.4)',
    label: 'Faixa Verde',
    textColor: '#FFFFFF',
    buckleColor: '#15803D'
  },
  blue: {
    primary: '#3B82F6',
    secondary: '#2563EB',
    glow: 'rgba(59, 130, 246, 0.6)',
    shadow: 'rgba(37, 99, 235, 0.4)',
    label: 'Faixa Azul',
    textColor: '#FFFFFF',
    buckleColor: '#1D4ED8'
  },
  purple: {
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    glow: 'rgba(139, 92, 246, 0.6)',
    shadow: 'rgba(124, 58, 237, 0.4)',
    label: 'Faixa Roxa',
    textColor: '#FFFFFF',
    buckleColor: '#6D28D9'
  },
  brown: {
    primary: '#A16207',
    secondary: '#854D0E',
    glow: 'rgba(161, 98, 7, 0.6)',
    shadow: 'rgba(133, 77, 14, 0.4)',
    label: 'Faixa Marrom',
    textColor: '#FFFFFF',
    buckleColor: '#713F12'
  },
  black: {
    primary: '#1A1A1A',
    secondary: '#0A0A0A',
    glow: 'rgba(255, 215, 0, 0.4)',
    shadow: 'rgba(0, 0, 0, 0.6)',
    label: 'Faixa Preta',
    textColor: '#FFD700',
    buckleColor: '#FFD700'
  }
};

const SIZE_CONFIG = {
  sm: { width: 160, height: 60, buckle: 24, fontSize: 12 },
  md: { width: 220, height: 80, buckle: 32, fontSize: 14 },
  lg: { width: 300, height: 100, buckle: 40, fontSize: 16 },
  xl: { width: 380, height: 120, buckle: 48, fontSize: 18 }
};

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;
  life: number;
}

export function Belt3DRealistic({
  color,
  size = 'lg',
  animated = true,
  interactive = true,
  showLabel = true,
  showPoints = false,
  points = 0,
  className,
  onInteraction
}: Belt3DRealisticProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const config = BELT_COLORS[color];
  const sizeConfig = SIZE_CONFIG[size];

  // Animação de partículas
  useEffect(() => {
    if (!animated || !isHovered) {
      setParticles([]);
      return;
    }

    const createParticle = (): Particle => ({
      id: Math.random(),
      x: Math.random() * sizeConfig.width,
      y: Math.random() * sizeConfig.height,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.8 + 0.2,
      speedX: (Math.random() - 0.5) * 2,
      speedY: (Math.random() - 0.5) * 2 - 1,
      life: 1
    });

    const interval = setInterval(() => {
      setParticles(prev => {
        const updated = prev
          .map(p => ({
            ...p,
            x: p.x + p.speedX,
            y: p.y + p.speedY,
            life: p.life - 0.02,
            opacity: p.opacity * 0.98
          }))
          .filter(p => p.life > 0);

        if (updated.length < 15) {
          return [...updated, createParticle()];
        }
        return updated;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [animated, isHovered, sizeConfig]);

  // Animação de brilho pulsante
  useEffect(() => {
    if (!animated) return;

    const animate = () => {
      const time = Date.now() / 1000;
      const intensity = (Math.sin(time * 2) + 1) / 2;
      setGlowIntensity(isHovered ? 0.8 + intensity * 0.2 : 0.3 + intensity * 0.2);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animated, isHovered]);

  // Rotação 3D baseada no mouse
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const rotateY = ((e.clientX - centerX) / rect.width) * 25;
    const rotateX = ((centerY - e.clientY) / rect.height) * 15;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => {
    if (!interactive) return;
    setIsHovered(true);
    if (onInteraction) onInteraction();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div 
      className={cn('flex flex-col items-center gap-4', className)}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Container 3D com perspectiva */}
      <div 
        className="relative"
        style={{
          perspective: '1000px',
          width: sizeConfig.width,
          height: sizeConfig.height
        }}
      >
        {/* Partículas de brilho */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full pointer-events-none z-20"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: color === 'black' ? '#FFD700' : config.primary,
              opacity: particle.opacity,
              boxShadow: `0 0 ${particle.size * 2}px ${color === 'black' ? '#FFD700' : config.glow}`,
              transform: `scale(${particle.life})`,
              transition: 'transform 0.1s ease-out'
            }}
          />
        ))}

        {/* Glow de fundo */}
        <div
          className="absolute inset-0 rounded-full blur-xl transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at center, ${config.glow} 0%, transparent 70%)`,
            opacity: glowIntensity,
            transform: 'scale(1.3)'
          }}
        />

        {/* Faixa 3D Principal */}
        <div
          className={cn(
            'relative w-full h-full transition-all duration-300 ease-out',
            interactive && 'cursor-pointer'
          )}
          style={{
            transformStyle: 'preserve-3d',
            transform: `
              rotateX(${rotation.x}deg) 
              rotateY(${rotation.y}deg)
              ${isHovered ? 'scale(1.05) translateZ(10px)' : 'scale(1)'}
            `
          }}
        >
          {/* Sombra 3D */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: config.shadow,
              transform: 'translateZ(-20px) translateY(10px)',
              filter: 'blur(15px)',
              opacity: isHovered ? 0.6 : 0.4
            }}
          />

          {/* Corpo da faixa */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: `linear-gradient(
                135deg,
                ${config.secondary} 0%,
                ${config.primary} 30%,
                ${config.primary} 70%,
                ${config.secondary} 100%
              )`,
              boxShadow: `
                inset 0 2px 10px rgba(255,255,255,0.3),
                inset 0 -2px 10px rgba(0,0,0,0.2),
                0 4px 20px ${config.shadow}
              `,
              transform: 'translateZ(0px)'
            }}
          >
            {/* Reflexo superior */}
            <div
              className="absolute top-0 left-0 right-0 h-1/3"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, transparent 100%)',
                borderRadius: '9999px 9999px 0 0'
              }}
            />

            {/* Textura de tecido */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0,0,0,0.1) 2px,
                    rgba(0,0,0,0.1) 4px
                  )
                `
              }}
            />

            {/* Brilho animado (shine) */}
            <div
              className={cn(
                'absolute inset-0 opacity-0 transition-opacity duration-300',
                isHovered && 'opacity-100'
              )}
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
                animation: isHovered ? 'shine 1.5s ease-in-out infinite' : 'none'
              }}
            />
          </div>

          {/* Fivela central */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: sizeConfig.buckle,
              height: sizeConfig.buckle,
              transform: `translateX(-50%) translateY(-50%) translateZ(5px)`,
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Base da fivela */}
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                background: `linear-gradient(
                  145deg,
                  ${config.buckleColor} 0%,
                  ${color === 'white' ? '#D1D5DB' : config.buckleColor} 100%
                )`,
                boxShadow: `
                  inset 0 1px 3px rgba(255,255,255,0.4),
                  inset 0 -1px 3px rgba(0,0,0,0.2),
                  0 2px 8px rgba(0,0,0,0.3)
                `
              }}
            />
            
            {/* Detalhe interno da fivela */}
            <div
              className="absolute inset-2 rounded"
              style={{
                background: `linear-gradient(
                  145deg,
                  rgba(255,255,255,0.2) 0%,
                  transparent 50%,
                  rgba(0,0,0,0.1) 100%
                )`,
                border: `1px solid ${color === 'white' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'}`
              }}
            />

            {/* Brilho da fivela */}
            {color === 'black' && (
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.3) 0%, transparent 50%)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              />
            )}
          </div>

          {/* Detalhes laterais da faixa */}
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-3/4 rounded-full opacity-20"
            style={{
              background: color === 'white' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)'
            }}
          />
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-3/4 rounded-full opacity-20"
            style={{
              background: color === 'white' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)'
            }}
          />
        </div>

        {/* Indicador de interatividade */}
        {interactive && isHovered && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: color === 'black' ? '#FFD700' : config.primary,
                  animation: `bounce 0.6s ease-in-out ${i * 0.1}s infinite`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Label da faixa */}
      {showLabel && (
        <div className="text-center">
          <h3 
            className="font-bold"
            style={{ 
              fontSize: sizeConfig.fontSize + 2,
              color: '#1F2937'
            }}
          >
            {config.label}
          </h3>
          {showPoints && (
            <p 
              className="text-gray-500 mt-1"
              style={{ fontSize: sizeConfig.fontSize - 2 }}
            >
              {points.toLocaleString()} pontos
            </p>
          )}
        </div>
      )}

      {/* Estilos CSS */}
      <style>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotateY(0deg);
          }
          50% {
            transform: translateY(-8px) rotateY(5deg);
          }
        }
      `}</style>
    </div>
  );
}

export { BELT_COLORS };
