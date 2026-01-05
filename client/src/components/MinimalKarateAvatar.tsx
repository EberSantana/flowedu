import React from 'react';

// Definição das 8 faixas do karatê
export type BeltColor = 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'purple' | 'brown' | 'black';

interface MinimalKarateAvatarProps {
  belt: BeltColor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

// Mapeamento de cores das faixas
const BELT_COLORS: Record<BeltColor, { primary: string; secondary: string; name: string; glow: string }> = {
  white: { primary: '#FFFFFF', secondary: '#E5E7EB', name: 'Faixa Branca', glow: 'rgba(255,255,255,0.3)' },
  yellow: { primary: '#FCD34D', secondary: '#F59E0B', name: 'Faixa Amarela', glow: 'rgba(252,211,77,0.4)' },
  orange: { primary: '#FB923C', secondary: '#EA580C', name: 'Faixa Laranja', glow: 'rgba(251,146,60,0.4)' },
  green: { primary: '#4ADE80', secondary: '#16A34A', name: 'Faixa Verde', glow: 'rgba(74,222,128,0.4)' },
  blue: { primary: '#60A5FA', secondary: '#2563EB', name: 'Faixa Azul', glow: 'rgba(96,165,250,0.4)' },
  purple: { primary: '#A78BFA', secondary: '#7C3AED', name: 'Faixa Roxa', glow: 'rgba(167,139,250,0.4)' },
  brown: { primary: '#A16207', secondary: '#78350F', name: 'Faixa Marrom', glow: 'rgba(161,98,7,0.4)' },
  black: { primary: '#1F2937', secondary: '#000000', name: 'Faixa Preta', glow: 'rgba(31,41,55,0.5)' },
};

// Tamanhos do avatar
const SIZES = {
  sm: { width: 60, height: 80, fontSize: 'text-xs' },
  md: { width: 90, height: 120, fontSize: 'text-sm' },
  lg: { width: 120, height: 160, fontSize: 'text-base' },
  xl: { width: 160, height: 210, fontSize: 'text-lg' },
};

export const MinimalKarateAvatar: React.FC<MinimalKarateAvatarProps> = ({
  belt,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const { width, height, fontSize } = SIZES[size];
  const beltColor = BELT_COLORS[belt];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Glow effect behind the belt */}
        <defs>
          <filter id={`glow-${belt}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="kimonoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F3F4F6" />
          </linearGradient>
        </defs>

        {/* Cabeça - silhueta simples */}
        <circle cx="50" cy="22" r="16" fill="#E5E7EB" />
        
        {/* Pescoço */}
        <rect x="44" y="36" width="12" height="8" fill="#E5E7EB" />
        
        {/* Kimono (corpo) - branco limpo */}
        <path
          d="M 50 44 L 25 58 L 25 100 L 38 100 L 38 85 L 50 90 L 62 85 L 62 100 L 75 100 L 75 58 Z"
          fill="url(#kimonoGradient)"
          stroke="#D1D5DB"
          strokeWidth="1.5"
        />
        
        {/* Gola do kimono (V) */}
        <path
          d="M 38 44 L 50 56 L 62 44"
          stroke="#D1D5DB"
          strokeWidth="1.5"
          fill="none"
        />
        
        {/* Faixa (cintura) - destaque principal */}
        <g filter={`url(#glow-${belt})`}>
          <rect
            x="23"
            y="68"
            width="54"
            height="7"
            fill={beltColor.primary}
            stroke={beltColor.secondary}
            strokeWidth="1.5"
            rx="1"
          />
          
          {/* Nó da faixa */}
          <rect
            x="47"
            y="66"
            width="6"
            height="11"
            fill={beltColor.secondary}
            rx="1"
          />
          
          {/* Pontas da faixa */}
          <rect
            x="44"
            y="75"
            width="3"
            height="12"
            fill={beltColor.primary}
            stroke={beltColor.secondary}
            strokeWidth="0.5"
            rx="0.5"
          />
          <rect
            x="53"
            y="75"
            width="3"
            height="12"
            fill={beltColor.primary}
            stroke={beltColor.secondary}
            strokeWidth="0.5"
            rx="0.5"
          />
        </g>
        
        {/* Braços - silhueta */}
        <path
          d="M 25 58 L 12 75 L 15 78 L 28 63"
          fill="#E5E7EB"
          stroke="#D1D5DB"
          strokeWidth="1"
        />
        <path
          d="M 75 58 L 88 75 L 85 78 L 72 63"
          fill="#E5E7EB"
          stroke="#D1D5DB"
          strokeWidth="1"
        />
        
        {/* Mãos - círculos simples */}
        <circle cx="13" cy="77" r="4" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />
        <circle cx="87" cy="77" r="4" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />
        
        {/* Pernas */}
        <rect
          x="33"
          y="100"
          width="12"
          height="22"
          fill="url(#kimonoGradient)"
          stroke="#D1D5DB"
          strokeWidth="1"
        />
        <rect
          x="55"
          y="100"
          width="12"
          height="22"
          fill="url(#kimonoGradient)"
          stroke="#D1D5DB"
          strokeWidth="1"
        />
        
        {/* Pés */}
        <ellipse cx="39" cy="124" rx="7" ry="3" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />
        <ellipse cx="61" cy="124" rx="7" ry="3" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />
      </svg>

      {showLabel && (
        <div className={`mt-2 text-center ${fontSize}`}>
          <p className="font-bold text-gray-700">{beltColor.name}</p>
        </div>
      )}
    </div>
  );
};

// Helper para calcular faixa baseado em Tech Coins
export function getBeltFromPoints(techCoins: number): BeltColor {
  if (techCoins >= 5000) return 'black';
  if (techCoins >= 2500) return 'brown';
  if (techCoins >= 1500) return 'purple';
  if (techCoins >= 1000) return 'blue';
  if (techCoins >= 600) return 'green';
  if (techCoins >= 300) return 'orange';
  if (techCoins >= 100) return 'yellow';
  return 'white';
}

// Helper para próximo threshold
export function getNextBeltThreshold(techCoins: number): number {
  if (techCoins >= 5000) return 5000;
  if (techCoins >= 2500) return 5000;
  if (techCoins >= 1500) return 2500;
  if (techCoins >= 1000) return 1500;
  if (techCoins >= 600) return 1000;
  if (techCoins >= 300) return 600;
  if (techCoins >= 100) return 300;
  return 100;
}

// Helper para nome da faixa
export function getBeltName(belt: BeltColor): string {
  return BELT_COLORS[belt].name;
}

// Configuração de faixas exportada
export const BELT_CONFIG = [
  { name: 'white' as BeltColor, label: 'Branca', minPoints: 0, color: '#9CA3AF' },
  { name: 'yellow' as BeltColor, label: 'Amarela', minPoints: 100, color: '#FBBF24' },
  { name: 'orange' as BeltColor, label: 'Laranja', minPoints: 300, color: '#F97316' },
  { name: 'green' as BeltColor, label: 'Verde', minPoints: 600, color: '#10B981' },
  { name: 'blue' as BeltColor, label: 'Azul', minPoints: 1000, color: '#3B82F6' },
  { name: 'purple' as BeltColor, label: 'Roxa', minPoints: 1500, color: '#8B5CF6' },
  { name: 'brown' as BeltColor, label: 'Marrom', minPoints: 2500, color: '#92400E' },
  { name: 'black' as BeltColor, label: 'Preta', minPoints: 5000, color: '#1F2937' },
];

export default MinimalKarateAvatar;
