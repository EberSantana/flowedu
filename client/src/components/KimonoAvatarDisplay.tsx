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

// Configuração das faixas com cores reais
const BELT_CONFIG: Record<BeltColor, { 
  name: string; 
  color: string;
  glowColor: string;
  shadowColor: string;
  borderColor: string;
  textColor: string;
  bgGradient: string;
}> = {
  white: { 
    name: 'Faixa Branca',
    color: '#FFFFFF',
    glowColor: 'rgba(156, 163, 175, 0.6)', 
    shadowColor: 'shadow-2xl shadow-gray-400/60',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-700',
    bgGradient: 'from-gray-50 to-gray-100'
  },
  yellow: { 
    name: 'Faixa Amarela',
    color: '#FCD34D',
    glowColor: 'rgba(252, 211, 77, 0.7)', 
    shadowColor: 'shadow-2xl shadow-yellow-400/70',
    borderColor: 'border-yellow-400',
    textColor: 'text-yellow-700',
    bgGradient: 'from-yellow-100 to-yellow-200'
  },
  orange: { 
    name: 'Faixa Laranja',
    color: '#FB923C',
    glowColor: 'rgba(251, 146, 60, 0.7)', 
    shadowColor: 'shadow-2xl shadow-orange-400/70',
    borderColor: 'border-orange-400',
    textColor: 'text-orange-700',
    bgGradient: 'from-orange-100 to-orange-200'
  },
  green: { 
    name: 'Faixa Verde',
    color: '#4ADE80',
    glowColor: 'rgba(74, 222, 128, 0.7)', 
    shadowColor: 'shadow-2xl shadow-green-400/70',
    borderColor: 'border-green-500',
    textColor: 'text-green-700',
    bgGradient: 'from-green-100 to-green-200'
  },
  blue: { 
    name: 'Faixa Azul',
    color: '#60A5FA',
    glowColor: 'rgba(96, 165, 250, 0.7)', 
    shadowColor: 'shadow-2xl shadow-blue-400/70',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-700',
    bgGradient: 'from-blue-100 to-blue-200'
  },
  purple: { 
    name: 'Faixa Roxa',
    color: '#A78BFA',
    glowColor: 'rgba(167, 139, 250, 0.7)', 
    shadowColor: 'shadow-2xl shadow-purple-400/70',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-700',
    bgGradient: 'from-purple-100 to-purple-200'
  },
  brown: { 
    name: 'Faixa Marrom',
    color: '#92400E',
    glowColor: 'rgba(146, 64, 14, 0.7)', 
    shadowColor: 'shadow-2xl shadow-amber-800/70',
    borderColor: 'border-amber-800',
    textColor: 'text-amber-800',
    bgGradient: 'from-amber-200 to-amber-300'
  },
  black: { 
    name: 'Faixa Preta',
    color: '#1F2937',
    glowColor: 'rgba(251, 191, 36, 0.8)', 
    shadowColor: 'shadow-2xl shadow-yellow-500/80',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-600',
    bgGradient: 'from-gray-800 to-gray-900'
  },
};

