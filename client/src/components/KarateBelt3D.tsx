import React from 'react';

/**
 * Mapeamento de cores das faixas de karatê
 */
const BELT_COLORS = {
  white: {
    primary: '#F5F5F5',
    secondary: '#E0E0E0',
    shadow: '#BDBDBD',
    highlight: '#FFFFFF',
  },
  yellow: {
    primary: '#FFD700',
    secondary: '#FFC700',
    shadow: '#E6B800',
    highlight: '#FFEB3B',
  },
  orange: {
    primary: '#FF8C00',
    secondary: '#FF7700',
    shadow: '#E67700',
    highlight: '#FFA726',
  },
  red: {
    primary: '#DC143C',
    secondary: '#C41230',
    shadow: '#A01028',
    highlight: '#EF5350',
  },
  green: {
    primary: '#228B22',
    secondary: '#1E7A1E',
    shadow: '#186818',
    highlight: '#4CAF50',
  },
  blue: {
    primary: '#4169E1',
    secondary: '#3A5FCC',
    shadow: '#2E4BA8',
    highlight: '#5C7CFA',
  },
  purple: {
    primary: '#8B008B',
    secondary: '#7A007A',
    shadow: '#5E005E',
    highlight: '#AB47BC',
  },
  brown: {
    primary: '#8B4513',
    secondary: '#7A3D10',
    shadow: '#5E2F0D',
    highlight: '#A0522D',
  },
  black: {
    primary: '#1A1A1A',
    secondary: '#0D0D0D',
    shadow: '#000000',
    highlight: '#333333',
  },
};

export type BeltColor = keyof typeof BELT_COLORS;

