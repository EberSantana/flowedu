import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Target, 
  Trophy, 
  Star, 
  Zap, 
  Award,
  ChevronRight,
  Lock,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { type BeltColor } from './KarateAvatarPro';

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: string;
  rewardPoints: number;
  icon: React.ReactNode;
  color: string;
  isCompleted?: boolean;
  isLocked?: boolean;
}

interface NextGoalsSectionProps {
  currentBelt: BeltColor;
  totalPoints: number;
  exercisesCompleted?: number;
  badgesEarned?: number;
}

// Configuração de metas baseadas na faixa
const getGoalsForBelt = (
  belt: BeltColor, 
  points: number, 
  exercises: number,
  badges: number
): Goal[] => {
  const beltGoals: Record<BeltColor, { nextBelt: string; pointsNeeded: number }> = {
    white: { nextBelt: 'Amarela', pointsNeeded: 200 },
    yellow: { nextBelt: 'Laranja', pointsNeeded: 400 },
    orange: { nextBelt: 'Verde', pointsNeeded: 600 },
    green: { nextBelt: 'Azul', pointsNeeded: 900 },
    blue: { nextBelt: 'Roxa', pointsNeeded: 1200 },
    purple: { nextBelt: 'Marrom', pointsNeeded: 1600 },
    brown: { nextBelt: 'Preta', pointsNeeded: 2000 },
    black: { nextBelt: 'Mestre', pointsNeeded: 5000 },
  };

  const currentBeltGoal = beltGoals[belt];
  const pointsToNextBelt = Math.max(0, currentBeltGoal.pointsNeeded - points);

  return [
    {
      id: 'next-belt',
      title: `Conquistar Faixa ${currentBeltGoal.nextBelt}`,
      description: `Alcance ${currentBeltGoal.pointsNeeded} pontos para evoluir`,
      progress: points,
      target: currentBeltGoal.pointsNeeded,
      reward: `Faixa ${currentBeltGoal.nextBelt}`,
      rewardPoints: 50,
      icon: <Trophy className="w-5 h-5" />,
      color: 'yellow',
      isCompleted: points >= currentBeltGoal.pointsNeeded,
    },
    {
      id: 'exercises-10',
      title: 'Completar 10 Exercícios',
      description: 'Resolva exercícios para praticar',
      progress: Math.min(exercises, 10),
      target: 10,
      reward: 'Badge Iniciante',
      rewardPoints: 25,
      icon: <Target className="w-5 h-5" />,
      color: 'blue',
      isCompleted: exercises >= 10,
    },
    {
      id: 'badges-3',
      title: 'Conquistar 3 Badges',
      description: 'Desbloqueie conquistas especiais',
      progress: Math.min(badges, 3),
      target: 3,
      reward: 'Título Colecionador',
      rewardPoints: 30,
      icon: <Award className="w-5 h-5" />,
      color: 'purple',
      isCompleted: badges >= 3,
    },
    {
      id: 'streak-7',
      title: 'Sequência de 7 Dias',
      description: 'Estude por 7 dias consecutivos',
      progress: 0,
      target: 7,
      reward: 'Badge Dedicado',
      rewardPoints: 50,
      icon: <Zap className="w-5 h-5" />,
      color: 'orange',
      isLocked: exercises < 5,
    },
  ];
};

// Componente de card de meta
const GoalCard: React.FC<{ goal: Goal }> = ({ goal }) => {
  const progressPercentage = Math.min((goal.progress / goal.target) * 100, 100);
  
  const colorClasses: Record<string, { bg: string; progress: string; icon: string; border: string }> = {
    yellow: {
      bg: 'bg-yellow-50',
      progress: 'bg-gradient-to-r from-yellow-400 to-amber-500',
      icon: 'bg-yellow-100 text-yellow-600',
      border: 'border-yellow-200',
    },
    blue: {
      bg: 'bg-blue-50',
      progress: 'bg-gradient-to-r from-blue-400 to-indigo-500',
      icon: 'bg-blue-100 text-blue-600',
      border: 'border-blue-200',
    },
    purple: {
      bg: 'bg-purple-50',
      progress: 'bg-gradient-to-r from-purple-400 to-violet-500',
      icon: 'bg-purple-100 text-purple-600',
      border: 'border-purple-200',
    },
    orange: {
      bg: 'bg-orange-50',
      progress: 'bg-gradient-to-r from-orange-400 to-red-500',
      icon: 'bg-orange-100 text-orange-600',
      border: 'border-orange-200',
    },
    green: {
      bg: 'bg-green-50',
      progress: 'bg-gradient-to-r from-green-400 to-emerald-500',
      icon: 'bg-green-100 text-green-600',
      border: 'border-green-200',
    },
  };

  const colors = colorClasses[goal.color] || colorClasses.blue;

  if (goal.isLocked) {
    return (
      <div className={cn(
        'relative p-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50',
        'opacity-60'
      )}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-200 rounded-lg">
            <Lock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-500">{goal.title}</h4>
            <p className="text-xs text-gray-400">Complete mais exercícios para desbloquear</p>
          </div>
        </div>
      </div>
    );
  }

  if (goal.isCompleted) {
    return (
      <div className={cn(
        'relative p-4 rounded-xl border-2 bg-gradient-to-br from-green-50 to-emerald-50',
        'border-green-300'
      )}>
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-6 h-6 text-green-500 fill-green-100" />
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            {goal.icon}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-green-700">{goal.title}</h4>
            <p className="text-xs text-green-600">Concluído!</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-semibold text-green-700">
            +{goal.rewardPoints} pontos ganhos
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'relative p-4 rounded-xl border-2 transition-all duration-300',
      'hover:shadow-md hover:-translate-y-0.5',
      colors.bg,
      colors.border
    )}>
      <div className="flex items-start gap-3 mb-3">
        <div className={cn('p-2 rounded-lg', colors.icon)}>
          {goal.icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{goal.title}</h4>
          <p className="text-xs text-gray-500">{goal.description}</p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">Progresso</span>
          <span className="font-semibold text-gray-700">
            {goal.progress} / {goal.target}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn('h-full rounded-full transition-all duration-500', colors.progress)}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Recompensa */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-xs text-gray-600">
            Recompensa: <strong>{goal.reward}</strong>
          </span>
        </div>
        <span className="text-xs font-bold text-yellow-600">
          +{goal.rewardPoints} pts
        </span>
      </div>
    </div>
  );
};

export const NextGoalsSection: React.FC<NextGoalsSectionProps> = ({
  currentBelt,
  totalPoints,
  exercisesCompleted = 0,
  badgesEarned = 0,
}) => {
  const goals = getGoalsForBelt(currentBelt, totalPoints, exercisesCompleted, badgesEarned);
  const completedGoals = goals.filter(g => g.isCompleted).length;
  const totalGoals = goals.filter(g => !g.isLocked).length;

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Próximas Metas</h2>
            <p className="text-sm text-gray-500">
              {completedGoals} de {totalGoals} metas concluídas
            </p>
          </div>
        </div>
        <Link href="/student-leaderboard">
          <Button variant="outline" size="sm" className="gap-1">
            Ver Ranking
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Grid de metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>

      {/* Motivação */}
      {completedGoals === totalGoals && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-green-800">Parabéns!</p>
              <p className="text-sm text-green-600">
                Você completou todas as metas disponíveis. Continue praticando para desbloquear novas!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NextGoalsSection;