// Tamanhos do avatar (ajustados para proporção do kimono 3D)
const SIZES = {
  sm: { container: 'w-20 h-24', image: 'w-16 h-20', belt: 'h-2', badge: 'text-[8px] px-1.5 py-0.5' },
  md: { container: 'w-32 h-40', image: 'w-28 h-36', belt: 'h-3', badge: 'text-[10px] px-2 py-0.5' },
  lg: { container: 'w-44 h-56', image: 'w-40 h-52', belt: 'h-4', badge: 'text-xs px-2.5 py-1' },
  xl: { container: 'w-56 h-72', image: 'w-52 h-68', belt: 'h-5', badge: 'text-sm px-3 py-1' },
  '2xl': { container: 'w-72 h-96', image: 'w-64 h-88', belt: 'h-6', badge: 'text-base px-4 py-1.5' },
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
  const sizeConfig = SIZES[size];
  const beltConfig = BELT_CONFIG[belt];
  const isBlackBelt = belt === 'black';
  const shouldShowGlow = showGlow || isBlackBelt || (interactive && isHovered);

  const handleClick = () => {
    if (interactive && onClick) {
      onClick();
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Container principal do avatar */}
      <div 
        className={cn(
          'relative flex items-center justify-center',
          sizeConfig.container,
          interactive && 'cursor-pointer group',
          'transition-all duration-500 ease-out',
          isHovered && interactive && 'scale-110'
        )}
        onClick={handleClick}
        onMouseEnter={() => interactive && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Glow de fundo animado */}
        {shouldShowGlow && (
          <>
            <div 
              className={cn(
                'absolute inset-0 rounded-full blur-2xl animate-pulse',
                'transition-all duration-700',
                isHovered ? 'scale-125 opacity-80' : 'scale-100 opacity-60'
              )}
              style={{ 
                backgroundColor: beltConfig.glowColor,
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            />
            {isBlackBelt && (
              <div 
                className="absolute inset-0 rounded-full blur-3xl animate-pulse"
                style={{ 
                  backgroundColor: 'rgba(251, 191, 36, 0.4)',
                  animationDelay: '1s'
                }}
              />
            )}
          </>
        )}

        {/* Container do kimono com borda e sombra */}
        <div 
          className={cn(
            'relative rounded-3xl overflow-hidden',
            'bg-gradient-to-b from-slate-100 via-slate-50 to-white',
            'border-4 transition-all duration-500',
            beltConfig.borderColor,
            shouldShowGlow && beltConfig.shadowColor,
            sizeConfig.container
          )}
        >
          {/* Imagem do kimono 3D */}
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <img
              src="/karate-kimono-avatar.webp"
              alt={`Kimono com ${beltConfig.name}`}
              className={cn(
                'object-contain transition-all duration-500',
                sizeConfig.image,
                isLoading && 'opacity-0 scale-95',
                !isLoading && 'opacity-100 scale-100',
                interactive && isHovered && 'brightness-110 scale-105'
              )}
              onLoad={() => setIsLoading(false)}
            />

            {/* Faixa colorida sobreposta */}
            <div 
              className={cn(
                'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                'w-[85%] rounded-sm',
                'shadow-lg transition-all duration-500',
                sizeConfig.belt,
                isHovered && interactive && 'scale-110 shadow-xl'
              )}
              style={{ 
                backgroundColor: beltConfig.color,
                boxShadow: `0 4px 20px ${beltConfig.glowColor}`
              }}
            >
              {/* Brilho na faixa */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                style={{
                  animation: isHovered ? 'shine 1.5s ease-in-out infinite' : 'none'
                }}
              />
            </div>
          </div>

          {/* Efeitos especiais para faixa preta */}
          {isBlackBelt && (
            <>
              {/* Brilho dourado */}
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 via-transparent to-transparent pointer-events-none" />
              
              {/* Estrelas animadas */}
              <div className="absolute top-2 right-2 flex gap-1">
                <span className="text-yellow-400 text-lg animate-pulse" style={{ animationDelay: '0s' }}>⭐</span>
                <span className="text-yellow-400 text-lg animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</span>
              </div>
              
              {/* Partículas douradas */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-float"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.5}s`,
                      animationDuration: `${3 + Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Badge da faixa */}
          <div className={cn(
            'absolute bottom-2 left-1/2 transform -translate-x-1/2',
            'rounded-full font-bold',
            'bg-white/95 backdrop-blur-sm shadow-lg',
            'border-2 transition-all duration-300',
            beltConfig.textColor,
            beltConfig.borderColor,
            sizeConfig.badge,
            isHovered && 'scale-110'
          )}>
            {beltConfig.name.replace('Faixa ', '')}
          </div>

          {/* Overlay de hover */}
          {interactive && isHovered && (
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/10 rounded-3xl transition-all duration-300" />
          )}

          {/* Skeleton loader */}
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-3xl" />
          )}
        </div>

        {/* Anel de destaque para hover */}
        {interactive && isHovered && (
          <div 
            className={cn(
              'absolute inset-0 rounded-full border-2',
              beltConfig.borderColor,
              'animate-ping opacity-75'
            )}
          />
        )}
      </div>

      {/* Label da faixa */}
      {showLabel && (
        <div className={cn(
          'px-4 py-2 rounded-full text-center',
          'bg-gradient-to-r shadow-lg border-2 transition-all duration-300',
          beltConfig.bgGradient,
          beltConfig.borderColor,
          isHovered && 'scale-105'
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8">
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