interface KarateBelt3DProps {
  color: BeltColor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CONFIG = {
  sm: { width: 80, height: 50, strokeWidth: 1.5 },
  md: { width: 120, height: 75, strokeWidth: 2 },
  lg: { width: 160, height: 100, strokeWidth: 2.5 },
  xl: { width: 200, height: 125, strokeWidth: 3 },
};

/**
 * Componente de Faixa de Karatê 3D
 * Renderiza uma faixa de karatê com efeito 3D realista
 */
export const KarateBelt3D: React.FC<KarateBelt3DProps> = ({
  color,
  size = 'md',
  className = '',
}) => {
  const colors = BELT_COLORS[color];
  const config = SIZE_CONFIG[size];

  return (
    <svg
      width={config.width}
      height={config.height}
      viewBox="0 0 200 125"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradiente principal da faixa */}
        <linearGradient id={`beltGradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.highlight} stopOpacity="0.9" />
          <stop offset="30%" stopColor={colors.primary} />
          <stop offset="70%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor={colors.shadow} />
        </linearGradient>

        {/* Gradiente para o nó */}
        <radialGradient id={`knotGradient-${color}`}>
          <stop offset="0%" stopColor={colors.highlight} stopOpacity="0.8" />
          <stop offset="50%" stopColor={colors.primary} />
          <stop offset="100%" stopColor={colors.shadow} />
        </radialGradient>

        {/* Sombra suave */}
        <filter id="softShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="4" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Textura da faixa */}
        <pattern id={`beltTexture-${color}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill={colors.primary} />
          <line x1="0" y1="0" x2="4" y2="4" stroke={colors.shadow} strokeWidth="0.3" opacity="0.2" />
          <line x1="4" y1="0" x2="0" y2="4" stroke={colors.shadow} strokeWidth="0.3" opacity="0.2" />
        </pattern>
      </defs>

      {/* Grupo principal com sombra */}
      <g filter="url(#softShadow)">
        {/* Ponta esquerda da faixa */}
        <path
          d="M 20 35 L 20 90 L 35 95 L 35 30 Z"
          fill={`url(#beltGradient-${color})`}
          stroke={colors.shadow}
          strokeWidth={config.strokeWidth}
          opacity="0.95"
        />
        <path
          d="M 20 35 L 20 90 L 35 95 L 35 30 Z"
          fill={`url(#beltTexture-${color})`}
          opacity="0.3"
        />

        {/* Parte principal esquerda */}
        <path
          d="M 35 30 L 35 95 L 85 80 L 85 45 Z"
          fill={`url(#beltGradient-${color})`}
          stroke={colors.shadow}
          strokeWidth={config.strokeWidth}
        />
        <path
          d="M 35 30 L 35 95 L 85 80 L 85 45 Z"
          fill={`url(#beltTexture-${color})`}
          opacity="0.4"
        />

        {/* Nó central (círculo superior) */}
        <ellipse
          cx="100"
          cy="50"
          rx="20"
          ry="18"
          fill={`url(#knotGradient-${color})`}
          stroke={colors.shadow}
          strokeWidth={config.strokeWidth}
        />
        <ellipse
          cx="100"
          cy="50"
          rx="20"
          ry="18"
          fill={`url(#beltTexture-${color})`}
          opacity="0.5"
        />

        {/* Nó central (círculo inferior) */}
        <ellipse
          cx="100"
          cy="65"
          rx="18"
          ry="16"
          fill={`url(#knotGradient-${color})`}
          stroke={colors.shadow}
          strokeWidth={config.strokeWidth}
        />
        <ellipse
          cx="100"
          cy="65"
          rx="18"
          ry="16"
          fill={`url(#beltTexture-${color})`}
          opacity="0.5"
        />

        {/* Parte principal direita */}
        <path
          d="M 115 45 L 115 80 L 165 95 L 165 30 Z"
          fill={`url(#beltGradient-${color})`}
          stroke={colors.shadow}
          strokeWidth={config.strokeWidth}
        />
        <path
          d="M 115 45 L 115 80 L 165 95 L 165 30 Z"
          fill={`url(#beltTexture-${color})`}
          opacity="0.4"
        />

        {/* Ponta direita da faixa */}
        <path
          d="M 165 30 L 165 95 L 180 90 L 180 35 Z"
          fill={`url(#beltGradient-${color})`}
          stroke={colors.shadow}
          strokeWidth={config.strokeWidth}
          opacity="0.95"
        />
        <path
          d="M 165 30 L 165 95 L 180 90 L 180 35 Z"
          fill={`url(#beltTexture-${color})`}
          opacity="0.3"
        />

        {/* Detalhes de costura (linhas horizontais) */}
        <line x1="25" y1="45" x2="32" y2="43" stroke={colors.shadow} strokeWidth="0.5" opacity="0.4" />
        <line x1="25" y1="55" x2="32" y2="53" stroke={colors.shadow} strokeWidth="0.5" opacity="0.4" />
        <line x1="25" y1="65" x2="32" y2="63" stroke={colors.shadow} strokeWidth="0.5" opacity="0.4" />
        <line x1="25" y1="75" x2="32" y2="73" stroke={colors.shadow} strokeWidth="0.5" opacity="0.4" />

        <line x1="168" y1="43" x2="175" y2="45" stroke={colors.shadow} strokeWidth="0.5" opacity="0.4" />
        <line x1="168" y1="53" x2="175" y2="55" stroke={colors.shadow} strokeWidth="0.5" opacity="0.4" />
        <line x1="168" y1="63" x2="175" y2="65" stroke={colors.shadow} strokeWidth="0.5" opacity="0.4" />
        <line x1="168" y1="73" x2="175" y2="75" stroke={colors.shadow} strokeWidth="0.5" opacity="0.4" />

        {/* Highlights para efeito 3D */}
        <ellipse
          cx="95"
          cy="48"
          rx="8"
          ry="6"
          fill={colors.highlight}
          opacity="0.3"
        />
        <ellipse
          cx="95"
          cy="63"
          rx="7"
          ry="5"
          fill={colors.highlight}
          opacity="0.3"
        />
      </g>
    </svg>
  );
};

/**
 * Componente de display de faixa com label
 */
interface BeltDisplayProps {
  color: BeltColor;
  label: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

export const BeltDisplay: React.FC<BeltDisplayProps> = ({
  color,
  label,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const BELT_LABELS: Record<BeltColor, string> = {
    white: 'Faixa Branca',
    yellow: 'Faixa Amarela',
    orange: 'Faixa Laranja',
    red: 'Faixa Vermelha',
    green: 'Faixa Verde',
    blue: 'Faixa Azul',
    purple: 'Faixa Roxa',
    brown: 'Faixa Marrom',
    black: 'Faixa Preta',
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <KarateBelt3D color={color} size={size} />
      {showLabel && (
        <div className="text-center">
          <p className="font-bold text-sm text-gray-800">{BELT_LABELS[color]}</p>
          {label && <p className="text-xs text-gray-600">{label}</p>}
        </div>
      )}
    </div>
  );
};
