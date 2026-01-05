import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Zap, Star, Award } from 'lucide-react';

interface BeltDisplay3DProps {
  beltLevel: 'white' | 'yellow' | 'orange' | 'red' | 'green' | 'blue' | 'purple' | 'brown' | 'black';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadges?: boolean;
  badges?: Array<{
    type: 'velocista' | 'perfeccionista' | 'mestre' | 'dedicado';
    label: string;
  }>;
  showParticles?: boolean;
  onLevelUp?: () => void;
}

const beltColors = {
  white: { primary: '#F8F8F8', secondary: '#E0E0E0', shadow: '#C0C0C0', name: 'Branca' },
  yellow: { primary: '#FFD700', secondary: '#FFC700', shadow: '#E6B800', name: 'Amarela' },
  orange: { primary: '#FF8C00', secondary: '#FF7F00', shadow: '#E67300', name: 'Laranja' },
  red: { primary: '#DC143C', secondary: '#C41E3A', shadow: '#B01B35', name: 'Vermelha' },
  green: { primary: '#228B22', secondary: '#1F7A1F', shadow: '#1A6B1A', name: 'Verde' },
  blue: { primary: '#4169E1', secondary: '#3A5FCD', shadow: '#3355BB', name: 'Azul' },
  purple: { primary: '#8B008B', secondary: '#7D007D', shadow: '#6F006F', name: 'Roxa' },
  brown: { primary: '#8B4513', secondary: '#7D3E11', shadow: '#6F360F', name: 'Marrom' },
  black: { primary: '#1C1C1C', secondary: '#0A0A0A', shadow: '#000000', name: 'Preta' },
};

const sizeClasses = {
  sm: { container: 'w-32 h-16', badge: 'w-6 h-6 text-xs' },
  md: { container: 'w-48 h-24', badge: 'w-8 h-8 text-sm' },
  lg: { container: 'w-64 h-32', badge: 'w-10 h-10 text-base' },
  xl: { container: 'w-80 h-40', badge: 'w-12 h-12 text-lg' },
};

const badgeIcons = {
  velocista: Zap,
  perfeccionista: Star,
  mestre: Trophy,
  dedicado: Award,
};

const badgeColors = {
  velocista: 'from-yellow-400 to-orange-500',
  perfeccionista: 'from-blue-400 to-purple-500',
  mestre: 'from-amber-400 to-yellow-600',
  dedicado: 'from-green-400 to-emerald-600',
};

export default function BeltDisplay3D({
  beltLevel,
  size = 'md',
  showBadges = true,
  badges = [],
  showParticles = false,
  onLevelUp,
}: BeltDisplay3DProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = beltColors[beltLevel];
  const sizes = sizeClasses[size];

  return (
    <div className="relative inline-block">
      {/* Partículas de celebração */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
              initial={{ x: '50%', y: '50%', opacity: 1, scale: 0 }}
              animate={{
                x: `${50 + (Math.random() - 0.5) * 200}%`,
                y: `${50 + (Math.random() - 0.5) * 200}%`,
                opacity: 0,
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.05,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Container da faixa */}
      <motion.div
        className={`relative ${sizes.container} cursor-pointer`}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        animate={{
          rotateY: isHovered ? 15 : 0,
          rotateX: isHovered ? -5 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px',
        }}
      >
        {/* Brilho de fundo */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-lg blur-xl opacity-50"
            style={{ backgroundColor: colors.primary }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Faixa principal */}
        <div
          className="relative w-full h-full rounded-lg shadow-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.primary} 100%)`,
            boxShadow: `0 10px 30px ${colors.shadow}40, inset 0 1px 0 rgba(255,255,255,0.3)`,
          }}
        >
          {/* Textura de tecido */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px),
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)
              `,
            }}
          />

          {/* Nó da faixa */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="relative w-8 h-12 rounded-sm"
              style={{
                background: `linear-gradient(180deg, ${colors.secondary} 0%, ${colors.shadow} 100%)`,
                boxShadow: `0 4px 8px ${colors.shadow}60`,
              }}
            >
              {/* Detalhes do nó */}
              <div
                className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2"
                style={{ backgroundColor: colors.shadow }}
              />
              <div
                className="absolute top-1/3 left-0 w-full h-1"
                style={{ backgroundColor: colors.shadow, opacity: 0.5 }}
              />
              <div
                className="absolute top-2/3 left-0 w-full h-1"
                style={{ backgroundColor: colors.shadow, opacity: 0.5 }}
              />
            </div>
          </div>

          {/* Brilho superior */}
          <div
            className="absolute top-0 left-0 right-0 h-1/3 opacity-30"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
            }}
          />

          {/* Sombra inferior */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1/4 opacity-40"
            style={{
              background: 'linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 100%)',
            }}
          />
        </div>

        {/* Label da faixa */}
        <motion.div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-sm font-bold text-gray-700">{colors.name}</span>
        </motion.div>
      </motion.div>

      {/* Badges de conquista */}
      {showBadges && badges.length > 0 && (
        <div className="absolute -right-2 -top-2 flex flex-col gap-1">
          {badges.map((badge, index) => {
            const Icon = badgeIcons[badge.type];
            return (
              <motion.div
                key={index}
                className={`${sizes.badge} rounded-full bg-gradient-to-br ${badgeColors[badge.type]} shadow-lg flex items-center justify-center`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.2, rotate: 360 }}
                title={badge.label}
              >
                <Icon className="w-1/2 h-1/2 text-white drop-shadow-md" />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Indicador de hover */}
      {isHovered && (
        <motion.div
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Sparkles className="w-4 h-4 inline mr-1" />
          Clique para ver detalhes
        </motion.div>
      )}
    </div>
  );
}
