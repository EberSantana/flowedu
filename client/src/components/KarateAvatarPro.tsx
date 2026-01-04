import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Definição das 8 faixas do karatê
export type BeltColor = 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'purple' | 'brown' | 'black';
export type SkinTone = 'light' | 'medium' | 'tan' | 'dark' | 'darker' | 'darkest';
export type HairStyle = 'short' | 'medium' | 'long' | 'bald' | 'ponytail' | 'mohawk';
export type HairColor = 'black' | 'brown' | 'blonde' | 'red' | 'colorful';
export type KimonoColor = 'white' | 'blue' | 'red' | 'black';
export type KimonoStyle = 'traditional' | 'modern' | 'competition';
export type HeadAccessory = 'none' | 'bandana' | 'headband' | 'cap' | 'glasses';
export type Expression = 'neutral' | 'happy' | 'determined' | 'focused' | 'victorious';
export type Pose = 'standing' | 'fighting' | 'punch' | 'kick';
export type AvatarMood = 'idle' | 'happy' | 'excited' | 'proud' | 'focused';
export type AvatarAnimation = 'none' | 'idle' | 'celebrate' | 'levelUp' | 'bow' | 'punch';

// Tipos para itens equipados
export type EquippedItem = {
  slot: 'hat' | 'glasses' | 'accessory' | 'background';
  name: string;
  category: string;
};

interface KarateAvatarProProps {
  belt: BeltColor;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showLabel?: boolean;
  className?: string;
  skinTone?: SkinTone;
  hairStyle?: HairStyle;
  hairColor?: HairColor;
  kimonoColor?: KimonoColor;
  kimonoStyle?: KimonoStyle;
  headAccessory?: HeadAccessory;
  expression?: Expression;
  pose?: Pose;
  mood?: AvatarMood;
  animation?: AvatarAnimation;
  interactive?: boolean;
  showGlow?: boolean;
  showParticles?: boolean;
  onClick?: () => void;
  onAnimationEnd?: () => void;
  equippedItems?: EquippedItem[];
}

// Mapeamento de cores das faixas com gradientes
const BELT_COLORS: Record<BeltColor, { 
  primary: string; 
  secondary: string; 
  glow: string;
  name: string;
  level: number;
  shadowColor: string;
  ringColor: string;
}> = {
  white: { primary: '#FFFFFF', secondary: '#E5E7EB', glow: 'rgba(255,255,255,0.6)', name: 'Faixa Branca', level: 1, shadowColor: 'shadow-gray-300', ringColor: 'ring-gray-300' },
  yellow: { primary: '#FCD34D', secondary: '#F59E0B', glow: 'rgba(252,211,77,0.6)', name: 'Faixa Amarela', level: 2, shadowColor: 'shadow-yellow-400', ringColor: 'ring-yellow-400' },
  orange: { primary: '#FB923C', secondary: '#EA580C', glow: 'rgba(251,146,60,0.6)', name: 'Faixa Laranja', level: 3, shadowColor: 'shadow-orange-400', ringColor: 'ring-orange-400' },
  green: { primary: '#4ADE80', secondary: '#16A34A', glow: 'rgba(74,222,128,0.6)', name: 'Faixa Verde', level: 4, shadowColor: 'shadow-green-400', ringColor: 'ring-green-400' },
  blue: { primary: '#60A5FA', secondary: '#2563EB', glow: 'rgba(96,165,250,0.6)', name: 'Faixa Azul', level: 5, shadowColor: 'shadow-blue-400', ringColor: 'ring-blue-400' },
  purple: { primary: '#A78BFA', secondary: '#7C3AED', glow: 'rgba(167,139,250,0.6)', name: 'Faixa Roxa', level: 6, shadowColor: 'shadow-purple-400', ringColor: 'ring-purple-400' },
  brown: { primary: '#A16207', secondary: '#78350F', glow: 'rgba(161,98,7,0.6)', name: 'Faixa Marrom', level: 7, shadowColor: 'shadow-amber-600', ringColor: 'ring-amber-600' },
  black: { primary: '#1F2937', secondary: '#000000', glow: 'rgba(251,191,36,0.8)', name: 'Faixa Preta', level: 8, shadowColor: 'shadow-yellow-500', ringColor: 'ring-yellow-500' },
};

