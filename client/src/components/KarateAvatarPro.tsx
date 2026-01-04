import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Definição das 8 faixas do karatê
export type BeltColor = 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'purple' | 'brown' | 'black';
export type SkinTone = 'light' | 'medium' | 'tan' | 'dark' | 'darker' | 'darkest';
export type HairStyle = 'short' | 'medium' | 'long' | 'bald' | 'ponytail';
export type KimonoColor = 'white' | 'blue' | 'red' | 'black';
export type AvatarMood = 'idle' | 'happy' | 'excited' | 'proud' | 'focused';
export type AvatarAnimation = 'none' | 'idle' | 'celebrate' | 'levelUp' | 'bow' | 'punch';

interface KarateAvatarProProps {
  belt: BeltColor;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showLabel?: boolean;
  className?: string;
  skinTone?: SkinTone;
  hairStyle?: HairStyle;
  kimonoColor?: KimonoColor;
  mood?: AvatarMood;
  animation?: AvatarAnimation;
  interactive?: boolean;
  showGlow?: boolean;
  showParticles?: boolean;
  onClick?: () => void;
  onAnimationEnd?: () => void;
}

// Mapeamento de cores das faixas com gradientes
const BELT_COLORS: Record<BeltColor, { 
  primary: string; 
  secondary: string; 
  glow: string;
  name: string;
  level: number;
}> = {
  white: { primary: '#FFFFFF', secondary: '#E5E7EB', glow: 'rgba(255,255,255,0.5)', name: 'Faixa Branca', level: 1 },
  yellow: { primary: '#FCD34D', secondary: '#F59E0B', glow: 'rgba(252,211,77,0.5)', name: 'Faixa Amarela', level: 2 },
  orange: { primary: '#FB923C', secondary: '#EA580C', glow: 'rgba(251,146,60,0.5)', name: 'Faixa Laranja', level: 3 },
  green: { primary: '#4ADE80', secondary: '#16A34A', glow: 'rgba(74,222,128,0.5)', name: 'Faixa Verde', level: 4 },
  blue: { primary: '#60A5FA', secondary: '#2563EB', glow: 'rgba(96,165,250,0.5)', name: 'Faixa Azul', level: 5 },
  purple: { primary: '#A78BFA', secondary: '#7C3AED', glow: 'rgba(167,139,250,0.5)', name: 'Faixa Roxa', level: 6 },
  brown: { primary: '#A16207', secondary: '#78350F', glow: 'rgba(161,98,7,0.5)', name: 'Faixa Marrom', level: 7 },
  black: { primary: '#1F2937', secondary: '#000000', glow: 'rgba(31,41,55,0.8)', name: 'Faixa Preta', level: 8 },
};

// Tamanhos do avatar
const SIZES = {
  sm: { width: 80, height: 100, fontSize: 'text-xs', labelSize: 'text-[10px]' },
  md: { width: 120, height: 150, fontSize: 'text-sm', labelSize: 'text-xs' },
  lg: { width: 160, height: 200, fontSize: 'text-base', labelSize: 'text-sm' },
  xl: { width: 200, height: 250, fontSize: 'text-lg', labelSize: 'text-base' },
  '2xl': { width: 280, height: 350, fontSize: 'text-xl', labelSize: 'text-lg' },
};

// Cores de pele
const SKIN_COLORS: Record<SkinTone, { base: string; shadow: string; highlight: string }> = {
  light: { base: '#FFE0BD', shadow: '#F1C27D', highlight: '#FFF5EB' },
  medium: { base: '#F1C27D', shadow: '#E5A572', highlight: '#FFE0BD' },
  tan: { base: '#C68642', shadow: '#A16207', highlight: '#E5A572' },
  dark: { base: '#8D5524', shadow: '#6B4423', highlight: '#A16207' },
  darker: { base: '#5C3317', shadow: '#3E2414', highlight: '#6B4423' },
  darkest: { base: '#3E2723', shadow: '#2C1810', highlight: '#5C3317' },
};

