import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { KarateAvatarPro, type BeltColor, type AvatarMood } from './KarateAvatarPro';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Star, 
  Trophy, 
  Target, 
  Zap,
  ChevronRight,
  Palette,
  TrendingUp,
  Flame
} from 'lucide-react';

interface StudentDashboardHeaderProps {
  studentName: string;
  currentBelt: BeltColor;
  totalPoints: number;
  nextBeltThreshold: number;
  skinTone?: 'light' | 'medium' | 'tan' | 'dark' | 'darker' | 'darkest';
  hairStyle?: 'short' | 'medium' | 'long' | 'bald' | 'ponytail';
  kimonoColor?: 'white' | 'blue' | 'red' | 'black';
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
      {/* Background da barra */}
      <div className="h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        {/* Barra de progresso */}
        <div 
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out relative',
            getProgressGradient()
          )}
          style={{ width: `${animatedWidth}%` }}
        >
          {/* Efeito de brilho */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
          
          {/* Partículas no final da barra */}
          {animatedWidth > 10 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full animate-pulse shadow-lg" />
          )}
        </div>
      </div>
      
      {/* Marcadores de milestone */}
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

export const StudentDashboardHeader: React.FC<StudentDashboardHeaderProps> = ({
  studentName,
  currentBelt,
  totalPoints,
  nextBeltThreshold,
  skinTone = 'light',
  hairStyle = 'short',
  kimonoColor = 'white',
  recentAchievement,
  streak = 0,
}) => {
  const [avatarMood, setAvatarMood] = useState<AvatarMood>('idle');
  const beltConfig = BELT_CONFIG[currentBelt];
  const pointsToNext = nextBeltThreshold - totalPoints;
  const isMaxBelt = currentBelt === 'black';

  // Animação de boas-vindas
  useEffect(() => {
    const timer = setTimeout(() => {
      setAvatarMood('happy');
      setTimeout(() => setAvatarMood('idle'), 1500);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAvatarClick = () => {
    setAvatarMood('excited');
    setTimeout(() => setAvatarMood('idle'), 1200);
  };

  return (
    <div className={cn(
      'relative overflow-hidden rounded-3xl mb-8',
      'bg-gradient-to-br from-slate-50 via-white to-blue-50',
      'border border-gray-200/80 shadow-2xl'
    )}>
      {/* Background decorativo aprimorado */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradientes de fundo */}
        <div 
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse-glow-slow"
          style={{ backgroundColor: beltConfig.glowColor }}
        />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-purple-200/40 rounded-full blur-3xl" />
        
        {/* Padrão de pontos decorativo */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
        </div>
        
        {/* Linhas decorativas */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
      </div>

      <div className="relative p-6 lg:p-10">
        <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">
          {/* Seção do Avatar 3D */}
          <div className="flex flex-col items-center">
            {/* Container do Avatar com efeitos aprimorados */}
            <div className="relative group">
              {/* Círculos decorativos de fundo */}
              <div className={cn(
                'absolute inset-0 rounded-full transition-all duration-700',
                'group-hover:scale-110',
                isMaxBelt && 'animate-black-belt-glow'
              )} />
              
              {/* Avatar 3D Profissional */}
              <KarateAvatarPro
                belt={currentBelt}
                size="2xl"
                skinTone={skinTone}
                hairStyle={hairStyle}
                kimonoColor={kimonoColor}
                mood={avatarMood}
                animation="idle"
                interactive
                showGlow={true}
                showParticles={isMaxBelt}
                onClick={handleAvatarClick}
              />
            </div>

            {/* Badge da faixa aprimorado */}
            <div className={cn(
              'mt-6 px-6 py-2.5 rounded-full font-bold text-sm',
              'shadow-xl border-2 transition-all duration-300',
              'hover:scale-105 cursor-default animate-float-text',
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

            {/* Botão de personalizar */}
            <Link href="/student/customize-avatar">
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 gap-2 hover:bg-pink-50 hover:border-pink-300 hover:text-pink-600 transition-all shadow-sm"
              >
                <Palette className="w-4 h-4" />
                Personalizar Avatar
              </Button>
            </Link>
          </div>

          {/* Seção de Informações */}
          <div className="flex-1 flex flex-col justify-center w-full">
            {/* Saudação aprimorada */}
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

            {/* Barra de Progresso aprimorada */}
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
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-2 rounded-full">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold text-yellow-700">
                    {totalPoints.toLocaleString()} pts
                  </span>
                  {!isMaxBelt && (
                    <span className="text-gray-400 font-medium">
                      / {nextBeltThreshold.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              <AnimatedProgressBar 
                current={totalPoints} 
                max={nextBeltThreshold} 
                belt={currentBelt}
              />
              
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  {isMaxBelt 
                    ? '✨ Você alcançou o nível máximo! Continue praticando para manter sua excelência.'
                    : `🎯 Faltam ${pointsToNext.toLocaleString()} pontos para a próxima faixa`
                  }
                </p>
                {!isMaxBelt && (
                  <Link href="/student-exercises">
                    <Button size="sm" className="gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30">
                      Ganhar pontos
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Stats rápidos aprimorados */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickStat
                icon={<Trophy className="w-5 h-5 text-yellow-600" />}
                label="Pontos Totais"
                value={totalPoints.toLocaleString()}
                color="bg-gradient-to-br from-yellow-100 to-amber-100"
              />
              <QuickStat
                icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                label="Nível Atual"
                value={BELT_CONFIG[currentBelt].name.replace('Faixa ', '')}
                color="bg-gradient-to-br from-green-100 to-emerald-100"
              />
              {streak > 0 ? (
                <QuickStat
                  icon={<Flame className="w-5 h-5 text-orange-600" />}
                  label="Sequência"
                  value={`${streak} dias 🔥`}
                  color="bg-gradient-to-br from-orange-100 to-red-100"
                />
              ) : (
                <QuickStat
                  icon={<Star className="w-5 h-5 text-purple-600" />}
                  label="Nível"
                  value={`${BELT_CONFIG[currentBelt].minPoints}+ pts`}
                  color="bg-gradient-to-br from-purple-100 to-pink-100"
                />
              )}
            </div>

            {/* Conquista recente aprimorada */}
            {recentAchievement && (
              <div className="mt-5 flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 rounded-2xl border border-yellow-200/80 shadow-md">
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl shadow-lg">
                  <Star className="w-6 h-6 text-white fill-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-yellow-700 font-semibold uppercase tracking-wide">🎉 Conquista Recente</p>
                  <p className="text-base font-bold text-gray-800 mt-0.5">{recentAchievement}</p>
                </div>
                <div className="hidden sm:flex items-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardHeader;