// Mapeamento de cores de pele
const SKIN_COLORS: Record<SkinTone, string> = {
  light: '#FFE0BD',
  medium: '#F1C27D',
  tan: '#C68642',
  dark: '#8D5524',
  darker: '#5C3317',
  darkest: '#3E2723',
};

// Mapeamento de cores de cabelo
const HAIR_COLORS: Record<HairColor, string> = {
  black: '#1a1a1a',
  brown: '#4a3728',
  blonde: '#d4a574',
  red: '#8b3a3a',
  colorful: 'url(#rainbow-gradient)',
};

// Mapeamento de cores do kimono
const KIMONO_COLORS: Record<KimonoColor, { main: string; accent: string }> = {
  white: { main: '#FFFFFF', accent: '#E5E7EB' },
  blue: { main: '#3B82F6', accent: '#1D4ED8' },
  red: { main: '#EF4444', accent: '#B91C1C' },
  black: { main: '#1F2937', accent: '#111827' },
};

// Tamanhos do avatar
const SIZES = {
  sm: { width: 80, height: 100, fontSize: 'text-xs', labelSize: 'text-[10px]' },
  md: { width: 120, height: 150, fontSize: 'text-sm', labelSize: 'text-xs' },
  lg: { width: 160, height: 200, fontSize: 'text-base', labelSize: 'text-sm' },
  xl: { width: 220, height: 275, fontSize: 'text-lg', labelSize: 'text-base' },
  '2xl': { width: 300, height: 375, fontSize: 'text-xl', labelSize: 'text-lg' },
};

