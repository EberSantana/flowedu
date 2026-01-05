import React from 'react';

export type BeltColor = 
  | 'white' 
  | 'yellow' 
  | 'orange' 
  | 'green' 
  | 'blue' 
  | 'purple' 
  | 'brown' 
  | 'black';

interface BeltBadge3DProps {
  color: BeltColor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showLabel?: boolean;
}

const BELT_CONFIG: Record<BeltColor, { 
  primary: string; 
  secondary: string; 
  shadow: string; 
  label: string;
  gradient: string;
}> = {
  white: { 
    primary: '#FFFFFF', 
    secondary: '#F5F5F5', 
    shadow: '#D0D0D0', 
    label: 'Faixa Branca',
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F0F0F0 50%, #E8E8E8 100%)'
  },
  yellow: { 
    primary: '#FFD700', 
    secondary: '#FFC700', 
    shadow: '#CC9900', 
    label: 'Faixa Amarela',
    gradient: 'linear-gradient(135deg, #FFE55C 0%, #FFD700 50%, #FFC700 100%)'
  },
  orange: { 
    primary: '#FF8C00', 
    secondary: '#FF7700', 
    shadow: '#CC6600', 
    label: 'Faixa Laranja',
    gradient: 'linear-gradient(135deg, #FFA040 0%, #FF8C00 50%, #FF7700 100%)'
  },
  green: { 
    primary: '#32CD32', 
    secondary: '#28B828', 
    shadow: '#228822', 
    label: 'Faixa Verde',
    gradient: 'linear-gradient(135deg, #50E050 0%, #32CD32 50%, #28B828 100%)'
  },
  blue: { 
    primary: '#1E90FF', 
    secondary: '#1873CC', 
    shadow: '#1560AA', 
    label: 'Faixa Azul',
    gradient: 'linear-gradient(135deg, #4AA8FF 0%, #1E90FF 50%, #1873CC 100%)'
  },
  purple: { 
    primary: '#9370DB', 
    secondary: '#7B5CB8', 
    shadow: '#634A95', 
    label: 'Faixa Roxa',
    gradient: 'linear-gradient(135deg, #B090E8 0%, #9370DB 50%, #7B5CB8 100%)'
  },
  brown: { 
    primary: '#8B4513', 
    secondary: '#723810', 
    shadow: '#5A2C0D', 
    label: 'Faixa Marrom',
    gradient: 'linear-gradient(135deg, #A0522D 0%, #8B4513 50%, #723810 100%)'
  },
  black: { 
    primary: '#1A1A1A', 
    secondary: '#0F0F0F', 
    shadow: '#000000', 
    label: 'Faixa Preta',
    gradient: 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 50%, #0F0F0F 100%)'
  },
};

const SIZE_CONFIG = {
  sm: { width: 80, height: 24, knot: 16, fontSize: 'text-xs' },
  md: { width: 120, height: 32, knot: 24, fontSize: 'text-sm' },
  lg: { width: 160, height: 40, knot: 32, fontSize: 'text-base' },
  xl: { width: 200, height: 48, knot: 40, fontSize: 'text-lg' },
};

