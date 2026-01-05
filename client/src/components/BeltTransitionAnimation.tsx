import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { BeltColor } from "@/components/KarateAvatar";

interface BeltTransitionAnimationProps {
  oldBelt: BeltColor;
  newBelt: BeltColor;
  isActive: boolean;
  onComplete?: () => void;
}

const BELT_COLORS: Record<BeltColor, string> = {
  white: "#FFFFFF",
  yellow: "#FFD700",
  orange: "#FF8C00",
  green: "#32CD32",
  blue: "#4169E1",
  purple: "#9370DB",
  brown: "#8B4513",
  black: "#1A1A1A",
};

const BELT_NAMES: Record<BeltColor, string> = {
  white: "Faixa Branca",
  yellow: "Faixa Amarela",
  orange: "Faixa Laranja",
  green: "Faixa Verde",
  blue: "Faixa Azul",
  purple: "Faixa Roxa",
  brown: "Faixa Marrom",
  black: "Faixa Preta",
};

export function BeltTransitionAnimation({ oldBelt, newBelt, isActive, onComplete }: BeltTransitionAnimationProps) {
  const [phase, setPhase] = useState<"morphing" | "celebration" | "complete">("morphing");
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (!isActive) return;

    // Fase 1: Morphing (2s)
    const morphTimer = setTimeout(() => {
      setPhase("celebration");
      generateParticles();
    }, 2000);

    // Fase 2: Celebração (2s)
    const celebrationTimer = setTimeout(() => {
      setPhase("complete");
    }, 4000);

    // Fase 3: Auto-fechar (1s após complete)
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 5000);

    return () => {
      clearTimeout(morphTimer);
      clearTimeout(celebrationTimer);
      clearTimeout(completeTimer);
    };
  }, [isActive, onComplete]);

  const generateParticles = () => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));
    setParticles(newParticles);
  };

  const isBlackBelt = newBelt === "black";

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onComplete}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative w-full max-w-2xl p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botão Fechar */}
          <button
            onClick={onComplete}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Container da Animação */}
          <div className="relative flex flex-col items-center justify-center space-y-8">
            {/* Título */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-white mb-2">
                {phase === "morphing" && "Evoluindo..."}
                {phase === "celebration" && "🎉 Parabéns! 🎉"}
                {phase === "complete" && "Nova Conquista!"}
              </h2>
              <p className="text-white/80">
                {phase === "morphing" && `${BELT_NAMES[oldBelt]} → ${BELT_NAMES[newBelt]}`}
                {phase === "celebration" && `Você conquistou a ${BELT_NAMES[newBelt]}!`}
                {phase === "complete" && "Continue treinando para evoluir ainda mais!"}
              </p>
            </motion.div>

            {/* Animação da Faixa */}
            <div className="relative w-96 h-32">
              {/* Partículas de fundo */}
              {phase === "celebration" &&
                particles.map((particle) => (
                  <motion.div
                    key={particle.id}
                    initial={{ opacity: 0, scale: 0, x: "50%", y: "50%" }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      x: `${particle.x}%`,
                      y: `${particle.y}%`,
                    }}
                    transition={{
                      duration: 1.5,
                      delay: Math.random() * 0.5,
                      ease: "easeOut",
                    }}
                    className="absolute w-2 h-2 rounded-full"
                    style={{ backgroundColor: BELT_COLORS[newBelt] }}
                  />
                ))}

              {/* Raios de Luz */}
              {phase === "celebration" && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={`ray-${i}`}
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: [0, 0.6, 0], scaleX: [0, 1, 0] }}
                      transition={{
                        duration: 1,
                        delay: i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                      className="absolute top-1/2 left-1/2 h-1 w-full origin-left"
                      style={{
                        background: `linear-gradient(to right, ${BELT_COLORS[newBelt]}, transparent)`,
                        transform: `rotate(${i * 45}deg)`,
                      }}
                    />
                  ))}
                </>
              )}

              {/* Faixa Principal com Morphing */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{
                  scale: phase === "celebration" ? [1, 1.1, 1] : 1,
                  rotate: phase === "celebration" ? [0, 5, -5, 0] : 0,
                }}
                transition={{
                  duration: 0.5,
                  repeat: phase === "celebration" ? Infinity : 0,
                  repeatDelay: 0.5,
                }}
              >
                {/* SVG da Faixa com Morphing de Cores */}
                <svg width="100%" height="100%" viewBox="0 0 400 120" className="drop-shadow-2xl">
                  <defs>
                    {/* Gradiente Morphing */}
                    <linearGradient id="beltGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <motion.stop
                        offset="0%"
                        animate={{
                          stopColor: phase === "morphing" ? BELT_COLORS[newBelt] : BELT_COLORS[newBelt],
                        }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                      />
                      <motion.stop
                        offset="100%"
                        animate={{
                          stopColor: phase === "morphing" ? BELT_COLORS[newBelt] : BELT_COLORS[newBelt],
                        }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                      />
                    </linearGradient>

                    {/* Brilho */}
                    <radialGradient id="shine">
                      <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </radialGradient>

                    {/* Sombra */}
                    <filter id="shadow">
                      <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.5" />
                    </filter>
                  </defs>

                  {/* Corpo da Faixa */}
                  <motion.rect
                    x="50"
                    y="35"
                    width="300"
                    height="50"
                    rx="25"
                    fill="url(#beltGradient)"
                    filter="url(#shadow)"
                    initial={{ fill: BELT_COLORS[oldBelt] }}
                    animate={{ fill: BELT_COLORS[newBelt] }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />

                  {/* Brilho Superior */}
                  {phase === "celebration" && (
                    <motion.ellipse
                      cx="200"
                      cy="50"
                      rx="100"
                      ry="15"
                      fill="url(#shine)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.6, 0] }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
                    />
                  )}

                  {/* Nó da Faixa */}
                  <motion.circle
                    cx="200"
                    cy="60"
                    r="20"
                    initial={{ fill: BELT_COLORS[oldBelt] }}
                    animate={{ fill: BELT_COLORS[newBelt] }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    filter="url(#shadow)"
                  />

                  {/* Pontas da Faixa */}
                  <motion.rect
                    x="190"
                    y="80"
                    width="8"
                    height="30"
                    rx="4"
                    initial={{ fill: BELT_COLORS[oldBelt] }}
                    animate={{ fill: BELT_COLORS[newBelt] }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                  <motion.rect
                    x="202"
                    y="80"
                    width="8"
                    height="30"
                    rx="4"
                    initial={{ fill: BELT_COLORS[oldBelt] }}
                    animate={{ fill: BELT_COLORS[newBelt] }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                </svg>
              </motion.div>

              {/* Efeito de Brilho Especial para Faixa Preta */}
              {isBlackBelt && phase === "celebration" && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-24 h-24 text-yellow-400" />
                </motion.div>
              )}
            </div>

            {/* Mensagem Especial para Faixa Preta */}
            {isBlackBelt && phase === "celebration" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-6 rounded-lg border border-yellow-500/30"
              >
                <p className="text-xl font-bold text-yellow-400 mb-2">🥋 Conquista Lendária! 🥋</p>
                <p className="text-white/90">
                  Você alcançou o mais alto nível! Parabéns, Mestre do Karatê!
                </p>
              </motion.div>
            )}

            {/* Botão de Continuar */}
            {phase === "complete" && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={onComplete}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
              >
                Continuar
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
