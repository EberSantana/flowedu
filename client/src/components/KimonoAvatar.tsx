import React from 'react';

// Belt colors mapped to their image files
const BELT_IMAGES: Record<string, string> = {
  white: '/avatars/kimono-white-belt.png',
  yellow: '/avatars/kimono-yellow-belt.png',
  orange: '/avatars/kimono-orange-belt.png',
  green: '/avatars/kimono-green-belt.png',
  blue: '/avatars/kimono-blue-belt.png',
  purple: '/avatars/kimono-purple-belt.png',
  brown: '/avatars/kimono-brown-belt.png',
  black: '/avatars/kimono-black-belt.png',
};

// Belt names in Portuguese
export const BELT_NAMES: Record<string, string> = {
  white: 'Faixa Branca',
  yellow: 'Faixa Amarela',
  orange: 'Faixa Laranja',
  green: 'Faixa Verde',
  blue: 'Faixa Azul',
  purple: 'Faixa Roxa',
  brown: 'Faixa Marrom',
  black: 'Faixa Preta',
};

// Belt colors for UI elements
export const BELT_COLORS: Record<string, string> = {
  white: '#FFFFFF',
  yellow: '#FFD700',
  orange: '#FF8C00',
  green: '#228B22',
  blue: '#1E90FF',
  purple: '#8B008B',
  brown: '#8B4513',
  black: '#1a1a1a',
};

// Points required for each belt
export const BELT_THRESHOLDS = [
  { belt: 'white', minPoints: 0, maxPoints: 99 },
  { belt: 'yellow', minPoints: 100, maxPoints: 249 },
  { belt: 'orange', minPoints: 250, maxPoints: 499 },
  { belt: 'green', minPoints: 500, maxPoints: 999 },
  { belt: 'blue', minPoints: 1000, maxPoints: 1999 },
  { belt: 'purple', minPoints: 2000, maxPoints: 3499 },
  { belt: 'brown', minPoints: 3500, maxPoints: 4999 },
  { belt: 'black', minPoints: 5000, maxPoints: Infinity },
];

// Calculate belt based on points
export function calculateBelt(points: number): string {
  for (const threshold of BELT_THRESHOLDS) {
    if (points >= threshold.minPoints && points <= threshold.maxPoints) {
      return threshold.belt;
    }
  }
  return 'white';
}

// Get progress to next belt
export function getBeltProgress(points: number): { current: number; next: number; percentage: number } {
  const currentBeltIndex = BELT_THRESHOLDS.findIndex(
    t => points >= t.minPoints && points <= t.maxPoints
  );
  
  if (currentBeltIndex === -1 || currentBeltIndex === BELT_THRESHOLDS.length - 1) {
    return { current: points, next: points, percentage: 100 };
  }
  
  const currentThreshold = BELT_THRESHOLDS[currentBeltIndex];
  const nextThreshold = BELT_THRESHOLDS[currentBeltIndex + 1];
  
  const pointsInCurrentBelt = points - currentThreshold.minPoints;
  const pointsNeededForNextBelt = nextThreshold.minPoints - currentThreshold.minPoints;
  const percentage = Math.min(100, (pointsInCurrentBelt / pointsNeededForNextBelt) * 100);
  
  return {
    current: points,
    next: nextThreshold.minPoints,
    percentage,
  };
}

interface KimonoAvatarProps {
  belt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBeltName?: boolean;
  showGlow?: boolean;
}

const SIZE_CLASSES = {
  sm: 'w-12 h-16',
  md: 'w-20 h-28',
  lg: 'w-32 h-44',
  xl: 'w-48 h-64',
};

export function KimonoAvatar({ 
  belt, 
  size = 'md', 
  className = '',
  showBeltName = false,
  showGlow = false,
}: KimonoAvatarProps) {
  const imageSrc = BELT_IMAGES[belt] || BELT_IMAGES.white;
  const beltName = BELT_NAMES[belt] || BELT_NAMES.white;
  const beltColor = BELT_COLORS[belt] || BELT_COLORS.white;
  
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div 
        className={`relative ${SIZE_CLASSES[size]} rounded-lg overflow-hidden bg-gradient-to-b from-gray-700 to-gray-900 shadow-lg transition-all duration-300 hover:scale-105`}
        style={{
          boxShadow: showGlow ? `0 0 20px ${beltColor}40, 0 0 40px ${beltColor}20` : undefined,
        }}
      >
        <img 
          src={imageSrc} 
          alt={beltName}
          className="w-full h-full object-cover object-top"
        />
        {/* Belt indicator badge */}
        <div 
          className="absolute bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold shadow-md"
          style={{ 
            backgroundColor: beltColor,
            color: belt === 'white' || belt === 'yellow' ? '#333' : '#fff',
            border: belt === 'white' ? '1px solid #ccc' : 'none',
          }}
        >
          {belt === 'black' ? '🥋' : ''}
        </div>
      </div>
      {showBeltName && (
        <span 
          className="text-sm font-medium"
          style={{ color: beltColor }}
        >
          {beltName}
        </span>
      )}
    </div>
  );
}

// Component to display all belts in a grid (for shop/showcase)
export function KimonoAvatarShowcase() {
  const belts = Object.keys(BELT_IMAGES);
  
  return (
    <div className="grid grid-cols-4 gap-4 p-4">
      {belts.map((belt) => (
        <KimonoAvatar 
          key={belt} 
          belt={belt} 
          size="lg" 
          showBeltName 
          showGlow={belt === 'black'}
        />
      ))}
    </div>
  );
}

// Compact avatar for headers/sidebars
export function KimonoAvatarCompact({ 
  belt, 
  points,
  className = '' 
}: { 
  belt: string; 
  points?: number;
  className?: string;
}) {
  const beltColor = BELT_COLORS[belt] || BELT_COLORS.white;
  const beltName = BELT_NAMES[belt] || BELT_NAMES.white;
  const progress = points !== undefined ? getBeltProgress(points) : null;
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <KimonoAvatar belt={belt} size="sm" />
      <div className="flex flex-col">
        <span 
          className="text-sm font-semibold"
          style={{ color: beltColor }}
        >
          {beltName}
        </span>
        {progress && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progress.percentage}%`,
                  backgroundColor: beltColor,
                }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {points} pts
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default KimonoAvatar;
