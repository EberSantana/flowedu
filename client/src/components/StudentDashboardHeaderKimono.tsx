import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { KimonoAvatarDisplay, type BeltColor } from './KimonoAvatarDisplay';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Star, 
  Target, 
  Zap,
  Palette,
  TrendingUp,
  Flame,
  Award
} from 'lucide-react';

interface StudentDashboardHeaderKimonoProps {
  studentName: string;
  currentBelt: BeltColor;
  totalPoints: number;
  nextBeltThreshold: number;
  recentAchievement?: string;
  streak?: number;
}

// Configuração das faixas
const BELT_CONFIG: Record<BeltColor, { 
  name: string; 
  minPoints: number; 
  maxPoints: number;
  gradient: string;
  textColor: string;
  bgColor: string;
  glowColor: string;
}> = {
  white: { name: 'Faixa Branca', minPoints: 0, maxPoints: 199, gradient: 'from-gray-100 to-gray-200', textColor: 'text-gray-700', bgColor: 'bg-gray-50', glowColor: 'rgba(156, 163, 175, 0.5)' },
  yellow: { name: 'Faixa Amarela', minPoints: 200, maxPoints: 399, gradient: 'from-yellow-100 to-yellow-200', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50', glowColor: 'rgba(252, 211, 77, 0.5)' },
  orange: { name: 'Faixa Laranja', minPoints: 400, maxPoints: 599, gradient: 'from-orange-100 to-orange-200', textColor: 'text-orange-700', bgColor: 'bg-orange-50', glowColor: 'rgba(251, 146, 60, 0.5)' },
  green: { name: 'Faixa Verde', minPoints: 600, maxPoints: 899, gradient: 'from-green-100 to-green-200', textColor: 'text-green-700', bgColor: 'bg-green-50', glowColor: 'rgba(74, 222, 128, 0.5)' },
  blue: { name: 'Faixa Azul', minPoints: 900, maxPoints: 1199, gradient: 'from-blue-100 to-blue-200', textColor: 'text-blue-700', bgColor: 'bg-blue-50', glowColor: 'rgba(96, 165, 250, 0.5)' },
  purple: { name: 'Faixa Roxa', minPoints: 1200, maxPoints: 1599, gradient: 'from-purple-100 to-purple-200', textColor: 'text-purple-700', bgColor: 'bg-purple-50', glowColor: 'rgba(167, 139, 250, 0.5)' },
  brown: { name: 'Faixa Marrom', minPoints: 1600, maxPoints: 1999, gradient: 'from-amber-200 to-amber-300', textColor: 'text-amber-800', bgColor: 'bg-amber-50', glowColor: 'rgba(180, 83, 9, 0.5)' },
  black: { name: 'Faixa Preta', minPoints: 2000, maxPoints: 9999, gradient: 'from-gray-800 to-gray-900', textColor: 'text-white', bgColor: 'bg-gray-900', glowColor: 'rgba(251, 191, 36, 0.6)' },
};

// Componente de barra de progresso animada
const AnimatedProgressBar: React.FC<{
  current: number;
  max: number;
  belt: BeltColor;
}> = ({ current, max, belt }) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const percentage = Math.min((current / max) * 100, 100);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const getProgressGradient = () => {
    switch (belt) {
      case 'white': return 'from-gray-400 via-gray-300 to-gray-400';
      case 'yellow': return 'from-yellow-500 via-yellow-400 to-yellow-500';
      case 'orange': return 'from-orange-500 via-orange-400 to-orange-500';
      case 'green': return 'from-green-500 via-green-400 to-green-500';
      case 'blue': return 'from-blue-500 via-blue-400 to-blue-500';
      case 'purple': return 'from-purple-500 via-purple-400 to-purple-500';
      case 'brown': return 'from-amber-700 via-amber-600 to-amber-700';
      case 'black': return 'from-yellow-500 via-amber-400 to-yellow-500';
    }
  };

  return (
    <div className="relative w-full">
      <div className="h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <div 
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out relative',
            getProgressGradient()
          )}
          style={{ width: `${animatedWidth}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
          {animatedWidth > 10 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full animate-pulse shadow-lg" />
          )}
        </div>
      </div>
      
      <div className="absolute top-0 left-0 right-0 h-5 flex items-center pointer-events-none">
        {[25, 50, 75].map((milestone) => (
          <div 
            key={milestone}
            className={cn(
              'absolute w-0.5 h-full',
              percentage >= milestone ? 'bg-white/50' : 'bg-gray-300'
            )}
            style={{ left: `${milestone}%` }}
          />
        ))}
      </div>
    </div>
  );
};

// Componente de estatística rápida
const QuickStat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className={cn(
    'flex items-center gap-3 px-4 py-3 rounded-xl bg-white/90 backdrop-blur-sm',
    'border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300',
    'hover:scale-105 cursor-default group'
  )}>
    <div className={cn('p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110', color)}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-lg font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export const StudentDashboardHeaderKimono: React.FC<StudentDashboardHeaderKimonoProps> = ({
  studentName,
  currentBelt,
  totalPoints,
  nextBeltThreshold,
  recentAchievement,
  streak = 0,
}) => {
  const beltConfig = BELT_CONFIG[currentBelt];
  const pointsToNext = nextBeltThreshold - totalPoints;
  const isMaxBelt = currentBelt === 'black';

  return (
    <div className={cn(
      'relative overflow-hidden rounded-3xl mb-8',
      'bg-gradient-to-br from-slate-50 via-white to-blue-50',
      'border border-gray-200/80 shadow-2xl'
    )}>
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ backgroundColor: beltConfig.glowColor }}
        />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-purple-200/40 rounded-full blur-3xl" />
        
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
        </div>
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
      </div>

      <div className="relative p-6 lg:p-10">
        <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">
          {/* Seção do Avatar - Kimono */}
          <div className="flex flex-col items-center">
            <KimonoAvatarDisplay
              belt={currentBelt}
              size="2xl"
              interactive
              showGlow={true}
            />

            {/* Badge da faixa */}
            <div className={cn(
              'mt-6 px-6 py-2.5 rounded-full font-bold text-sm',
              'shadow-xl border-2 transition-all duration-300',
              'hover:scale-105 cursor-default',
              `bg-gradient-to-r ${beltConfig.gradient}`,
              beltConfig.textColor,
              currentBelt === 'black' ? 'border-yellow-400 shadow-yellow-500/30' : 'border-white/80'
            )}>
              <div className="flex items-center gap-2">
                {currentBelt === 'black' && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-pulse" />}
                <span className="tracking-wide">{beltConfig.name}</span>
                {currentBelt === 'black' && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-pulse" />}
              </div>
            </div>

            {/* Botão de personalizar - Loja de Kimonos */}
            <Link href="/student/kimono-shop">
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
              >
                <Palette className="w-4 h-4" />
                Loja de Kimonos
              </Button>
            </Link>
          </div>

          {/* Seção de Informações */}
          <div className="flex-1 flex flex-col justify-center w-full">
            {/* Saudação */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                    Olá, {studentName.split(' ')[0]}! 
                    <span className="inline-block ml-2 animate-bounce">👋</span>
                  </h1>
                  <p className="text-gray-600 text-lg mt-1">
                    Continue sua jornada de aprendizado e conquiste novas faixas!
                  </p>
                </div>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-700">
                    {isMaxBelt ? '🏆 Mestre do Karatê!' : 'Progresso para próxima faixa'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-gray-800">{totalPoints.toLocaleString()} pts</span>
                </div>
              </div>
              
              <AnimatedProgressBar 
                current={totalPoints - beltConfig.minPoints} 
                max={beltConfig.maxPoints - beltConfig.minPoints} 
                belt={currentBelt}
              />
              
              <div className="flex justify-between mt-3 text-sm">
                <span className="text-gray-500">{beltConfig.minPoints} pts</span>
                {!isMaxBelt && (
                  <span className="text-gray-600 font-medium">
                    Faltam <span className="text-blue-600 font-bold">{pointsToNext.toLocaleString()}</span> pontos
                  </span>
                )}
                <span className="text-gray-500">{beltConfig.maxPoints} pts</span>
              </div>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickStat 
                icon={<Award className="w-5 h-5 text-white" />}
                label="Faixa Atual"
                value={beltConfig.name.replace('Faixa ', '')}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <QuickStat 
                icon={<Zap className="w-5 h-5 text-white" />}
                label="Pontos Totais"
                value={totalPoints.toLocaleString()}
                color="bg-gradient-to-br from-amber-500 to-orange-500"
              />
              <QuickStat 
                icon={<Flame className="w-5 h-5 text-white" />}
                label="Sequência"
                value={`${streak} dias`}
                color="bg-gradient-to-br from-red-500 to-pink-500"
              />
              <QuickStat 
                icon={<TrendingUp className="w-5 h-5 text-white" />}
                label="Próxima Faixa"
                value={isMaxBelt ? 'Máximo!' : `${pointsToNext} pts`}
                color="bg-gradient-to-br from-green-500 to-emerald-500"
              />
            </div>

            {/* Conquista Recente */}
            {recentAchievement && (
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Star className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-amber-600 font-medium">Conquista Recente</p>
                    <p className="text-sm font-bold text-amber-800">{recentAchievement}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardHeaderKimono;
