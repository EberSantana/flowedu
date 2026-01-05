import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Zap, Star } from 'lucide-react';

interface InteractiveBeltProps {
  currentBelt: string;
  totalPoints: number;
  progressToNextBelt?: {
    current: number;
    required: number;
    percentage: number;
    nextBeltName: string;
    pointsNeeded: number;
  } | null;
  showLevelUpAnimation?: boolean;
  onAnimationComplete?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const BELT_COLORS = {
  white: { primary: '#F8FAFC', secondary: '#E2E8F0', glow: '#CBD5E1', name: 'Branca' },
  yellow: { primary: '#FCD34D', secondary: '#F59E0B', glow: '#FBBF24', name: 'Amarela' },
  orange: { primary: '#FB923C', secondary: '#EA580C', glow: '#F97316', name: 'Laranja' },
  green: { primary: '#4ADE80', secondary: '#16A34A', glow: '#22C55E', name: 'Verde' },
  blue: { primary: '#60A5FA', secondary: '#2563EB', glow: '#3B82F6', name: 'Azul' },
  purple: { primary: '#A78BFA', secondary: '#7C3AED', glow: '#8B5CF6', name: 'Roxa' },
  brown: { primary: '#A16207', secondary: '#78350F', glow: '#92400E', name: 'Marrom' },
  black: { primary: '#1F2937', secondary: '#111827', glow: '#374151', name: 'Preta' },
};

const BELT_SIZES = {
  sm: { width: 120, height: 40, fontSize: 'text-xs' },
  md: { width: 180, height: 60, fontSize: 'text-sm' },
  lg: { width: 240, height: 80, fontSize: 'text-base' },
  xl: { width: 320, height: 100, fontSize: 'text-lg' },
};

export function InteractiveBelt({
  currentBelt,
  totalPoints,
  progressToNextBelt,
  showLevelUpAnimation = false,
  onAnimationComplete,
  size = 'lg',
}: InteractiveBeltProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const beltConfig = BELT_COLORS[currentBelt as keyof typeof BELT_COLORS] || BELT_COLORS.white;
  const sizeConfig = BELT_SIZES[size];

  useEffect(() => {
    if (showLevelUpAnimation) {
      setShowParticles(true);
      const timer = setTimeout(() => {
        setShowParticles(false);
        onAnimationComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showLevelUpAnimation, onAnimationComplete]);

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Animação de Level Up */}
      <AnimatePresence>
        {showLevelUpAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full blur-xl opacity-60"
              />
              <div className="relative bg-gradient-to-br from-yellow-400 to-orange-600 text-white px-8 py-6 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8" />
                  <div>
                    <div className="text-2xl font-bold">NOVA FAIXA!</div>
                    <div className="text-lg">Faixa {beltConfig.name}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partículas de celebração */}
      <AnimatePresence>
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: sizeConfig.width / 2,
                  y: sizeConfig.height / 2,
                  opacity: 1,
                  scale: 1,
                }}
                animate={{
                  x: Math.random() * sizeConfig.width * 2 - sizeConfig.width / 2,
                  y: Math.random() * sizeConfig.height * 2 - sizeConfig.height / 2,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
                className="absolute"
              >
                <Sparkles
                  className="w-4 h-4"
                  style={{ color: beltConfig.glow }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Container da faixa */}
      <motion.div
        className="relative cursor-pointer"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ width: sizeConfig.width, height: sizeConfig.height }}
      >
        {/* Brilho de fundo */}
        <motion.div
          className="absolute inset-0 rounded-full blur-2xl opacity-40"
          style={{ backgroundColor: beltConfig.glow }}
          animate={{
            scale: isHovered ? [1, 1.2, 1] : 1,
            opacity: isHovered ? [0.4, 0.6, 0.4] : 0.4,
          }}
          transition={{
            duration: 2,
            repeat: isHovered ? Infinity : 0,
            ease: "easeInOut",
          }}
        />

        {/* Faixa principal */}
        <motion.div
          className="relative w-full h-full rounded-full shadow-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${beltConfig.primary} 0%, ${beltConfig.secondary} 100%)`,
          }}
          animate={{
            rotateY: isHovered ? [0, 15, -15, 0] : 0,
          }}
          transition={{
            duration: 1,
            ease: "easeInOut",
          }}
        >
          {/* Textura da faixa */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="belt-texture" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="20" y2="20" stroke="white" strokeWidth="0.5" />
                  <line x1="20" y1="0" x2="0" y2="20" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#belt-texture)" />
            </svg>
          </div>

          {/* Reflexo de luz */}
          <motion.div
            className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/40 to-transparent rounded-t-full"
            animate={{
              opacity: isHovered ? [0.4, 0.6, 0.4] : 0.4,
            }}
            transition={{
              duration: 1.5,
              repeat: isHovered ? Infinity : 0,
            }}
          />

          {/* Nó da faixa */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-16 rounded-lg shadow-xl"
            style={{
              background: `linear-gradient(180deg, ${beltConfig.secondary} 0%, ${beltConfig.primary} 100%)`,
            }}
            animate={{
              rotate: isHovered ? [0, 5, -5, 0] : 0,
            }}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
            }}
          >
            {/* Detalhes do nó */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-2 bg-black/20 rounded-full" />
            </div>
          </motion.div>

          {/* Ícones de conquista */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute top-2 right-2"
              >
                {currentBelt === 'black' ? (
                  <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                ) : (
                  <Zap className="w-6 h-6 text-yellow-300" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Informações da faixa */}
      <div className="text-center space-y-2">
        <div className={`font-bold ${sizeConfig.fontSize}`}>
          Faixa {beltConfig.name}
        </div>
        <div className="text-sm text-muted-foreground">
          {totalPoints.toLocaleString('pt-BR')} pontos
        </div>
      </div>

      {/* Barra de progresso para próxima faixa */}
      {progressToNextBelt && (
        <div className="w-full max-w-xs space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span>{progressToNextBelt.percentage}%</span>
          </div>
          <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${beltConfig.primary}, ${beltConfig.secondary})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressToNextBelt.percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            {/* Brilho animado */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>
          <div className="text-xs text-center text-muted-foreground">
            Faltam {progressToNextBelt.pointsNeeded} pontos para{' '}
            <span className="font-semibold text-foreground">
              Faixa {BELT_COLORS[progressToNextBelt.nextBeltName as keyof typeof BELT_COLORS]?.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
