import { useState, useEffect, useCallback } from 'react';
import { Belt3DRealistic, BeltColor, BELT_COLORS } from './Belt3DRealistic';
import { cn } from '@/lib/utils';
import { X, Sparkles, Trophy, Star, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LevelUpModalCinematicProps {
  isOpen: boolean;
  oldBelt: BeltColor;
  newBelt: BeltColor;
  totalPoints: number;
  onClose: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  type: 'confetti' | 'sparkle' | 'star';
}

const BELT_LABELS: Record<BeltColor, string> = {
  white: 'Branca',
  yellow: 'Amarela',
  orange: 'Laranja',
  green: 'Verde',
  blue: 'Azul',
  purple: 'Roxa',
  brown: 'Marrom',
  black: 'Preta'
};

export function LevelUpModalCinematic({
  isOpen,
  oldBelt,
  newBelt,
  totalPoints,
  onClose
}: LevelUpModalCinematicProps) {
  const [phase, setPhase] = useState<'transition' | 'celebration' | 'complete'>('transition');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showOldBelt, setShowOldBelt] = useState(true);
  const [scale, setScale] = useState(1);

  const isBlackBelt = newBelt === 'black';
  const newBeltConfig = BELT_COLORS[newBelt];

  // Gerar partículas de celebração
  const generateParticles = useCallback(() => {
    const colors = isBlackBelt 
      ? ['#FFD700', '#FFA500', '#FFFFFF', '#FFE4B5']
      : [newBeltConfig.primary, newBeltConfig.secondary, '#FFD700', '#FFFFFF'];

    const newParticles: Particle[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      size: Math.random() * 12 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
      type: Math.random() > 0.7 ? 'star' : Math.random() > 0.5 ? 'sparkle' : 'confetti'
    }));

    setParticles(newParticles);
  }, [isBlackBelt, newBeltConfig]);

  // Sequência de animação
  useEffect(() => {
    if (!isOpen) {
      setPhase('transition');
      setShowOldBelt(true);
      setScale(1);
      setParticles([]);
      return;
    }

    // Fase 1: Transição (mostrar faixa antiga diminuindo)
    const transitionTimer = setTimeout(() => {
      setScale(0.8);
      setShowOldBelt(false);
    }, 1500);

    // Fase 2: Celebração (mostrar nova faixa com efeitos)
    const celebrationTimer = setTimeout(() => {
      setPhase('celebration');
      setScale(1.1);
      generateParticles();
    }, 2500);

    // Fase 3: Completo
    const completeTimer = setTimeout(() => {
      setPhase('complete');
      setScale(1);
    }, 4000);

    return () => {
      clearTimeout(transitionTimer);
      clearTimeout(celebrationTimer);
      clearTimeout(completeTimer);
    };
  }, [isOpen, generateParticles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay com blur */}
      <div 
        className={cn(
          'absolute inset-0 transition-all duration-500',
          isBlackBelt 
            ? 'bg-gradient-to-br from-black/90 via-gray-900/90 to-black/90' 
            : 'bg-black/80 backdrop-blur-sm'
        )}
        onClick={phase === 'complete' ? onClose : undefined}
      />

      {/* Partículas de celebração */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              animation: `fall ${particle.duration}s ease-out ${particle.delay}s forwards`
            }}
          >
            {particle.type === 'star' ? (
              <Star 
                className="w-full h-full" 
                style={{ color: particle.color, fill: particle.color }}
              />
            ) : particle.type === 'sparkle' ? (
              <Sparkles 
                className="w-full h-full" 
                style={{ color: particle.color }}
              />
            ) : (
              <div 
                className="w-full h-full rounded-sm"
                style={{ 
                  backgroundColor: particle.color,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Raios de luz para faixa preta */}
      {isBlackBelt && phase !== 'transition' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 h-[200vh] w-2"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,215,0,0.3) 0%, transparent 50%)',
                transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
                transformOrigin: 'bottom center',
                animation: `rayPulse 2s ease-in-out ${i * 0.1}s infinite`
              }}
            />
          ))}
        </div>
      )}

      {/* Conteúdo principal */}
      <div 
        className={cn(
          'relative z-10 max-w-lg w-full mx-4 p-8 rounded-3xl',
          'transition-all duration-700 transform',
          phase === 'transition' && 'scale-95 opacity-90',
          phase === 'celebration' && 'scale-100 opacity-100',
          phase === 'complete' && 'scale-100 opacity-100',
          isBlackBelt 
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-yellow-400/50'
            : 'bg-white/95 backdrop-blur-xl'
        )}
        style={{
          boxShadow: isBlackBelt 
            ? '0 0 60px rgba(255,215,0,0.3), inset 0 0 30px rgba(255,215,0,0.1)'
            : `0 25px 80px ${newBeltConfig.shadow}`
        }}
      >
        {/* Botão fechar */}
        {phase === 'complete' && (
          <button
            onClick={onClose}
            className={cn(
              'absolute top-4 right-4 p-2 rounded-full transition-all',
              isBlackBelt 
                ? 'text-yellow-400 hover:bg-yellow-400/20' 
                : 'text-gray-400 hover:bg-gray-100'
            )}
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* Ícone de troféu */}
        <div className="flex justify-center mb-6">
          <div 
            className={cn(
              'relative p-4 rounded-full',
              'transition-all duration-500',
              phase === 'celebration' && 'animate-bounce'
            )}
            style={{
              background: isBlackBelt 
                ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                : `linear-gradient(135deg, ${newBeltConfig.primary} 0%, ${newBeltConfig.secondary} 100%)`
            }}
          >
            {isBlackBelt ? (
              <Crown className="w-12 h-12 text-gray-900" />
            ) : (
              <Trophy className="w-12 h-12 text-white" />
            )}
            
            {/* Sparkles ao redor */}
            {phase !== 'transition' && (
              <>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-spin" />
                <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-yellow-300 animate-pulse" />
              </>
            )}
          </div>
        </div>

        {/* Título */}
        <h2 
          className={cn(
            'text-3xl md:text-4xl font-bold text-center mb-2',
            'transition-all duration-500',
            isBlackBelt ? 'text-yellow-400' : 'text-gray-900'
          )}
        >
          {isBlackBelt ? '🥋 MESTRE ALCANÇADO! 🥋' : '🎉 Level Up! 🎉'}
        </h2>

        <p 
          className={cn(
            'text-center mb-8',
            isBlackBelt ? 'text-gray-300' : 'text-gray-600'
          )}
        >
          {isBlackBelt 
            ? 'Você conquistou a Faixa Preta! Parabéns, Mestre!'
            : 'Parabéns! Você evoluiu para uma nova faixa!'}
        </p>

        {/* Transição de faixas */}
        <div className="flex items-center justify-center gap-4 md:gap-8 mb-8">
          {/* Faixa antiga */}
          <div 
            className={cn(
              'transition-all duration-700',
              !showOldBelt && 'opacity-30 scale-75'
            )}
          >
            <Belt3DRealistic
              color={oldBelt}
              size="md"
              animated={false}
              interactive={false}
              showLabel={true}
            />
          </div>

          {/* Seta animada */}
          <div 
            className={cn(
              'flex flex-col items-center gap-1',
              'transition-all duration-500',
              phase === 'celebration' && 'scale-125'
            )}
          >
            <div className="text-4xl animate-pulse">→</div>
            <Zap 
              className={cn(
                'w-6 h-6',
                isBlackBelt ? 'text-yellow-400' : 'text-orange-500'
              )}
            />
          </div>

          {/* Faixa nova */}
          <div 
            className={cn(
              'transition-all duration-700',
              phase === 'transition' && 'opacity-50 scale-90',
              phase === 'celebration' && 'scale-110',
              phase === 'complete' && 'scale-100'
            )}
            style={{
              transform: `scale(${scale})`,
              filter: phase === 'celebration' ? `drop-shadow(0 0 20px ${newBeltConfig.glow})` : 'none'
            }}
          >
            <Belt3DRealistic
              color={newBelt}
              size="md"
              animated={phase !== 'transition'}
              interactive={false}
              showLabel={true}
            />
          </div>
        </div>

        {/* Estatísticas */}
        <div 
          className={cn(
            'p-4 rounded-xl mb-6',
            isBlackBelt 
              ? 'bg-yellow-400/10 border border-yellow-400/30'
              : 'bg-gray-50 border border-gray-200'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={isBlackBelt ? 'text-gray-300' : 'text-gray-600'}>
              Pontos Totais
            </span>
            <span 
              className={cn(
                'text-2xl font-bold',
                isBlackBelt ? 'text-yellow-400' : 'text-gray-900'
              )}
            >
              {totalPoints.toLocaleString()} pts
            </span>
          </div>
        </div>

        {/* Mensagem especial para faixa preta */}
        {isBlackBelt && (
          <div className="text-center mb-6 p-4 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-xl border border-yellow-400/30">
            <p className="text-yellow-400 font-semibold text-lg animate-pulse">
              ⭐ Você é um Mestre do Dojo! ⭐
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Continue praticando para manter sua excelência!
            </p>
          </div>
        )}

        {/* Botão de continuar */}
        <Button
          onClick={onClose}
          className={cn(
            'w-full py-6 text-lg font-bold rounded-xl',
            'transition-all duration-300 transform hover:scale-105',
            isBlackBelt 
              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 hover:from-yellow-300 hover:to-amber-400'
              : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500'
          )}
          style={{
            boxShadow: isBlackBelt 
              ? '0 10px 30px rgba(255,215,0,0.3)'
              : `0 10px 30px ${newBeltConfig.shadow}`
          }}
        >
          {isBlackBelt ? '🥋 Continuar como Mestre!' : '🚀 Continuar Treinando!'}
        </Button>
      </div>

      {/* Estilos CSS */}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes rayPulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255,215,0,0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(255,215,0,0.8);
          }
        }
      `}</style>
    </div>
  );
}

export default LevelUpModalCinematic;
