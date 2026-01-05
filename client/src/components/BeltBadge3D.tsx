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
  image: string;
  label: string;
}> = {
  white: { 
    image: '/belt-3d-v2-option1.png',
    label: 'Faixa Branca',
  },
  yellow: { 
    image: '/belt-3d-yellow.png',
    label: 'Faixa Amarela',
  },
  orange: { 
    image: '/belt-3d-orange.png',
    label: 'Faixa Laranja',
  },
  green: { 
    image: '/belt-3d-green.png',
    label: 'Faixa Verde',
  },
  blue: { 
    image: '/belt-3d-green.png', // Usando verde como fallback para azul
    label: 'Faixa Azul',
  },
  purple: { 
    image: '/belt-3d-purple.png',
    label: 'Faixa Roxa',
  },
  brown: { 
    image: '/belt-3d-brown.png',
    label: 'Faixa Marrom',
  },
  black: { 
    image: '/belt-3d-black.png',
    label: 'Faixa Preta',
  },
};

const SIZE_CONFIG = {
  sm: { width: 120, height: 40 },
  md: { width: 180, height: 60 },
  lg: { width: 240, height: 80 },
  xl: { width: 300, height: 100 },
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
    <div className={`inline-flex flex-col items-center gap-3 ${className}`}>
      <img
        src={config.image}
        alt={config.label}
        className="object-contain drop-shadow-lg"
        style={{
          width: `${sizeConfig.width}px`,
          height: `${sizeConfig.height}px`,
        }}
      />

      {showLabel && (
        <span className="font-semibold text-gray-700 text-sm">
          {config.label}
        </span>
      )}
    </div>
  );
}
