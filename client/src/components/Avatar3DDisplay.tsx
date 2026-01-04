import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { type BeltColor } from './KarateAvatar3D';

interface Avatar3DDisplayProps {
  belt: BeltColor;
  gender?: 'male' | 'female';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showLabel?: boolean;
  className?: string;
  interactive?: boolean;
  showGlow?: boolean;
  onClick?: () => void;
}

// Configuração das faixas
const BELT_CONFIG: Record<BeltColor, { 
  name: string; 
  glowColor: string;
  shadowColor: string;
}> = {
  white: { name: 'Faixa Branca', glowColor: 'rgba(156, 163, 175, 0.5)', shadowColor: 'shadow-lg shadow-gray-300' },
  yellow: { name: 'Faixa Amarela', glowColor: 'rgba(252, 211, 77, 0.5)', shadowColor: 'shadow-lg shadow-yellow-400' },
  orange: { name: 'Faixa Laranja', glowColor: 'rgba(251, 146, 60, 0.5)', shadowColor: 'shadow-lg shadow-orange-400' },
  green: { name: 'Faixa Verde', glowColor: 'rgba(74, 222, 128, 0.5)', shadowColor: 'shadow-lg shadow-green-400' },
  blue: { name: 'Faixa Azul', glowColor: 'rgba(96, 165, 250, 0.5)', shadowColor: 'shadow-lg shadow-blue-400' },
  purple: { name: 'Faixa Roxa', glowColor: 'rgba(167, 139, 250, 0.5)', shadowColor: 'shadow-lg shadow-purple-400' },
  brown: { name: 'Faixa Marrom', glowColor: 'rgba(180, 83, 9, 0.5)', shadowColor: 'shadow-lg shadow-amber-700' },
  black: { name: 'Faixa Preta', glowColor: 'rgba(251, 191, 36, 0.6)', shadowColor: 'shadow-lg shadow-yellow-500' },
};

// Tamanhos do avatar
const SIZES = {
  sm: { width: 80, height: 120 },
  md: { width: 150, height: 220 },
  lg: { width: 200, height: 280 },
  xl: { width: 240, height: 340 },
  '2xl': { width: 280, height: 400 },
};

// Mapeamento de imagens por gênero e faixa
const getAvatarImage = (gender: 'male' | 'female', belt: BeltColor): string => {
  return `/avatars/3d/${gender}_${belt}_belt.png`;
};

export const Avatar3DDisplay: React.FC<Avatar3DDisplayProps> = ({
  belt,
  gender = 'male',
  size = 'md',
  showLabel = false,
  className = '',
  interactive = false,
  showGlow = false,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { width, height } = SIZES[size];
  const beltConfig = BELT_CONFIG[belt];
  const imageSrc = getAvatarImage(gender, belt);
  const isBlackBelt = belt === 'black';

  const handleClick = () => {
    if (interactive && onClick) {
      onClick();
    }
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Container do Avatar com efeitos */}
      <div 
        className={cn(
          'relative rounded-2xl overflow-hidden transition-all duration-300',
          interactive && 'cursor-pointer',
          isHovered && interactive && 'scale-110',
          (showGlow || isBlackBelt || isHovered) && beltConfig.shadowColor,
          'group'
        )}
        style={{ width, height }}
        onClick={handleClick}
        onMouseEnter={() => interactive && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Glow de fundo animado */}
        {(showGlow || isBlackBelt || isHovered) && (
          <div 
            className="absolute inset-0 rounded-2xl animate-pulse-glow-slow"
            style={{ 
              backgroundColor: beltConfig.glowColor,
              filter: 'blur(20px)',
              zIndex: -1,
            }}
          />
        )}

        {/* Imagem 3D */}
        <img
          src={imageSrc}
          alt={`Avatar de karateca ${beltConfig.name}`}
          className={cn(
            'w-full h-full object-cover transition-all duration-300',
            isLoading && 'opacity-0',
            !isLoading && 'opacity-100',
            interactive && isHovered && 'drop-shadow-2xl'
          )}
          onLoad={() => setIsLoading(false)}
          style={{
            objectPosition: 'center',
          }}
        />

        {/* Efeito de brilho para faixa preta */}
        {isBlackBelt && (
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent pointer-events-none" />
        )}

        {/* Overlay de hover */}
        {interactive && isHovered && (
          <div className="absolute inset-0 bg-white/10 rounded-2xl transition-all duration-300" />
        )}

        {/* Skeleton loader */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        )}
      </div>

      {/* Label da faixa */}
      {showLabel && (
        <div className="mt-4 text-center">
          <p className="font-bold text-gray-800 text-sm">{beltConfig.name}</p>
        </div>
      )}
    </div>
  );
};
