import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Trophy, 
  Star, 
  Zap, 
  Award, 
  Target,
  Flame,
  X
} from 'lucide-react';

export type AchievementType = 
  | 'points' 
  | 'belt' 
  | 'badge' 
  | 'streak' 
  | 'exercise' 
  | 'milestone';

interface AchievementToastProps {
  type: AchievementType;
  title: string;
  description: string;
  points?: number;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const ACHIEVEMENT_CONFIG: Record<AchievementType, {
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  borderColor: string;
  confettiColors: string[];
}> = {
  points: {
    icon: <Zap className="w-6 h-6 text-yellow-600" />,
    gradient: 'from-yellow-50 via-amber-50 to-orange-50',
    iconBg: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    confettiColors: ['#FCD34D', '#F59E0B', '#D97706'],
  },
  belt: {
    icon: <Trophy className="w-6 h-6 text-purple-600" />,
    gradient: 'from-purple-50 via-violet-50 to-fuchsia-50',
    iconBg: 'bg-purple-100',
    borderColor: 'border-purple-300',
    confettiColors: ['#A78BFA', '#8B5CF6', '#7C3AED'],
  },
  badge: {
    icon: <Award className="w-6 h-6 text-blue-600" />,
    gradient: 'from-blue-50 via-indigo-50 to-purple-50',
    iconBg: 'bg-blue-100',
    borderColor: 'border-blue-300',
    confettiColors: ['#60A5FA', '#3B82F6', '#2563EB'],
  },
  streak: {
    icon: <Flame className="w-6 h-6 text-orange-600" />,
    gradient: 'from-orange-50 via-red-50 to-pink-50',
    iconBg: 'bg-orange-100',
    borderColor: 'border-orange-300',
    confettiColors: ['#FB923C', '#F97316', '#EA580C'],
  },
  exercise: {
    icon: <Target className="w-6 h-6 text-green-600" />,
    gradient: 'from-green-50 via-emerald-50 to-teal-50',
    iconBg: 'bg-green-100',
    borderColor: 'border-green-300',
    confettiColors: ['#4ADE80', '#22C55E', '#16A34A'],
  },
  milestone: {
    icon: <Star className="w-6 h-6 text-pink-600" />,
    gradient: 'from-pink-50 via-rose-50 to-red-50',
    iconBg: 'bg-pink-100',
    borderColor: 'border-pink-300',
    confettiColors: ['#F472B6', '#EC4899', '#DB2777'],
  },
};

// Componente de confetti
const Confetti: React.FC<{ colors: string[]; isActive: boolean }> = ({ colors, isActive }) => {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: '-10px',
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1 + Math.random() * 1}s`,
          }}
        />
      ))}
    </div>
  );
};

// Componente de estrelas brilhantes
const SparkleEffect: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <svg
          key={i}
          className="absolute w-4 h-4 animate-sparkle"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * 0.15}s`,
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

export const AchievementToast: React.FC<AchievementToastProps> = ({
  type,
  title,
  description,
  points,
  isVisible,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}) => {
  const [showEffects, setShowEffects] = useState(false);
  const config = ACHIEVEMENT_CONFIG[type];

  useEffect(() => {
    if (isVisible) {
      setShowEffects(true);
      const effectTimer = setTimeout(() => setShowEffects(false), 2000);
      
      if (autoClose) {
        const closeTimer = setTimeout(onClose, autoCloseDelay);
        return () => {
          clearTimeout(effectTimer);
          clearTimeout(closeTimer);
        };
      }
      
      return () => clearTimeout(effectTimer);
    }
  }, [isVisible, autoClose, autoCloseDelay, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
      <div className={cn(
        'relative w-80 p-4 rounded-2xl border-2 shadow-2xl',
        'bg-gradient-to-br backdrop-blur-sm',
        config.gradient,
        config.borderColor
      )}>
        {/* Efeitos */}
        <Confetti colors={config.confettiColors} isActive={showEffects} />
        <SparkleEffect isActive={showEffects} />

        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/50 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Conteúdo */}
        <div className="relative flex items-start gap-4">
          {/* Ícone */}
          <div className={cn(
            'flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center',
            'shadow-lg animate-bounce-in',
            config.iconBg
          )}>
            {config.icon}
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Conquista Desbloqueada!
            </p>
            <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">
              {title}
            </h4>
            <p className="text-sm text-gray-600">
              {description}
            </p>
            
            {/* Pontos ganhos */}
            {points && points > 0 && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full">
                <Zap className="w-3 h-3 text-yellow-600" />
                <span className="text-xs font-bold text-yellow-700">
                  +{points} pontos
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Barra de progresso de auto-close */}
        {autoClose && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-2xl overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-gray-400 to-gray-500"
              style={{
                animation: `shrink ${autoCloseDelay}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// Hook para gerenciar toasts de conquista
export const useAchievementToast = () => {
  const [toast, setToast] = useState<{
    type: AchievementType;
    title: string;
    description: string;
    points?: number;
  } | null>(null);

  const showAchievement = (
    type: AchievementType,
    title: string,
    description: string,
    points?: number
  ) => {
    setToast({ type, title, description, points });
  };

  const hideAchievement = () => {
    setToast(null);
  };

  const AchievementToastComponent = toast ? (
    <AchievementToast
      type={toast.type}
      title={toast.title}
      description={toast.description}
      points={toast.points}
      isVisible={true}
      onClose={hideAchievement}
    />
  ) : null;

  return {
    showAchievement,
    hideAchievement,
    AchievementToastComponent,
  };
};

export default AchievementToast;
