import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  speed: number;
  wobble: number;
  shape: 'square' | 'circle' | 'triangle' | 'star';
}

interface ConfettiCelebrationProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

const DEFAULT_COLORS = [
  '#FF6B6B', // Vermelho
  '#4ECDC4', // Turquesa
  '#FFE66D', // Amarelo
  '#95E1D3', // Verde água
  '#F38181', // Rosa
  '#AA96DA', // Roxo
  '#FCBAD3', // Rosa claro
  '#A8D8EA', // Azul claro
  '#FFB347', // Laranja
  '#87CEEB', // Azul céu
];

// Componente de peça de confetti individual
const ConfettiPieceComponent: React.FC<{ piece: ConfettiPiece }> = ({ piece }) => {
  const getShape = () => {
    switch (piece.shape) {
      case 'circle':
        return (
          <div 
            className="rounded-full"
            style={{
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
            }}
          />
        );
      case 'triangle':
        return (
          <div 
            style={{
              width: 0,
              height: 0,
              borderLeft: `${piece.size / 2}px solid transparent`,
              borderRight: `${piece.size / 2}px solid transparent`,
              borderBottom: `${piece.size}px solid ${piece.color}`,
            }}
          />
        );
      case 'star':
        return (
          <svg 
            width={piece.size} 
            height={piece.size} 
            viewBox="0 0 24 24" 
            fill={piece.color}
          >
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        );
      default: // square
        return (
          <div 
            style={{
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
            }}
          />
        );
    }
  };

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: piece.x,
        top: piece.y,
        transform: `rotate(${piece.rotation}deg)`,
        animation: `confetti-fall ${piece.speed}s linear forwards`,
        animationDelay: `${Math.random() * 0.5}s`,
      }}
    >
      {getShape()}
    </div>
  );
};

export const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  isActive,
  duration = 3000,
  particleCount = 100,
  colors = DEFAULT_COLORS,
  onComplete,
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const generatePieces = useCallback(() => {
    const shapes: Array<'square' | 'circle' | 'triangle' | 'star'> = ['square', 'circle', 'triangle', 'star'];
    const newPieces: ConfettiPiece[] = [];

    for (let i = 0; i < particleCount; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 100,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        speed: 2 + Math.random() * 2,
        wobble: Math.random() * 10,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    return newPieces;
  }, [particleCount, colors]);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      setPieces(generatePieces());

      const timer = setTimeout(() => {
        setIsVisible(false);
        setPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration, generatePieces, onComplete]);

  if (!isVisible || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <ConfettiPieceComponent key={piece.id} piece={piece} />
      ))}
      
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Versão simplificada com explosão central
export const ConfettiBurst: React.FC<{
  isActive: boolean;
  x?: number;
  y?: number;
  colors?: string[];
  onComplete?: () => void;
}> = ({ isActive, x = 50, y = 50, colors = DEFAULT_COLORS, onComplete }) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    angle: number;
    distance: number;
    color: string;
    size: number;
  }>>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      
      const newParticles = [...Array(30)].map((_, i) => ({
        id: i,
        angle: (i / 30) * 360 + Math.random() * 30,
        distance: 50 + Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
      }));
      
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setParticles([]);
        onComplete?.();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isActive, colors, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed pointer-events-none z-50"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-burst"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            '--angle': `${particle.angle}deg`,
            '--distance': `${particle.distance}px`,
          } as React.CSSProperties}
        />
      ))}
      
      <style>{`
        @keyframes burst {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: 
              translate(
                calc(cos(var(--angle)) * var(--distance)),
                calc(sin(var(--angle)) * var(--distance))
              ) 
              scale(0);
            opacity: 0;
          }
        }
        
        .animate-burst {
          animation: burst 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Hook para usar confetti facilmente
export const useConfetti = () => {
  const [isActive, setIsActive] = useState(false);
  const [burstPosition, setBurstPosition] = useState({ x: 50, y: 50 });

  const triggerConfetti = useCallback(() => {
    setIsActive(true);
  }, []);

  const triggerBurst = useCallback((x: number = 50, y: number = 50) => {
    setBurstPosition({ x, y });
    setIsActive(true);
  }, []);

  const stopConfetti = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    burstPosition,
    triggerConfetti,
    triggerBurst,
    stopConfetti,
  };
};

export default ConfettiCelebration;
