import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedProgressBarProps {
  currentPoints: number;
  minPoints: number;
  maxPoints: number;
  currentColor: string;
  nextColor?: string;
  height?: number;
  showPercentage?: boolean;
  className?: string;
}

export function AnimatedProgressBar({
  currentPoints,
  minPoints,
  maxPoints,
  currentColor,
  nextColor,
  height = 16,
  showPercentage = true,
  className
}: AnimatedProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  
  // Calcular progresso real
  const progress = Math.min(100, Math.max(0, 
    ((currentPoints - minPoints) / (maxPoints - minPoints)) * 100
  ));

  // Animar progresso gradualmente
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={cn('relative w-full', className)}>
      {/* Container da barra */}
      <div 
        className="relative w-full bg-gray-100 rounded-full overflow-hidden shadow-inner"
        style={{ height: `${height}px` }}
      >
        {/* Barra de progresso animada */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${displayProgress}%` }}
          transition={{ 
            duration: 1.5, 
            ease: [0.4, 0, 0.2, 1],
            delay: 0.2
          }}
          style={{
            background: nextColor
              ? `linear-gradient(90deg, ${currentColor} 0%, ${nextColor} 100%)`
              : currentColor,
            boxShadow: `0 0 20px ${currentColor}88, inset 0 2px 4px rgba(255,255,255,0.3)`
          }}
        >
          {/* Efeito de brilho animado (shimmer) */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: 1
            }}
            style={{
              width: '50%'
            }}
          />

          {/* Partículas flutuantes */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white/60"
              style={{
                left: `${20 + i * 15}%`,
                top: '50%',
                transform: 'translateY(-50%)'
              }}
              animate={{
                y: [-2, 2, -2],
                opacity: [0.4, 0.8, 0.4],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut'
              }}
            />
          ))}
        </motion.div>

        {/* Borda interna para profundidade */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
      </div>

      {/* Porcentagem e pontos */}
      {showPercentage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center justify-between mt-2 text-sm"
        >
          <span className="text-gray-600 font-medium">
            {currentPoints} / {maxPoints} pontos
          </span>
          <motion.span
            className="font-bold"
            style={{ color: currentColor }}
            animate={{
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            {Math.round(progress)}%
          </motion.span>
        </motion.div>
      )}

      {/* Indicador de próximo nível */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-center mt-3"
      >
        <span className="text-gray-500 text-sm">
          Faltam <span className="font-bold text-gray-800">{maxPoints - currentPoints}</span> pontos para o próximo nível
        </span>
      </motion.div>
    </div>
  );
}
