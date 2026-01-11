import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Star, Trophy, Zap } from 'lucide-react';

interface CelebrationAnimationProps {
  isActive: boolean;
  type?: 'levelup' | 'blackbelt' | 'achievement';
  onComplete?: () => void;
}

// Componente de confete animado
const Confetti: React.FC<{ count?: number }> = ({ count = 30 }) => {
  const confettiPieces = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    emoji: ['🎉', '✨', '⭐', '🌟', '💫', '🎊'][Math.floor(Math.random() * 6)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            fontSize: '24px',
          }}
        >
          {piece.emoji}
        </div>
      ))}
    </div>
  );
};

// Componente de partículas flutuantes
const FloatingParticles: React.FC<{ color: string; count?: number }> = ({ color, count = 20 }) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 1,
    duration: 1 + Math.random() * 1,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-particle-float"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: '8px',
            height: '8px',
            backgroundColor: color,
            opacity: 0.6,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            filter: 'blur(1px)',
          }}
        />
      ))}
    </div>
  );
};

// Componente de pulso de luz
const LightPulse: React.FC<{ color: string }> = ({ color }) => (
  <div
    className="fixed inset-0 pointer-events-none"
    style={{
      background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
      animation: 'pulse-light 1.5s ease-out',
    }}
  />
);

// Componente de ícone flutuante
const FloatingIcon: React.FC<{
  icon: React.ReactNode;
  delay?: number;
  duration?: number;
}> = ({ icon, delay = 0, duration = 2 }) => (
  <div
    className="fixed pointer-events-none"
    style={{
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      animation: `float-up ${duration}s ease-out`,
      animationDelay: `${delay}s`,
      opacity: 0,
    }}
  >
    {icon}
  </div>
);

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  isActive,
  type = 'levelup',
  onComplete,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [showIcons, setShowIcons] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setShowConfetti(false);
      setShowParticles(false);
      setShowPulse(false);
      setShowIcons(false);
      return;
    }

    // Timeline de animações
    const timings = {
      confetti: 0,
      particles: 100,
      pulse: 200,
      icons: 300,
      complete: type === 'blackbelt' ? 4000 : 3000,
    };

    setShowConfetti(true);
    const t1 = setTimeout(() => setShowParticles(true), timings.particles);
    const t2 = setTimeout(() => setShowPulse(true), timings.pulse);
    const t3 = setTimeout(() => setShowIcons(true), timings.icons);
    const t4 = setTimeout(() => {
      setShowConfetti(false);
      setShowParticles(false);
      setShowPulse(false);
      setShowIcons(false);
      onComplete?.();
    }, timings.complete);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isActive, type, onComplete]);

  if (!isActive) return null;

  const getColors = () => {
    switch (type) {
      case 'blackbelt':
        return { primary: '#FCD34D', secondary: '#FBBF24' };
      case 'achievement':
        return { primary: '#EC4899', secondary: '#F472B6' };
      default:
        return { primary: '#3B82F6', secondary: '#60A5FA' };
    }
  };

  const colors = getColors();

  return (
    <>
      {/* Confete */}
      {showConfetti && <Confetti count={type === 'blackbelt' ? 50 : 30} />}

      {/* Partículas flutuantes */}
      {showParticles && (
        <>
          <FloatingParticles color={colors.primary} count={20} />
          <FloatingParticles color={colors.secondary} count={15} />
        </>
      )}

      {/* Pulso de luz */}
      {showPulse && <LightPulse color={colors.primary} />}

      {/* Ícones flutuantes */}
      {showIcons && (
        <>
          <FloatingIcon
            icon={<Star className="w-12 h-12 text-yellow-400 fill-yellow-400" />}
            delay={0}
            duration={1.5}
          />
          <FloatingIcon
            icon={<Sparkles className="w-10 h-10 text-blue-400" />}
            delay={0.2}
            duration={1.5}
          />
          {type === 'blackbelt' && (
            <FloatingIcon
              icon={<Trophy className="w-12 h-12 text-yellow-500" />}
              delay={0.4}
              duration={1.5}
            />
          )}
          {type === 'achievement' && (
            <FloatingIcon
              icon={<Zap className="w-10 h-10 text-pink-500" />}
              delay={0.3}
              duration={1.5}
            />
          )}
        </>
      )}

      {/* Estilos CSS */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotateZ(360deg);
            opacity: 0;
          }
        }

        @keyframes particle-float {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx, 0), var(--ty, -100px)) scale(0);
            opacity: 0;
          }
        }

        @keyframes float-up {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          25% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
          }
          75% {
            transform: translate(-50%, -150%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -250%) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes pulse-light {
          0% {
            opacity: 1;
            transform: scale(0.5);
          }
          100% {
            opacity: 0;
            transform: scale(2);
          }
        }

        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }

        .animate-particle-float {
          animation: particle-float ease-out forwards;
        }
      `}</style>
    </>
  );
};