// Cores de kimono
const KIMONO_COLORS: Record<KimonoColor, { base: string; border: string; fold: string }> = {
  white: { base: '#FFFFFF', border: '#E5E7EB', fold: '#F3F4F6' },
  blue: { base: '#3B82F6', border: '#1E40AF', fold: '#60A5FA' },
  red: { base: '#EF4444', border: '#991B1B', fold: '#F87171' },
  black: { base: '#1F2937', border: '#000000', fold: '#374151' },
};

// Expressões faciais baseadas no humor
const MOOD_EXPRESSIONS: Record<AvatarMood, { 
  eyeScale: number; 
  mouthPath: string; 
  eyebrowOffset: number;
  blush: boolean;
}> = {
  idle: { eyeScale: 1, mouthPath: 'M 52 36 Q 60 38, 68 36', eyebrowOffset: 0, blush: false },
  happy: { eyeScale: 1.1, mouthPath: 'M 50 35 Q 60 42, 70 35', eyebrowOffset: -1, blush: true },
  excited: { eyeScale: 1.3, mouthPath: 'M 48 34 Q 60 46, 72 34', eyebrowOffset: -2, blush: true },
  proud: { eyeScale: 0.9, mouthPath: 'M 52 36 Q 60 40, 68 36', eyebrowOffset: 1, blush: false },
  focused: { eyeScale: 0.8, mouthPath: 'M 54 37 L 66 37', eyebrowOffset: 2, blush: false },
};

