import React from 'react';

// Definição das 8 faixas do karatê
export type BeltColor = 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'purple' | 'brown' | 'black';

interface KarateAvatarProps {
  belt: BeltColor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

// Mapeamento de cores das faixas
const BELT_COLORS: Record<BeltColor, { primary: string; secondary: string; name: string }> = {
  white: { primary: '#FFFFFF', secondary: '#E5E7EB', name: 'Faixa Branca' },
  yellow: { primary: '#FCD34D', secondary: '#F59E0B', name: 'Faixa Amarela' },
  orange: { primary: '#FB923C', secondary: '#EA580C', name: 'Faixa Laranja' },
  green: { primary: '#4ADE80', secondary: '#16A34A', name: 'Faixa Verde' },
  blue: { primary: '#60A5FA', secondary: '#2563EB', name: 'Faixa Azul' },
  purple: { primary: '#A78BFA', secondary: '#7C3AED', name: 'Faixa Roxa' },
  brown: { primary: '#A16207', secondary: '#78350F', name: 'Faixa Marrom' },
  black: { primary: '#1F2937', secondary: '#000000', name: 'Faixa Preta' },
};

// Tamanhos do avatar
const SIZES = {
  sm: { width: 80, height: 100, fontSize: 'text-xs' },
  md: { width: 120, height: 150, fontSize: 'text-sm' },
  lg: { width: 160, height: 200, fontSize: 'text-base' },
  xl: { width: 200, height: 250, fontSize: 'text-lg' },
};

export const KarateAvatar: React.FC<KarateAvatarProps> = ({
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
        viewBox="0 0 120 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Cabeça */}
        <circle cx="60" cy="30" r="18" fill="#FFD1A1" stroke="#E5A572" strokeWidth="2" />
        
        {/* Cabelo */}
        <path
          d="M 42 25 Q 42 15, 60 15 Q 78 15, 78 25 Q 78 20, 60 20 Q 42 20, 42 25 Z"
          fill="#2C1810"
        />
        
        {/* Olhos */}
        <circle cx="53" cy="30" r="2" fill="#000000" />
        <circle cx="67" cy="30" r="2" fill="#000000" />
        
        {/* Boca (sorriso) */}
        <path
          d="M 52 36 Q 60 39, 68 36"
          stroke="#000000"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Kimono (corpo) */}
        <path
          d="M 60 48 L 40 65 L 40 110 L 50 110 L 50 90 L 60 95 L 70 90 L 70 110 L 80 110 L 80 65 Z"
          fill="#FFFFFF"
          stroke="#E5E7EB"
          strokeWidth="2"
        />
        
        {/* Gola do kimono (V) */}
        <path
          d="M 50 48 L 60 58 L 70 48"
          stroke="#D1D5DB"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Faixa (cintura) */}
        <rect
          x="38"
          y="75"
          width="44"
          height="8"
          fill={beltColor.primary}
          stroke={beltColor.secondary}
          strokeWidth="1.5"
          rx="1"
        />
        
        {/* Nó da faixa */}
        <rect
          x="57"
          y="73"
          width="6"
          height="12"
          fill={beltColor.secondary}
          rx="1"
        />
        
        {/* Pontas da faixa */}
        <rect
          x="54"
          y="83"
          width="3"
          height="10"
          fill={beltColor.primary}
          stroke={beltColor.secondary}
          strokeWidth="0.5"
        />
        <rect
          x="63"
          y="83"
          width="3"
          height="10"
          fill={beltColor.primary}
          stroke={beltColor.secondary}
          strokeWidth="0.5"
        />
        
        {/* Braços */}
        <path
          d="M 40 65 L 25 85 L 28 88 L 43 70"
          fill="#FFD1A1"
          stroke="#E5A572"
          strokeWidth="1.5"
        />
        <path
          d="M 80 65 L 95 85 L 92 88 L 77 70"
          fill="#FFD1A1"
          stroke="#E5A572"
          strokeWidth="1.5"
        />
        
        {/* Mãos (punhos cerrados) */}
        <circle cx="26" cy="87" r="5" fill="#FFD1A1" stroke="#E5A572" strokeWidth="1.5" />
        <circle cx="94" cy="87" r="5" fill="#FFD1A1" stroke="#E5A572" strokeWidth="1.5" />
        
        {/* Pernas */}
        <rect
          x="45"
          y="110"
          width="10"
          height="30"
          fill="#FFFFFF"
          stroke="#E5E7EB"
          strokeWidth="1.5"
        />
        <rect
          x="65"
          y="110"
          width="10"
          height="30"
          fill="#FFFFFF"
          stroke="#E5E7EB"
          strokeWidth="1.5"
        />
        
        {/* Pés */}
        <ellipse cx="50" cy="142" rx="8" ry="4" fill="#FFD1A1" stroke="#E5A572" strokeWidth="1.5" />
        <ellipse cx="70" cy="142" rx="8" ry="4" fill="#FFD1A1" stroke="#E5A572" strokeWidth="1.5" />
        
        {/* Detalhes do rosto (sobrancelhas) */}
        <path d="M 50 27 L 56 27" stroke="#2C1810" strokeWidth="1" strokeLinecap="round" />
        <path d="M 64 27 L 70 27" stroke="#2C1810" strokeWidth="1" strokeLinecap="round" />
      </svg>

      {showLabel && (
        <div className={`mt-3 text-center ${fontSize}`}>
          <p className="font-bold text-gray-800">{beltColor.name}</p>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para exibir todas as faixas (útil para demonstração)
export const AllBelts: React.FC = () => {
  const belts: BeltColor[] = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black'];

  return (
    <div className="grid grid-cols-4 gap-6 p-6">
      {belts.map((belt) => (
        <KarateAvatar key={belt} belt={belt} size="md" showLabel />
      ))}
    </div>
  );
};