// Componente de partículas brilhantes
const Particles: React.FC<{ active: boolean; color: string }> = ({ active, color }) => {
  if (!active) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-float-particle"
          style={{
            backgroundColor: color,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: `${1.5 + Math.random() * 1}s`,
            opacity: 0.9,
            boxShadow: `0 0 8px ${color}`,
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
      {[...Array(8)].map((_, i) => (
        <svg
          key={i}
          className="absolute w-5 h-5 animate-sparkle-float"
          style={{
            left: `${5 + Math.random() * 90}%`,
            top: `${5 + Math.random() * 90}%`,
            animationDelay: `${i * 0.25}s`,
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

// Componente de aura/glow animado
const AnimatedGlow: React.FC<{ belt: BeltColor; active: boolean }> = ({ belt, active }) => {
  if (!active) return null;
  
  const beltColor = BELT_COLORS[belt];
  const isBlackBelt = belt === 'black';
  
  return (
    <>
      <div 
        className={cn(
          "absolute inset-0 rounded-full blur-2xl animate-pulse-glow",
          isBlackBelt ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400" : ""
        )}
        style={{ 
          backgroundColor: isBlackBelt ? undefined : beltColor.glow,
          transform: 'scale(1.3)',
          opacity: 0.6,
        }}
      />
      <div 
        className="absolute inset-0 rounded-full blur-3xl animate-pulse-glow-slow"
        style={{ 
          backgroundColor: beltColor.glow,
          transform: 'scale(1.5)',
          opacity: 0.3,
          animationDelay: '0.5s',
        }}
      />
    </>
  );
};

// Componente SVG do Avatar
const AvatarSVG: React.FC<{
  skinTone: SkinTone;
  hairStyle: HairStyle;
  hairColor: HairColor;
  kimonoColor: KimonoColor;
  kimonoStyle: KimonoStyle;
  headAccessory: HeadAccessory;
  expression: Expression;
  pose: Pose;
  belt: BeltColor;
  width: number;
  height: number;
}> = ({ 
  skinTone, 
  hairStyle, 
  hairColor, 
  kimonoColor, 
  kimonoStyle, 
  headAccessory, 
  expression, 
  pose,
  belt,
  width,
  height 
}) => {
  const skinColor = SKIN_COLORS[skinTone];
  const hairCol = HAIR_COLORS[hairColor];
  const kimono = KIMONO_COLORS[kimonoColor];
  const beltCol = BELT_COLORS[belt];

  // Calcular posição baseada na pose
  const getPoseTransform = () => {
    switch (pose) {
      case 'fighting': return 'rotate(-5deg)';
      case 'punch': return 'translateX(10px) rotate(-10deg)';
      case 'kick': return 'rotate(15deg)';
      default: return 'none';
    }
  };

  // Renderizar expressão facial
  const renderExpression = () => {
    const eyeY = 85;
    const mouthY = 105;
    
    switch (expression) {
      case 'happy':
        return (
          <>
            {/* Olhos felizes (arqueados) */}
            <path d="M70 85 Q75 80, 80 85" stroke="#1a1a1a" strokeWidth="3" fill="none" />
            <path d="M95 85 Q100 80, 105 85" stroke="#1a1a1a" strokeWidth="3" fill="none" />
            {/* Sorriso */}
            <path d="M75 105 Q87.5 120, 100 105" stroke="#1a1a1a" strokeWidth="2.5" fill="none" />
          </>
        );
      case 'determined':
        return (
          <>
            {/* Sobrancelhas franzidas */}
            <line x1="68" y1="75" x2="82" y2="78" stroke="#1a1a1a" strokeWidth="2.5" />
            <line x1="93" y1="78" x2="107" y2="75" stroke="#1a1a1a" strokeWidth="2.5" />
            {/* Olhos determinados */}
            <ellipse cx="75" cy={eyeY} rx="5" ry="4" fill="#1a1a1a" />
            <ellipse cx="100" cy={eyeY} rx="5" ry="4" fill="#1a1a1a" />
            {/* Boca séria */}
            <line x1="78" y1={mouthY} x2="97" y2={mouthY} stroke="#1a1a1a" strokeWidth="2.5" />
          </>
        );
      case 'focused':
        return (
          <>
            {/* Olhos semicerrados */}
            <ellipse cx="75" cy={eyeY} rx="6" ry="3" fill="#1a1a1a" />
            <ellipse cx="100" cy={eyeY} rx="6" ry="3" fill="#1a1a1a" />
            {/* Boca concentrada */}
            <path d="M80 105 Q87.5 108, 95 105" stroke="#1a1a1a" strokeWidth="2" fill="none" />
          </>
        );
      case 'victorious':
        return (
          <>
            {/* Olhos brilhantes */}
            <ellipse cx="75" cy={eyeY} rx="6" ry="6" fill="#1a1a1a" />
            <ellipse cx="100" cy={eyeY} rx="6" ry="6" fill="#1a1a1a" />
            <circle cx="73" cy="83" r="2" fill="white" />
            <circle cx="98" cy="83" r="2" fill="white" />
            {/* Grande sorriso */}
            <path d="M70 102 Q87.5 125, 105 102" stroke="#1a1a1a" strokeWidth="2.5" fill="none" />
            {/* Bochechas coradas */}
            <ellipse cx="60" cy="95" rx="8" ry="5" fill="#ffb3b3" opacity="0.5" />
            <ellipse cx="115" cy="95" rx="8" ry="5" fill="#ffb3b3" opacity="0.5" />
          </>
        );
      default: // neutral
        return (
          <>
            {/* Olhos normais */}
            <ellipse cx="75" cy={eyeY} rx="5" ry="5" fill="#1a1a1a" />
            <ellipse cx="100" cy={eyeY} rx="5" ry="5" fill="#1a1a1a" />
            <circle cx="73" cy="83" r="1.5" fill="white" />
            <circle cx="98" cy="83" r="1.5" fill="white" />
            {/* Boca neutra */}
            <path d="M78 105 Q87.5 110, 97 105" stroke="#1a1a1a" strokeWidth="2" fill="none" />
          </>
        );
    }
  };

  // Renderizar cabelo
  const renderHair = () => {
    const baseColor = hairColor === 'colorful' ? '#ff6b6b' : hairCol;
    
    switch (hairStyle) {
      case 'short':
        return (
          <path 
            d="M55 70 Q55 40, 87.5 35 Q120 40, 120 70 Q120 55, 87.5 50 Q55 55, 55 70" 
            fill={baseColor}
          />
        );
      case 'medium':
        return (
          <>
            <path 
              d="M50 75 Q50 35, 87.5 28 Q125 35, 125 75 Q125 55, 87.5 45 Q50 55, 50 75" 
              fill={baseColor}
            />
            <path 
              d="M50 75 Q45 90, 50 105 M125 75 Q130 90, 125 105" 
              stroke={baseColor} 
              strokeWidth="12" 
              fill="none"
              strokeLinecap="round"
            />
          </>
        );
      case 'long':
        return (
          <>
            <path 
              d="M45 75 Q45 30, 87.5 22 Q130 30, 130 75 Q130 50, 87.5 40 Q45 50, 45 75" 
              fill={baseColor}
            />
            <path 
              d="M45 75 Q35 120, 45 160 M130 75 Q140 120, 130 160" 
              stroke={baseColor} 
              strokeWidth="15" 
              fill="none"
              strokeLinecap="round"
            />
          </>
        );
      case 'bald':
        return null;
      case 'ponytail':
        return (
          <>
            <path 
              d="M55 70 Q55 40, 87.5 35 Q120 40, 120 70 Q120 55, 87.5 50 Q55 55, 55 70" 
              fill={baseColor}
            />
            <ellipse cx="87.5" cy="30" rx="15" ry="10" fill={baseColor} />
            <path 
              d="M87.5 25 Q100 10, 115 30 Q120 50, 110 70" 
              stroke={baseColor} 
              strokeWidth="10" 
              fill="none"
              strokeLinecap="round"
            />
          </>
        );
      case 'mohawk':
        return (
          <>
            <path 
              d="M60 70 Q60 50, 87.5 45 Q115 50, 115 70" 
              fill={baseColor}
            />
            <path 
              d="M75 45 L75 15 Q87.5 5, 100 15 L100 45" 
              fill={baseColor}
            />
          </>
        );
      default:
        return null;
    }
  };

  // Renderizar acessório de cabeça
  const renderHeadAccessory = () => {
    switch (headAccessory) {
      case 'bandana':
        return (
          <>
            <rect x="50" y="55" width="75" height="12" rx="2" fill="#EF4444" />
            <path d="M125 55 L140 45 L145 60 L125 67 Z" fill="#EF4444" />
          </>
        );
      case 'headband':
        return (
          <rect x="50" y="60" width="75" height="8" rx="1" fill="#1F2937" />
        );
      case 'cap':
        return (
          <>
            <ellipse cx="87.5" cy="50" rx="45" ry="20" fill="#3B82F6" />
            <rect x="42" y="50" width="91" height="15" fill="#3B82F6" />
            <rect x="42" y="62" width="50" height="8" rx="2" fill="#1D4ED8" />
          </>
        );
      case 'glasses':
        return (
          <>
            <rect x="62" y="78" width="22" height="16" rx="3" fill="none" stroke="#1a1a1a" strokeWidth="2" />
            <rect x="91" y="78" width="22" height="16" rx="3" fill="none" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="84" y1="86" x2="91" y2="86" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="62" y1="86" x2="55" y2="84" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="113" y1="86" x2="120" y2="84" stroke="#1a1a1a" strokeWidth="2" />
          </>
        );
      default:
        return null;
    }
  };

  // Renderizar estilo do kimono
  const renderKimonoStyle = () => {
    const baseKimono = (
      <>
        {/* Corpo do kimono */}
        <path 
          d="M60 130 L55 250 L120 250 L115 130 Z" 
          fill={kimono.main}
          stroke={kimono.accent}
          strokeWidth="2"
        />
        {/* Gola V */}
        <path 
          d="M60 130 L87.5 170 L115 130" 
          fill="none"
          stroke={kimono.accent}
          strokeWidth="3"
        />
      </>
    );

    switch (kimonoStyle) {
      case 'modern':
        return (
          <>
            {baseKimono}
            {/* Listras laterais modernas */}
            <line x1="58" y1="140" x2="58" y2="240" stroke={beltCol.primary} strokeWidth="4" />
            <line x1="117" y1="140" x2="117" y2="240" stroke={beltCol.primary} strokeWidth="4" />
          </>
        );
      case 'competition':
        return (
          <>
            {baseKimono}
            {/* Emblema de competição */}
            <circle cx="75" cy="155" r="12" fill={beltCol.primary} stroke={beltCol.secondary} strokeWidth="2" />
            <text x="75" y="160" textAnchor="middle" fontSize="12" fill={belt === 'white' ? '#1a1a1a' : '#fff'}>★</text>
          </>
        );
      default: // traditional
        return baseKimono;
    }
  };

  // Renderizar braços baseado na pose
  const renderArms = () => {
    switch (pose) {
      case 'fighting':
        return (
          <>
            {/* Braço esquerdo em guarda */}
            <path d="M55 140 Q30 150, 35 180 Q40 190, 50 185" fill={skinColor} stroke={skinColor} strokeWidth="2" />
            <ellipse cx="45" cy="185" rx="12" ry="10" fill={skinColor} /> {/* Punho */}
            {/* Braço direito em guarda */}
            <path d="M120 140 Q145 150, 140 180 Q135 190, 125 185" fill={skinColor} stroke={skinColor} strokeWidth="2" />
            <ellipse cx="130" cy="185" rx="12" ry="10" fill={skinColor} /> {/* Punho */}
          </>
        );
      case 'punch':
        return (
          <>
            {/* Braço esquerdo recolhido */}
            <path d="M55 140 Q40 160, 50 175" fill={skinColor} stroke={skinColor} strokeWidth="2" />
            <ellipse cx="50" cy="175" rx="10" ry="8" fill={skinColor} />
            {/* Braço direito estendido (soco) */}
            <path d="M120 145 Q160 145, 175 145" fill={skinColor} stroke={skinColor} strokeWidth="18" strokeLinecap="round" />
            <ellipse cx="180" cy="145" rx="14" ry="12" fill={skinColor} /> {/* Punho */}
          </>
        );
      case 'kick':
        return (
          <>
            {/* Braços em posição de equilíbrio */}
            <path d="M55 140 Q25 150, 20 170" fill={skinColor} stroke={skinColor} strokeWidth="15" strokeLinecap="round" />
            <path d="M120 140 Q150 150, 155 170" fill={skinColor} stroke={skinColor} strokeWidth="15" strokeLinecap="round" />
          </>
        );
      default: // standing
        return (
          <>
            {/* Braço esquerdo relaxado */}
            <path d="M55 140 Q45 180, 50 210" fill={skinColor} stroke={skinColor} strokeWidth="15" strokeLinecap="round" />
            {/* Braço direito relaxado */}
            <path d="M120 140 Q130 180, 125 210" fill={skinColor} stroke={skinColor} strokeWidth="15" strokeLinecap="round" />
          </>
        );
    }
  };

  // Renderizar pernas baseado na pose
  const renderLegs = () => {
    switch (pose) {
      case 'kick':
        return (
          <>
            {/* Perna esquerda de apoio */}
            <path d="M75 250 Q70 300, 70 340" stroke={kimono.main} strokeWidth="20" fill="none" strokeLinecap="round" />
            {/* Perna direita chutando */}
            <path d="M100 250 Q140 260, 170 240" stroke={kimono.main} strokeWidth="20" fill="none" strokeLinecap="round" />
            <ellipse cx="175" cy="238" rx="12" ry="10" fill={skinColor} /> {/* Pé */}
          </>
        );
      case 'fighting':
        return (
          <>
            {/* Pernas em posição de luta */}
            <path d="M75 250 Q60 300, 55 340" stroke={kimono.main} strokeWidth="20" fill="none" strokeLinecap="round" />
            <path d="M100 250 Q115 300, 120 340" stroke={kimono.main} strokeWidth="20" fill="none" strokeLinecap="round" />
          </>
        );
      default: // standing, punch
        return (
          <>
            {/* Pernas em pé */}
            <path d="M75 250 Q75 300, 72 340" stroke={kimono.main} strokeWidth="20" fill="none" strokeLinecap="round" />
            <path d="M100 250 Q100 300, 103 340" stroke={kimono.main} strokeWidth="20" fill="none" strokeLinecap="round" />
          </>
        );
    }
  };

  return (
    <svg 
      viewBox="0 0 175 360" 
      width={width} 
      height={height}
      style={{ transform: getPoseTransform() }}
    >
      <defs>
        {/* Gradiente para cabelo colorido */}
        <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="25%" stopColor="#ffd93d" />
          <stop offset="50%" stopColor="#6bcb77" />
          <stop offset="75%" stopColor="#4d96ff" />
          <stop offset="100%" stopColor="#9b59b6" />
        </linearGradient>
        {/* Sombra */}
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Sombra no chão */}
      <ellipse cx="87.5" cy="350" rx="40" ry="8" fill="rgba(0,0,0,0.2)" />

      {/* Grupo principal com sombra */}
      <g filter="url(#shadow)">
        {/* Pernas */}
        {renderLegs()}

        {/* Kimono (corpo) */}
        {renderKimonoStyle()}

        {/* Faixa */}
        <rect x="55" y="185" width="65" height="15" rx="2" fill={beltCol.primary} />
        <rect x="55" y="185" width="65" height="15" rx="2" fill="url(#belt-gradient)" opacity="0.3" />
        {/* Nó da faixa */}
        <ellipse cx="87.5" cy="200" rx="8" ry="6" fill={beltCol.secondary} />
        <path d="M80 200 Q75 220, 70 235 M95 200 Q100 220, 105 235" stroke={beltCol.primary} strokeWidth="6" fill="none" strokeLinecap="round" />

        {/* Braços */}
        {renderArms()}

        {/* Cabeça */}
        <ellipse cx="87.5" cy="85" rx="38" ry="45" fill={skinColor} />
        
        {/* Orelhas */}
        <ellipse cx="50" cy="85" rx="8" ry="12" fill={skinColor} />
        <ellipse cx="125" cy="85" rx="8" ry="12" fill={skinColor} />

        {/* Cabelo */}
        {renderHair()}

        {/* Expressão facial */}
        {renderExpression()}

        {/* Acessório de cabeça */}
        {renderHeadAccessory()}
      </g>

      {/* Gradiente da faixa */}
      <defs>
        <linearGradient id="belt-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="black" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const KarateAvatarPro: React.FC<KarateAvatarProProps> = ({
  belt,
  size = 'md',
  showLabel = false,
  className = '',
  skinTone = 'light',
  hairStyle = 'short',
  hairColor = 'black',
  kimonoColor = 'white',
  kimonoStyle = 'traditional',
  headAccessory = 'none',
  expression = 'neutral',
  pose = 'standing',
  mood = 'idle',
  animation = 'idle',
  interactive = false,
  showGlow = false,
  showParticles = false,
  onClick,
  onAnimationEnd,
  equippedItems = [],
}) => {
  const [currentMood, setCurrentMood] = useState<AvatarMood>(mood);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { width, height, fontSize, labelSize } = SIZES[size];
  const beltColor = BELT_COLORS[belt];
  const isBlackBelt = belt === 'black';

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
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [animation, mood, onAnimationEnd]);

  const handleClick = useCallback(() => {
    if (!interactive) return;
    
    setCurrentMood('happy');
    setShowSparkles(true);
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentMood(mood);
      setShowSparkles(false);
      setIsAnimating(false);
    }, 1000);
    
    onClick?.();
  }, [interactive, mood, onClick]);

  const getAnimationClass = () => {
    switch (animation) {
      case 'idle': return 'animate-avatar-float';
      case 'celebrate': return 'animate-avatar-bounce';
      case 'levelUp': return 'animate-avatar-levelup';
      case 'bow': return 'animate-avatar-bow';
      case 'punch': return 'animate-avatar-punch';
      default: return 'animate-avatar-float';
    }
  };

  // Mapear mood para expression
  const getExpressionFromMood = (): Expression => {
    switch (currentMood) {
      case 'happy': return 'happy';
      case 'excited': return 'victorious';
      case 'proud': return 'determined';
      case 'focused': return 'focused';
      default: return expression;
    }
  };

  return (
    <div 
      className={cn(
        'relative flex flex-col items-center transition-all duration-300',
        interactive && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow animado */}
      <AnimatedGlow belt={belt} active={showGlow || isBlackBelt || isHovered} />
      
      {/* Partículas */}
      <Particles active={showParticles || isAnimating} color={beltColor.primary} />
      
      {/* Estrelas */}
      <Sparkles active={showSparkles} />
      
      {/* Container do Avatar */}
      <div 
        className={cn(
          'relative transition-all duration-500',
          getAnimationClass(),
          interactive && isHovered && 'scale-110',
          isAnimating && 'scale-105'
        )}
        style={{ width, height }}
      >
        {/* Avatar SVG */}
        <div 
          className={cn(
            "relative w-full h-full rounded-2xl overflow-visible",
            "transition-all duration-300",
            interactive && "hover:drop-shadow-2xl",
            isBlackBelt && "drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]"
          )}
        >
          <AvatarSVG
            skinTone={skinTone}
            hairStyle={hairStyle}
            hairColor={hairColor}
            kimonoColor={kimonoColor}
            kimonoStyle={kimonoStyle}
            headAccessory={headAccessory}
            expression={getExpressionFromMood()}
            pose={pose}
            belt={belt}
            width={width}
            height={height}
          />
        </div>
        
        {/* Indicador de faixa (canto inferior) */}
        <div 
          className={cn(
            "absolute -bottom-2 left-1/2 transform -translate-x-1/2",
            "px-3 py-1 rounded-full text-xs font-bold",
            "shadow-lg border-2 border-white",
            "transition-all duration-300",
            isHovered && "scale-110"
          )}
          style={{ 
            backgroundColor: beltColor.primary,
            color: belt === 'white' || belt === 'yellow' ? '#1F2937' : '#FFFFFF',
          }}
        >
          {beltColor.name.split(' ')[1]}
        </div>
      </div>
      
      {/* Label da faixa (opcional) */}
      {showLabel && (
        <div className={cn(
          "mt-4 text-center transition-all duration-300",
          fontSize
        )}>
          <p className="font-bold text-gray-800">{beltColor.name}</p>
          <p className={cn("text-gray-500", labelSize)}>Nível {beltColor.level}</p>
        </div>
      )}
    </div>
  );
};

// CSS para animações (adicionar ao index.css ou criar arquivo separado)
export const avatarAnimationsCSS = `
@keyframes avatar-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes avatar-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  25% { transform: translateY(-15px) scale(1.05); }
  50% { transform: translateY(0) scale(1); }
  75% { transform: translateY(-10px) scale(1.02); }
}

@keyframes avatar-levelup {
  0% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.2) rotate(-5deg); }
  50% { transform: scale(1.3) rotate(5deg); }
  75% { transform: scale(1.2) rotate(-3deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes avatar-bow {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(15deg); }
}

@keyframes avatar-punch {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  50% { transform: translateX(20px); }
  75% { transform: translateX(-5px); }
}

@keyframes float-particle {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 0.8; }
  100% { transform: translateY(-60px) scale(0.5); opacity: 0; }
}

@keyframes sparkle-float {
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  25% { transform: scale(1.2) rotate(90deg); opacity: 1; }
  50% { transform: scale(1) rotate(180deg); opacity: 0.8; }
  75% { transform: scale(1.1) rotate(270deg); opacity: 1; }
  100% { transform: scale(0) rotate(360deg); opacity: 0; }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; transform: scale(1.2); }
  50% { opacity: 0.7; transform: scale(1.4); }
}

@keyframes pulse-glow-slow {
  0%, 100% { opacity: 0.2; transform: scale(1.4); }
  50% { opacity: 0.4; transform: scale(1.6); }
}

.animate-avatar-float {
  animation: avatar-float 3s ease-in-out infinite;
}

.animate-avatar-bounce {
  animation: avatar-bounce 0.8s ease-in-out;
}

.animate-avatar-levelup {
  animation: avatar-levelup 1s ease-in-out;
}

.animate-avatar-bow {
  animation: avatar-bow 1s ease-in-out;
}

.animate-avatar-punch {
  animation: avatar-punch 0.5s ease-in-out;
}

.animate-float-particle {
  animation: float-particle 2s ease-out infinite;
}

.animate-sparkle-float {
  animation: sparkle-float 1.5s ease-in-out infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.animate-pulse-glow-slow {
  animation: pulse-glow-slow 3s ease-in-out infinite;
}
`;

export default KarateAvatarPro;