// Componente de partículas
const Particles: React.FC<{ active: boolean; color: string }> = ({ active, color }) => {
  if (!active) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-particle"
          style={{
            backgroundColor: color,
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
            animationDelay: `${i * 0.1}s`,
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
};

// Componente de estrelas brilhantes
const Sparkles: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <svg
          key={i}
          className="absolute w-4 h-4 animate-sparkle"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * 0.2}s`,
          }}
          viewBox="0 0 24 24"
          fill="gold"
        >
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      ))}
    </div>
  );
};

export const KarateAvatarPro: React.FC<KarateAvatarProProps> = ({
  belt,
  size = 'md',
  showLabel = false,
  className = '',
  skinTone = 'light',
  hairStyle = 'short',
  kimonoColor = 'white',
  mood = 'idle',
  animation = 'idle',
  interactive = false,
  showGlow = false,
  showParticles = false,
  onClick,
  onAnimationEnd,
}) => {
  const [currentMood, setCurrentMood] = useState<AvatarMood>(mood);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  const { width, height, fontSize, labelSize } = SIZES[size];
  const beltColor = BELT_COLORS[belt];
  const skinColor = SKIN_COLORS[skinTone];
  const kimono = KIMONO_COLORS[kimonoColor];
  const expression = MOOD_EXPRESSIONS[currentMood];

  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  useEffect(() => {
    if (animation === 'celebrate' || animation === 'levelUp') {
      setShowSparkles(true);
      setCurrentMood('excited');
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setShowSparkles(false);
        setIsAnimating(false);
        setCurrentMood(mood);
        onAnimationEnd?.();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [animation, mood, onAnimationEnd]);

  const handleClick = useCallback(() => {
    if (!interactive) return;
    
    // Reação ao clique
    setCurrentMood('happy');
    setShowSparkles(true);
    
    setTimeout(() => {
      setCurrentMood(mood);
      setShowSparkles(false);
    }, 800);
    
    onClick?.();
  }, [interactive, mood, onClick]);

  const getAnimationClass = () => {
    switch (animation) {
      case 'idle': return 'animate-avatar-idle';
      case 'celebrate': return 'animate-avatar-celebrate';
      case 'levelUp': return 'animate-avatar-levelup';
      case 'bow': return 'animate-avatar-bow';
      case 'punch': return 'animate-avatar-punch';
      default: return '';
    }
  };

  return (
    <div 
      className={cn(
        'relative flex flex-col items-center transition-all duration-300',
        interactive && 'cursor-pointer hover:scale-105 active:scale-95',
        className
      )}
      onClick={handleClick}
    >
      {/* Glow effect */}
      {showGlow && (
        <div 
          className="absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse"
          style={{ 
            backgroundColor: beltColor.glow,
            transform: 'scale(1.2)',
          }}
        />
      )}
      
      {/* Particles */}
      <Particles active={showParticles || isAnimating} color={beltColor.primary} />
      
      {/* Sparkles */}
      <Sparkles active={showSparkles} />
      
      {/* Avatar Container */}
      <div className={cn('relative', getAnimationClass())}>
        <svg
          width={width}
          height={height}
          viewBox="0 0 120 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            'drop-shadow-xl transition-all duration-300',
            interactive && 'hover:drop-shadow-2xl'
          )}
        >
          {/* Definições de gradientes e filtros */}
          <defs>
            {/* Gradiente do kimono */}
            <linearGradient id={`kimono-gradient-${belt}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={kimono.fold} />
              <stop offset="50%" stopColor={kimono.base} />
              <stop offset="100%" stopColor={kimono.border} />
            </linearGradient>
            
            {/* Gradiente da faixa */}
            <linearGradient id={`belt-gradient-${belt}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={beltColor.secondary} />
              <stop offset="50%" stopColor={beltColor.primary} />
              <stop offset="100%" stopColor={beltColor.secondary} />
            </linearGradient>
            
            {/* Gradiente da pele */}
            <linearGradient id={`skin-gradient-${belt}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={skinColor.highlight} />
              <stop offset="50%" stopColor={skinColor.base} />
              <stop offset="100%" stopColor={skinColor.shadow} />
            </linearGradient>
            
            {/* Sombra suave */}
            <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
            
            {/* Brilho */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Sombra no chão */}
          <ellipse 
            cx="60" 
            cy="148" 
            rx="25" 
            ry="4" 
            fill="rgba(0,0,0,0.15)"
            className="animate-shadow-pulse"
          />

          {/* Cabeça com gradiente */}
          <circle 
            cx="60" 
            cy="30" 
            r="20" 
            fill={`url(#skin-gradient-${belt})`}
            filter="url(#soft-shadow)"
          />
          
          {/* Orelhas */}
          <ellipse cx="40" cy="30" rx="4" ry="5" fill={skinColor.base} />
          <ellipse cx="80" cy="30" rx="4" ry="5" fill={skinColor.base} />
          
          {/* Cabelo com mais detalhes */}
          {hairStyle !== 'bald' && (
            <>
              {hairStyle === 'short' && (
                <>
                  <path
                    d="M 40 25 Q 40 10, 60 8 Q 80 10, 80 25 Q 80 18, 60 16 Q 40 18, 40 25 Z"
                    fill="#2C1810"
                    filter="url(#soft-shadow)"
                  />
                  <path
                    d="M 45 20 Q 50 15, 60 14 Q 70 15, 75 20"
                    stroke="#3E2723"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.5"
                  />
                </>
              )}
              {hairStyle === 'medium' && (
                <>
                  <path
                    d="M 38 28 Q 38 8, 60 6 Q 82 8, 82 28 Q 82 20, 60 18 Q 38 20, 38 28 Z"
                    fill="#2C1810"
                    filter="url(#soft-shadow)"
                  />
                  <path d="M 38 28 Q 35 35, 38 42" stroke="#2C1810" strokeWidth="3" fill="none" />
                  <path d="M 82 28 Q 85 35, 82 42" stroke="#2C1810" strokeWidth="3" fill="none" />
                </>
              )}
              {hairStyle === 'long' && (
                <>
                  <path
                    d="M 36 30 Q 36 6, 60 4 Q 84 6, 84 30 Q 84 22, 60 20 Q 36 22, 36 30 Z"
                    fill="#2C1810"
                    filter="url(#soft-shadow)"
                  />
                  <path d="M 36 30 Q 32 45, 35 60" stroke="#2C1810" strokeWidth="5" fill="none" />
                  <path d="M 84 30 Q 88 45, 85 60" stroke="#2C1810" strokeWidth="5" fill="none" />
                </>
              )}
              {hairStyle === 'ponytail' && (
                <>
                  <path
                    d="M 40 25 Q 40 10, 60 8 Q 80 10, 80 25 Q 80 18, 60 16 Q 40 18, 40 25 Z"
                    fill="#2C1810"
                    filter="url(#soft-shadow)"
                  />
                  <ellipse cx="60" cy="12" rx="8" ry="12" fill="#2C1810" />
                  <path d="M 60 0 Q 65 -5, 60 -10" stroke="#2C1810" strokeWidth="4" fill="none" />
                </>
              )}
            </>
          )}
          
          {/* Sobrancelhas */}
          <path 
            d={`M 48 ${25 + expression.eyebrowOffset} L 56 ${26 + expression.eyebrowOffset}`} 
            stroke="#2C1810" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
          />
          <path 
            d={`M 64 ${26 + expression.eyebrowOffset} L 72 ${25 + expression.eyebrowOffset}`} 
            stroke="#2C1810" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
          />
          
          {/* Olhos com brilho */}
          <g transform={`scale(${expression.eyeScale}) translate(${(1 - expression.eyeScale) * 60}, ${(1 - expression.eyeScale) * 30})`}>
            <ellipse cx="52" cy="30" rx="3" ry="3.5" fill="#1F2937" />
            <ellipse cx="68" cy="30" rx="3" ry="3.5" fill="#1F2937" />
            <circle cx="51" cy="29" r="1" fill="white" />
            <circle cx="67" cy="29" r="1" fill="white" />
          </g>
          
          {/* Blush (bochechas coradas) */}
          {expression.blush && (
            <>
              <ellipse cx="44" cy="34" rx="4" ry="2" fill="#FFB6C1" opacity="0.5" />
              <ellipse cx="76" cy="34" rx="4" ry="2" fill="#FFB6C1" opacity="0.5" />
            </>
          )}
          
          {/* Boca */}
          <path
            d={expression.mouthPath}
            stroke="#1F2937"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Pescoço */}
          <rect x="55" y="48" width="10" height="6" fill={skinColor.base} />
          
          {/* Kimono (corpo) com gradiente */}
          <path
            d="M 60 52 L 35 70 L 35 115 L 50 115 L 50 95 L 60 100 L 70 95 L 70 115 L 85 115 L 85 70 Z"
            fill={`url(#kimono-gradient-${belt})`}
            stroke={kimono.border}
            strokeWidth="2"
            filter="url(#soft-shadow)"
          />
          
          {/* Gola do kimono (V) com dobras */}
          <path
            d="M 48 52 L 60 65 L 72 52"
            stroke={kimono.border}
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M 50 54 L 60 63 L 70 54"
            stroke={kimono.fold}
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
          
          {/* Faixa (cintura) com gradiente e brilho */}
          <rect
            x="33"
            y="78"
            width="54"
            height="10"
            rx="2"
            fill={`url(#belt-gradient-${belt})`}
            stroke={beltColor.secondary}
            strokeWidth="1.5"
            filter={belt === 'black' ? 'url(#glow)' : 'url(#soft-shadow)'}
          />
          
          {/* Textura da faixa */}
          <line x1="35" y1="83" x2="85" y2="83" stroke={beltColor.secondary} strokeWidth="0.5" opacity="0.5" />
          
          {/* Nó da faixa */}
          <rect
            x="56"
            y="76"
            width="8"
            height="14"
            rx="2"
            fill={beltColor.secondary}
          />
          
          {/* Pontas da faixa com movimento */}
          <path
            d="M 52 88 L 50 105 Q 48 108, 52 106"
            fill={beltColor.primary}
            stroke={beltColor.secondary}
            strokeWidth="1"
            className="animate-belt-sway"
          />
          <path
            d="M 68 88 L 70 105 Q 72 108, 68 106"
            fill={beltColor.primary}
            stroke={beltColor.secondary}
            strokeWidth="1"
            className="animate-belt-sway-reverse"
          />
          
          {/* Mangas do kimono */}
          <path
            d="M 35 70 L 20 85 Q 18 90, 22 92 L 38 78"
            fill={`url(#kimono-gradient-${belt})`}
            stroke={kimono.border}
            strokeWidth="1.5"
          />
          <path
            d="M 85 70 L 100 85 Q 102 90, 98 92 L 82 78"
            fill={`url(#kimono-gradient-${belt})`}
            stroke={kimono.border}
            strokeWidth="1.5"
          />
          
          {/* Braços */}
          <path
            d="M 22 90 L 18 95 Q 16 98, 20 100"
            fill={`url(#skin-gradient-${belt})`}
            stroke={skinColor.shadow}
            strokeWidth="1.5"
          />
          <path
            d="M 98 90 L 102 95 Q 104 98, 100 100"
            fill={`url(#skin-gradient-${belt})`}
            stroke={skinColor.shadow}
            strokeWidth="1.5"
          />
          
          {/* Mãos (punhos cerrados) */}
          <circle cx="20" cy="98" r="6" fill={`url(#skin-gradient-${belt})`} stroke={skinColor.shadow} strokeWidth="1.5" />
          <circle cx="100" cy="98" r="6" fill={`url(#skin-gradient-${belt})`} stroke={skinColor.shadow} strokeWidth="1.5" />
          
          {/* Dedos */}
          <path d="M 17 96 Q 15 94, 17 92" stroke={skinColor.shadow} strokeWidth="1" fill="none" />
          <path d="M 103 96 Q 105 94, 103 92" stroke={skinColor.shadow} strokeWidth="1" fill="none" />
          
          {/* Pernas do kimono */}
          <rect
            x="42"
            y="115"
            width="14"
            height="28"
            rx="2"
            fill={`url(#kimono-gradient-${belt})`}
            stroke={kimono.border}
            strokeWidth="1.5"
          />
          <rect
            x="64"
            y="115"
            width="14"
            height="28"
            rx="2"
            fill={`url(#kimono-gradient-${belt})`}
            stroke={kimono.border}
            strokeWidth="1.5"
          />
          
          {/* Pés */}
          <ellipse cx="49" cy="145" rx="10" ry="5" fill={skinColor.base} stroke={skinColor.shadow} strokeWidth="1.5" />
          <ellipse cx="71" cy="145" rx="10" ry="5" fill={skinColor.base} stroke={skinColor.shadow} strokeWidth="1.5" />
          
          {/* Detalhes dos pés */}
          <path d="M 43 145 Q 49 143, 55 145" stroke={skinColor.shadow} strokeWidth="0.5" fill="none" />
          <path d="M 65 145 Q 71 143, 77 145" stroke={skinColor.shadow} strokeWidth="0.5" fill="none" />
          
          {/* Emblema especial para faixa preta */}
          {belt === 'black' && (
            <g filter="url(#glow)">
              <circle cx="60" cy="68" r="6" fill="gold" stroke="#B8860B" strokeWidth="1" />
              <text x="60" y="71" textAnchor="middle" fontSize="8" fill="#1F2937" fontWeight="bold">★</text>
            </g>
          )}
        </svg>
      </div>

      {/* Label com design melhorado */}
      {showLabel && (
        <div className={cn(
          'mt-4 text-center transition-all duration-300',
          fontSize
        )}>
          <div className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full',
            'bg-gradient-to-r shadow-lg',
            belt === 'white' && 'from-gray-100 to-white border border-gray-200',
            belt === 'yellow' && 'from-yellow-100 to-yellow-50 border border-yellow-300',
            belt === 'orange' && 'from-orange-100 to-orange-50 border border-orange-300',
            belt === 'green' && 'from-green-100 to-green-50 border border-green-300',
            belt === 'blue' && 'from-blue-100 to-blue-50 border border-blue-300',
            belt === 'purple' && 'from-purple-100 to-purple-50 border border-purple-300',
            belt === 'brown' && 'from-amber-100 to-amber-50 border border-amber-400',
            belt === 'black' && 'from-gray-800 to-gray-900 border border-gray-600',
          )}>
            {/* Ícone de nível */}
            <span className={cn(
              'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
              belt === 'black' ? 'bg-gold text-gray-900' : 'bg-white/80 text-gray-700'
            )}>
              {beltColor.level}
            </span>
            <span className={cn(
              'font-bold',
              labelSize,
              belt === 'black' ? 'text-white' : 'text-gray-800'
            )}>
              {beltColor.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para exibir todas as faixas
export const AllBeltsPro: React.FC = () => {
  const belts: BeltColor[] = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black'];

  return (
    <div className="grid grid-cols-4 gap-8 p-8">
      {belts.map((belt) => (
        <KarateAvatarPro 
          key={belt} 
          belt={belt} 
          size="lg" 
          showLabel 
          interactive
          showGlow={belt === 'black'}
        />
      ))}
    </div>
  );
};

export default KarateAvatarPro;