export function BeltBadge3D({ 
  color, 
  size = 'md', 
  className = '',
  showLabel = false 
}: BeltBadge3DProps) {
  const config = BELT_CONFIG[color];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <svg
        width={sizeConfig.width}
        height={sizeConfig.height}
        viewBox="0 0 200 48"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <defs>
          {/* Gradiente principal da faixa */}
          <linearGradient id={`belt-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={config.primary} stopOpacity="1" />
            <stop offset="50%" stopColor={config.secondary} stopOpacity="1" />
            <stop offset="100%" stopColor={config.shadow} stopOpacity="1" />
          </linearGradient>

          {/* Gradiente do nó */}
          <radialGradient id={`knot-gradient-${color}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={config.primary} stopOpacity="1" />
            <stop offset="60%" stopColor={config.secondary} stopOpacity="1" />
            <stop offset="100%" stopColor={config.shadow} stopOpacity="1" />
          </radialGradient>

          {/* Textura de tecido (linhas sutis) */}
          <pattern id={`fabric-texture-${color}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="4" stroke={config.shadow} strokeWidth="0.3" opacity="0.15" />
            <line x1="2" y1="0" x2="2" y2="4" stroke={config.primary} strokeWidth="0.2" opacity="0.1" />
          </pattern>

          {/* Sombra interna */}
          <filter id={`inner-shadow-${color}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
            <feOffset dx="0" dy="1" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.4" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Sombra externa */}
          <filter id={`drop-shadow-${color}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ponta esquerda da faixa */}
        <path
          d="M 10 18 L 2 24 L 10 30 L 70 30 L 70 18 Z"
          fill={`url(#belt-gradient-${color})`}
          filter={`url(#drop-shadow-${color})`}
          opacity="0.95"
        />
        <rect
          x="10"
          y="18"
          width="60"
          height="12"
          fill={`url(#fabric-texture-${color})`}
          opacity="0.6"
        />

        {/* Ponta direita da faixa */}
        <path
          d="M 130 18 L 130 30 L 190 30 L 198 24 L 190 18 Z"
          fill={`url(#belt-gradient-${color})`}
          filter={`url(#drop-shadow-${color})`}
          opacity="0.95"
        />
        <rect
          x="130"
          y="18"
          width="60"
          height="12"
          fill={`url(#fabric-texture-${color})`}
          opacity="0.6"
        />

        {/* Nó central - camada de fundo */}
        <ellipse
          cx="100"
          cy="24"
          rx="22"
          ry="18"
          fill={config.shadow}
          opacity="0.4"
          filter={`url(#drop-shadow-${color})`}
        />

        {/* Nó central - camada principal */}
        <g filter={`url(#inner-shadow-${color})`}>
          {/* Parte de trás do nó */}
          <path
            d="M 85 20 Q 80 24 85 28 L 95 28 Q 90 24 95 20 Z"
            fill={config.shadow}
            opacity="0.7"
          />
          <path
            d="M 105 20 Q 110 24 105 28 L 115 28 Q 120 24 115 20 Z"
            fill={config.shadow}
            opacity="0.7"
          />

          {/* Centro do nó */}
          <ellipse
            cx="100"
            cy="24"
            rx="18"
            ry="15"
            fill={`url(#knot-gradient-${color})`}
          />

          {/* Textura do nó */}
          <ellipse
            cx="100"
            cy="24"
            rx="18"
            ry="15"
            fill={`url(#fabric-texture-${color})`}
            opacity="0.5"
          />

          {/* Highlight no nó */}
          <ellipse
            cx="95"
            cy="20"
            rx="8"
            ry="6"
            fill="white"
            opacity="0.25"
          />

          {/* Linhas de dobra do nó */}
          <path
            d="M 88 24 Q 100 22 112 24"
            stroke={config.shadow}
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M 90 28 Q 100 26 110 28"
            stroke={config.shadow}
            strokeWidth="0.8"
            fill="none"
            opacity="0.3"
          />
        </g>

        {/* Pontas caídas do nó */}
        <path
          d="M 95 32 L 93 42 L 97 42 L 95 32 Z"
          fill={`url(#belt-gradient-${color})`}
          opacity="0.85"
          filter={`url(#drop-shadow-${color})`}
        />
        <path
          d="M 105 32 L 103 42 L 107 42 L 105 32 Z"
          fill={`url(#belt-gradient-${color})`}
          opacity="0.85"
          filter={`url(#drop-shadow-${color})`}
        />

        {/* Textura nas pontas caídas */}
        <rect
          x="93"
          y="32"
          width="4"
          height="10"
          fill={`url(#fabric-texture-${color})`}
          opacity="0.4"
        />
        <rect
          x="103"
          y="32"
          width="4"
          height="10"
          fill={`url(#fabric-texture-${color})`}
          opacity="0.4"
        />
      </svg>

      {showLabel && (
        <span className={`font-semibold text-gray-700 ${sizeConfig.fontSize}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}
