import React, { useState } from 'react';
import { cn } from '@/lib/utils';

// Tipos de faixa
export type BeltColor = 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'purple' | 'brown' | 'black';

interface KimonoAvatarDisplayProps {
  belt: BeltColor;
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
  borderColor: string;
  textColor: string;
}> = {
  white: { 
    name: 'Faixa Branca', 
    glowColor: 'rgba(156, 163, 175, 0.4)', 
    shadowColor: 'shadow-xl shadow-gray-300/50',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-600'
  },
  yellow: { 
    name: 'Faixa Amarela', 
    glowColor: 'rgba(252, 211, 77, 0.5)', 
    shadowColor: 'shadow-xl shadow-yellow-400/50',
    borderColor: 'border-yellow-400',
    textColor: 'text-yellow-600'
  },
  orange: { 
    name: 'Faixa Laranja', 
    glowColor: 'rgba(251, 146, 60, 0.5)', 
    shadowColor: 'shadow-xl shadow-orange-400/50',
    borderColor: 'border-orange-400',
    textColor: 'text-orange-600'
  },
  green: { 
    name: 'Faixa Verde', 
    glowColor: 'rgba(74, 222, 128, 0.5)', 
    shadowColor: 'shadow-xl shadow-green-400/50',
    borderColor: 'border-green-500',
    textColor: 'text-green-600'
  },
  blue: { 
    name: 'Faixa Azul', 
    glowColor: 'rgba(96, 165, 250, 0.5)', 
    shadowColor: 'shadow-xl shadow-blue-400/50',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-600'
  },
  purple: { 
    name: 'Faixa Roxa', 
    glowColor: 'rgba(167, 139, 250, 0.5)', 
    shadowColor: 'shadow-xl shadow-purple-400/50',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-600'
  },
  brown: { 
    name: 'Faixa Marrom', 
    glowColor: 'rgba(180, 83, 9, 0.5)', 
    shadowColor: 'shadow-xl shadow-amber-700/50',
    borderColor: 'border-amber-700',
    textColor: 'text-amber-700'
  },
  black: { 
    name: 'Faixa Preta', 
    glowColor: 'rgba(251, 191, 36, 0.6)', 
    shadowColor: 'shadow-2xl shadow-yellow-500/60',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-500'
  },
};

// Tamanhos do avatar
const SIZES = {
  sm: { width: 64, height: 88, imageClass: 'w-16 h-22' },
  md: { width: 120, height: 160, imageClass: 'w-30 h-40' },
  lg: { width: 160, height: 220, imageClass: 'w-40 h-55' },
  xl: { width: 200, height: 280, imageClass: 'w-50 h-70' },
  '2xl': { width: 240, height: 340, imageClass: 'w-60 h-85' },
};

// Mapeamento de imagens por faixa
const getKimonoImage = (belt: BeltColor): string => {
  return `/avatars/kimono-${belt}-belt.png`;
};

export const KimonoAvatarDisplay: React.FC<KimonoAvatarDisplayProps> = ({
  belt,
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
  const imageSrc = getKimonoImage(belt);
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
          'bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900',
          'border-2',
          beltConfig.borderColor,
          interactive && 'cursor-pointer',
          isHovered && interactive && 'scale-105',
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
            className="absolute -inset-2 rounded-3xl animate-pulse"
            style={{ 
              backgroundColor: beltConfig.glowColor,
              filter: 'blur(20px)',
              zIndex: -1,
            }}
          />
        )}

        {/* Imagem do Kimono */}
        <img
          src={imageSrc}
          alt={`Kimono com ${beltConfig.name}`}
          className={cn(
            'w-full h-full object-cover object-top transition-all duration-300',
            isLoading && 'opacity-0',
            !isLoading && 'opacity-100',
            interactive && isHovered && 'brightness-110'
          )}
          onLoad={() => setIsLoading(false)}
          onError={(e) => {
            // Fallback para imagem de faixa branca se não encontrar
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('white-belt')) {
              target.src = '/avatars/kimono-white-belt.png';
            }
          }}
        />

        {/* Efeito de brilho para faixa preta */}
        {isBlackBelt && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/30 to-transparent pointer-events-none" />
            <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center">
              <span className="text-yellow-400 text-lg animate-pulse">⭐</span>
            </div>
          </>
        )}

        {/* Badge da faixa no canto inferior */}
        <div className={cn(
          'absolute bottom-2 left-1/2 transform -translate-x-1/2',
          'px-3 py-1 rounded-full text-xs font-bold',
          'bg-white/95 backdrop-blur-sm shadow-lg',
          beltConfig.textColor,
          'border',
          beltConfig.borderColor
        )}>
          {beltConfig.name.replace('Faixa ', '')}
        </div>

        {/* Overlay de hover */}
        {interactive && isHovered && (
          <div className="absolute inset-0 bg-white/10 rounded-2xl transition-all duration-300" />
        )}

        {/* Skeleton loader */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-pulse" />
        )}
      </div>

      {/* Label da faixa */}
      {showLabel && (
        <div className={cn(
          'mt-4 px-4 py-2 rounded-full text-center',
          'bg-white shadow-md border',
          beltConfig.borderColor
        )}>
          <p className={cn('font-bold text-sm', beltConfig.textColor)}>
            {beltConfig.name}
          </p>
        </div>
      )}
    </div>
  );
};

// Componente compacto para sidebar/header
export const KimonoAvatarCompact: React.FC<{
  belt: BeltColor;
  points?: number;
  className?: string;
}> = ({ belt, points, className }) => {
  const beltConfig = BELT_CONFIG[belt];
  
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <KimonoAvatarDisplay belt={belt} size="sm" showGlow={belt === 'black'} />
      <div className="flex flex-col">
        <span className={cn('text-sm font-bold', beltConfig.textColor)}>
          {beltConfig.name}
        </span>
        {points !== undefined && (
          <span className="text-xs text-gray-500">
            {points.toLocaleString()} pontos
          </span>
        )}
      </div>
    </div>
  );
};

// Showcase de todos os kimonos
export const KimonoShowcase: React.FC = () => {
  const belts: BeltColor[] = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black'];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6">
      {belts.map((belt) => (
        <KimonoAvatarDisplay 
          key={belt} 
          belt={belt} 
          size="lg" 
          showLabel 
          showGlow={belt === 'black'}
          interactive
        />
      ))}
    </div>
  );
};

export default KimonoAvatarDisplay;
