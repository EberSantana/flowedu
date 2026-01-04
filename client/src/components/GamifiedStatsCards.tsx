import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  CheckCircle, 
  GraduationCap, 
  Trophy,
  Target,
  Flame,
  Star,
  Zap,
  Award
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'yellow' | 'pink';
  delay?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const COLOR_SCHEMES = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-100',
    border: 'border-blue-200 hover:border-blue-300',
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    text: 'text-blue-600',
    glow: 'shadow-blue-200/50',
  },
  green: {
    bg: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100',
    border: 'border-green-200 hover:border-green-300',
    iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
    text: 'text-green-600',
    glow: 'shadow-green-200/50',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-100',
    border: 'border-purple-200 hover:border-purple-300',
    iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
    text: 'text-purple-600',
    glow: 'shadow-purple-200/50',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100',
    border: 'border-orange-200 hover:border-orange-300',
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
    text: 'text-orange-600',
    glow: 'shadow-orange-200/50',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100',
    border: 'border-yellow-200 hover:border-yellow-300',
    iconBg: 'bg-gradient-to-br from-yellow-500 to-amber-500',
    text: 'text-yellow-600',
    glow: 'shadow-yellow-200/50',
  },
  pink: {
    bg: 'bg-gradient-to-br from-pink-50 via-rose-50 to-red-100',
    border: 'border-pink-200 hover:border-pink-300',
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600',
    text: 'text-pink-600',
    glow: 'shadow-pink-200/50',
  },
};

// Componente de número animado
const AnimatedNumber: React.FC<{ value: number; delay?: number }> = ({ value, delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1000;
      const steps = 30;
      const increment = value / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return <span>{displayValue}</span>;
};

// Card de estatística individual
const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color, 
  delay = 0,
  trend 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const scheme = COLOR_SCHEMES[color];
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-500',
        'hover:shadow-xl hover:-translate-y-1 cursor-default',
        scheme.bg,
        scheme.border,
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      {/* Decoração de fundo */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
      
      <div className="relative">
        {/* Header com ícone */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            {title}
          </span>
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shadow-lg',
            'transform transition-transform duration-300 hover:scale-110 hover:rotate-3',
            scheme.iconBg
          )}>
            {icon}
          </div>
        </div>
        
        {/* Valor */}
        <div className={cn('text-5xl font-bold mb-2', scheme.text)}>
          <AnimatedNumber value={value} delay={delay + 200} />
        </div>
        
        {/* Subtítulo e trend */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 font-medium">{subtitle}</p>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
              trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente principal de stats
interface GamifiedStatsCardsProps {
  activeSubjects: number;
  completedSubjects: number;
  totalSubjects: number;
  totalPoints?: number;
  exercisesCompleted?: number;
  badges?: number;
}

export const GamifiedStatsCards: React.FC<GamifiedStatsCardsProps> = ({
  activeSubjects,
  completedSubjects,
  totalSubjects,
  totalPoints = 0,
  exercisesCompleted = 0,
  badges = 0,
}) => {
  return (
    <div className="mb-10">
      {/* Grid principal de stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Disciplinas Ativas"
          value={activeSubjects}
          subtitle="em andamento"
          icon={<BookOpen className="w-6 h-6 text-white" />}
          color="blue"
          delay={0}
        />
        
        <StatCard
          title="Concluídas"
          value={completedSubjects}
          subtitle="disciplinas finalizadas"
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          color="green"
          delay={100}
        />
        
        <StatCard
          title="Total de Disciplinas"
          value={totalSubjects}
          subtitle="no histórico"
          icon={<GraduationCap className="w-6 h-6 text-white" />}
          color="purple"
          delay={200}
        />
      </div>

      {/* Stats secundárias (gamificação) */}
      {(totalPoints > 0 || exercisesCompleted > 0 || badges > 0) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {totalPoints > 0 && (
            <MiniStatCard
              icon={<Zap className="w-5 h-5" />}
              label="Pontos"
              value={totalPoints.toLocaleString()}
              color="yellow"
            />
          )}
          {exercisesCompleted > 0 && (
            <MiniStatCard
              icon={<Target className="w-5 h-5" />}
              label="Exercícios"
              value={exercisesCompleted.toString()}
              color="orange"
            />
          )}
          {badges > 0 && (
            <MiniStatCard
              icon={<Award className="w-5 h-5" />}
              label="Badges"
              value={badges.toString()}
              color="pink"
            />
          )}
          <MiniStatCard
            icon={<Flame className="w-5 h-5" />}
            label="Sequência"
            value="0 dias"
            color="red"
          />
        </div>
      )}
    </div>
  );
};

// Mini card de estatística
const MiniStatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'yellow' | 'orange' | 'pink' | 'red' | 'blue' | 'green';
}> = ({ icon, label, value, color }) => {
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    pink: 'bg-pink-50 border-pink-200 text-pink-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
  };

  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300',
      'hover:shadow-md hover:-translate-y-0.5',
      colorClasses[color]
    )}>
      <div className="p-2 bg-white rounded-lg shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
};

export default GamifiedStatsCards;
