import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Star, Zap } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';

interface BeltLevelUpEffectProps {
  show: boolean;
  newBeltLevel: string;
  newBeltColor: string;
  onComplete: () => void;
}

export default function BeltLevelUpEffect({
  show,
  newBeltLevel,
  newBeltColor,
  onComplete,
}: BeltLevelUpEffectProps) {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (show) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
        setTimeout(onComplete, 500);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Confetti */}
          {showConfetti && (
            <Confetti
              width={width}
              height={height}
              recycle={false}
              numberOfPieces={200}
              gravity={0.3}
            />
          )}

          {/* Overlay escuro */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onComplete}
          >
            {/* Card de celebração */}
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              {/* Ícone de troféu animado */}
              <motion.div
                className="absolute -top-16 left-1/2 -translate-x-1/2"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="relative w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                    <Trophy className="w-12 h-12 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Título */}
              <motion.div
                className="text-center mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Parabéns! 🎉
                </h2>
                <p className="text-lg text-gray-600">
                  Você conquistou a faixa
                </p>
              </motion.div>

              {/* Nova faixa */}
              <motion.div
                className="my-8 flex justify-center"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, type: 'spring' }}
              >
                <div
                  className="w-48 h-24 rounded-lg shadow-2xl relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${newBeltColor} 0%, ${newBeltColor}dd 100%)`,
                  }}
                >
                  {/* Textura */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                        repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px),
                        repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)
                      `,
                    }}
                  />
                  {/* Nó */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-12 bg-black/20 rounded-sm" />
                  {/* Brilho */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              </motion.div>

              {/* Nome da faixa */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <p className="text-2xl font-bold text-gray-800 mb-4">
                  Faixa {newBeltLevel}
                </p>
              </motion.div>

              {/* Partículas flutuantes */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                {[...Array(15)].map((_, i) => {
                  const Icon = [Sparkles, Star, Zap][i % 3];
                  return (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                        y: [0, -50],
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    >
                      <Icon className="w-6 h-6 text-yellow-400" />
                    </motion.div>
                  );
                })}
              </div>

              {/* Botão de fechar */}
              <motion.button
                className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                onClick={onComplete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Continuar
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
