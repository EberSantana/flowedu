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
  TrendingUp
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
}> = {
  white: { name: 'Faixa Branca', minPoints: 0, maxPoints: 199, gradient: 'from-gray-100 to-gray-200', textColor: 'text-gray-700', bgColor: 'bg-gray-50' },
  yellow: { name: 'Faixa Amarela', minPoints: 200, maxPoints: 399, gradient: 'from-yellow-100 to-yellow-200', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  orange: { name: 'Faixa Laranja', minPoints: 400, maxPoints: 599, gradient: 'from-orange-100 to-orange-200', textColor: 'text-orange-700', bgColor: 'bg-orange-50' },
  green: { name: 'Faixa Verde', minPoints: 600, maxPoints: 899, gradient: 'from-green-100 to-green-200', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  blue: { name: 'Faixa Azul', minPoints: 900, maxPoints: 1199, gradient: 'from-blue-100 to-blue-200', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  purple: { name: 'Faixa Roxa', minPoints: 1200, maxPoints: 1599, gradient: 'from-purple-100 to-purple-200', textColor: 'text-purple-700', bgColor: 'bg-purple-50' },
  brown: { name: 'Faixa Marrom', minPoints: 1600, maxPoints: 1999, gradient: 'from-amber-200 to-amber-300', textColor: 'text-amber-800', bgColor: 'bg-amber-50' },
  black: { name: 'Faixa Preta', minPoints: 2000, maxPoints: 9999, gradient: 'from-gray-800 to-gray-900', textColor: 'text-white', bgColor: 'bg-gray-900' },
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
      case 'black': return 'from-gray-700 via-gray-600 to-gray-700';
    }
  };

  return (
    <div className="relative w-full">
      {/* Background da barra */}
      <div className="h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
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
        </div>
      </div>
      
      {/* Marcadores de milestone */}
      <div className="absolute top-0 left-0 right-0 h-4 flex items-center">
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
    'flex items-center gap-3 px-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm',
    'border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300',
    'hover:scale-105 cursor-default'
  )}>
    <div className={cn('p-2 rounded-lg', color)}>
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
  const [showWelcome, setShowWelcome] = useState(true);
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
    setTimeout(() => setAvatarMood('idle'), 1000);
  };

  return (
    <div className={cn(
      'relative overflow-hidden rounded-3xl mb-8',
      'bg-gradient-to-br from-slate-50 via-white to-blue-50',
      'border border-gray-200 shadow-xl'
    )}>
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 rounded-full blur-3xl" />
        
        {/* Padrão de pontos decorativo */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
        </div>
      </div>

      <div className="relative p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Seção do Avatar */}
          <div className="flex flex-col items-center lg:items-start">
            {/* Container do Avatar com efeitos */}
            <div className="relative group">
              {/* Glow effect baseado na faixa */}
              <div className={cn(
                'absolute inset-0 rounded-full blur-2xl opacity-40 transition-opacity duration-500',
                'group-hover:opacity-60',
                currentBelt === 'black' && 'bg-gradient-to-r from-yellow-400 to-amber-500',
                currentBelt === 'purple' && 'bg-purple-400',
                currentBelt === 'blue' && 'bg-blue-400',
                currentBelt === 'green' && 'bg-green-400',
                currentBelt === 'orange' && 'bg-orange-400',
                currentBelt === 'yellow' && 'bg-yellow-400',
                currentBelt === 'brown' && 'bg-amber-600',
                currentBelt === 'white' && 'bg-gray-300',
              )} />
              
              <KarateAvatarPro
                belt={currentBelt}
                size="xl"
                skinTone={skinTone}
                hairStyle={hairStyle}
                kimonoColor={kimonoColor}
                mood={avatarMood}
                animation="idle"
                interactive
                showGlow={currentBelt === 'black'}
                onClick={handleAvatarClick}
              />
            </div>

            {/* Badge da faixa */}
            <div className={cn(
              'mt-4 px-5 py-2 rounded-full font-bold text-sm',
              'shadow-lg border-2 transition-all duration-300',
              'hover:scale-105 cursor-default',
              `bg-gradient-to-r ${beltConfig.gradient}`,
              beltConfig.textColor,
              currentBelt === 'black' ? 'border-yellow-500' : 'border-white'
            )}>
              <div className="flex items-center gap-2">
                {currentBelt === 'black' && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                <span>{beltConfig.name}</span>
                {currentBelt === 'black' && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
              </div>
            </div>

            {/* Botão de personalizar */}
            <Link href="/student/customize-avatar">
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 gap-2 hover:bg-pink-50 hover:border-pink-300 hover:text-pink-600 transition-all"
              >
                <Palette className="w-4 h-4" />
                Personalizar
              </Button>
            </Link>
          </div>

          {/* Seção de Informações */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Saudação */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                    Olá, {studentName.split(' ')[0]}!
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Continue sua jornada de aprendizado
                  </p>
                </div>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-md mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-700">
                    {isMaxBelt ? 'Mestre do Karatê!' : 'Progresso para próxima faixa'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold text-blue-600">
                    {totalPoints.toLocaleString()} pts
                  </span>
                  {!isMaxBelt && (
                    <span className="text-gray-400">
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
              
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-gray-500">
                  {isMaxBelt 
                    ? 'Você alcançou o nível máximo! Continue praticando para manter sua excelência.'
                    : `Faltam ${pointsToNext.toLocaleString()} pontos para a próxima faixa`
                  }
                </p>
                {!isMaxBelt && (
                  <Link href="/student-exercises">
                    <Button size="sm" className="gap-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Ganhar pontos
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Stats rápidos */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <QuickStat
                icon={<Trophy className="w-5 h-5 text-yellow-600" />}
                label="Pontos Totais"
                value={totalPoints.toLocaleString()}
                color="bg-yellow-100"
              />
              <QuickStat
                icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                label="Nível"
                value={BELT_CONFIG[currentBelt].name.replace('Faixa ', '')}
                color="bg-green-100"
              />
              {streak > 0 && (
                <QuickStat
                  icon={<Zap className="w-5 h-5 text-orange-600" />}
                  label="Sequência"
                  value={`${streak} dias`}
                  color="bg-orange-100"
                />
              )}
            </div>

            {/* Conquista recente */}
            {recentAchievement && (
              <div className="mt-4 flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-yellow-700 font-medium">Conquista Recente</p>
                  <p className="text-sm font-bold text-gray-800">{recentAchievement}</p>
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
