import React from 'react';

// Definição das 8 faixas do karatê
export type BeltColor = 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'purple' | 'brown' | 'black';

export type Gender = 'male' | 'female';

interface KarateAvatar3DProps {
  belt: BeltColor;
  gender?: Gender;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

// Mapeamento de nomes das faixas
const BELT_NAMES: Record<BeltColor, string> = {
  white: 'Faixa Branca',
  yellow: 'Faixa Amarela',
  orange: 'Faixa Laranja',
  green: 'Faixa Verde',
  blue: 'Faixa Azul',
  purple: 'Faixa Roxa',
  brown: 'Faixa Marrom',
  black: 'Faixa Preta',
};

// Cores de fundo para cada faixa (para efeito visual)
const BELT_GLOW: Record<BeltColor, string> = {
  white: 'shadow-gray-300',
  yellow: 'shadow-yellow-400',
  orange: 'shadow-orange-400',
  green: 'shadow-green-400',
  blue: 'shadow-blue-400',
  purple: 'shadow-purple-400',
  brown: 'shadow-amber-700',
  black: 'shadow-gray-900',
};

// Tamanhos do avatar
const SIZES = {
  sm: { width: 80, height: 80, fontSize: 'text-xs' },
  md: { width: 150, height: 150, fontSize: 'text-sm' },
  lg: { width: 200, height: 200, fontSize: 'text-base' },
  xl: { width: 280, height: 280, fontSize: 'text-lg' },
};

// Mapeamento de imagens por gênero e faixa
const getAvatarImage = (gender: Gender, belt: BeltColor): string => {
  // Agora temos avatares femininos para todas as faixas
  const femaleAvailableBelts: BeltColor[] = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black'];
  
  if (gender === 'female' && femaleAvailableBelts.includes(belt)) {
    return `/avatars/3d/female_${belt}_belt.png`;
  }
  
  // Default: usar imagem masculina
  return `/avatars/3d/male_${belt}_belt.png`;
}

export const KarateAvatar3D: React.FC<KarateAvatar3DProps> = ({
  belt,
  gender = 'male',
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const { width, height, fontSize } = SIZES[size];
  const beltName = BELT_NAMES[belt];
  const glowClass = BELT_GLOW[belt];
  const imageSrc = getAvatarImage(gender, belt);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div 
        className={`relative rounded-2xl overflow-hidden shadow-lg ${glowClass}`}
        style={{ width, height }}
      >
        <img
          src={imageSrc}
          alt={`Avatar de karateca com ${beltName}`}
          className="w-full h-full object-cover"
          style={{ 
            objectPosition: 'center top',
          }}
        />
        
        {/* Efeito de brilho para faixa preta */}
        {belt === 'black' && (
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent pointer-events-none" />
        )}
      </div>

      {showLabel && (
        <div className={`mt-3 text-center ${fontSize}`}>
          <p className="font-bold text-gray-800">{beltName}</p>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para exibir todas as faixas (útil para demonstração)
export const AllBelts3D: React.FC<{ gender?: Gender }> = ({ gender = 'male' }) => {
  const belts: BeltColor[] = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black'];

  return (
    <div className="grid grid-cols-4 gap-6 p-6">
      {belts.map((belt) => (
        <KarateAvatar3D key={belt} belt={belt} gender={gender} size="md" showLabel />
      ))}
    </div>
  );
};

export default KarateAvatar3D;
