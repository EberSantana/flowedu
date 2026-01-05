import React, { useState } from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Trophy, 
  TrendingUp, 
  BookOpen, 
  Brain,
  Target,
  Sparkles,
  ChevronRight,
  Star,
  Lightbulb
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgColor: string;
  iconBg: string;
  badge?: string;
  isNew?: boolean;
  points?: number;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'exercises',
    title: 'Exercícios',
    description: 'Resolver atividades e ganhar pontos',
    icon: <FileText className="w-6 h-6" />,
    href: '/student-exercises',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
    iconBg: 'bg-orange-500',
    points: 10,
  },
  {
    id: 'trails',
    title: 'Trilhas',
    description: 'Acompanhar progresso',
    icon: <TrendingUp className="w-6 h-6" />,
    href: '/student-learning-paths',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    iconBg: 'bg-purple-500',
  },
  {
    id: 'subjects',
    title: 'Disciplinas',
    description: 'Ver todas as disciplinas',
    icon: <BookOpen className="w-6 h-6" />,
    href: '/student-subjects',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    iconBg: 'bg-blue-500',
  },
  {
    id: 'review',
    title: 'Revisão',
    description: 'Revisar conteúdos estudados',
    icon: <Lightbulb className="w-6 h-6" />,
    href: '/student-review',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
    iconBg: 'bg-indigo-500',
  },
  {
    id: 'rankings',
    title: 'Rankings',
    description: 'Ver sua classificação',
    icon: <Trophy className="w-6 h-6" />,
    href: '/student-leaderboard',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
    iconBg: 'bg-yellow-500',
  },
];

interface QuickActionCardProps {
  action: QuickAction;
  index: number;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ action, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={action.href}>
      <div 
        className={cn(
          'relative overflow-hidden cursor-pointer transition-all duration-300',
          'rounded-2xl border-2 border-transparent',
          'hover:shadow-lg hover:-translate-y-1',
          action.bgColor,
          'group h-full'
        )}
        style={{ 
          animationDelay: `${index * 50}ms`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Badge "Novo" */}
        {action.isNew && (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-md">
              NOVO
            </span>
          </div>
        )}

        {/* Indicador de pontos */}
        {action.points && (
          <div className="absolute top-3 right-3 z-10">
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full shadow-md">
              <Sparkles className="w-3 h-3" />
              +{action.points}
            </span>
          </div>
        )}

        <div className="relative p-5">
          {/* Ícone */}
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
            'text-white shadow-md transition-all duration-300',
            'group-hover:scale-110',
            action.iconBg
          )}>
            {action.icon}
          </div>

          {/* Texto */}
          <h3 className="font-bold text-gray-900 text-base mb-1.5">
            {action.title}
          </h3>
          <p className="text-sm text-gray-600 leading-snug">
            {action.description}
          </p>

          {/* Indicador de ação */}
          <div className={cn(
            'flex items-center gap-1 text-sm font-semibold mt-3 transition-all duration-300',
            action.color,
            'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
          )}>
            <span>Acessar</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
};

interface QuickActionsGridProps {
  showComputationalThinking?: boolean;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ 
  showComputationalThinking = false 
}) => {
  const actions = showComputationalThinking 
    ? [
        ...QUICK_ACTIONS.slice(0, 2),
        {
          id: 'ct',
          title: 'Pensamento Computacional',
          description: 'Desenvolver habilidades de PC',
          icon: <Brain className="w-6 h-6" />,
          href: '/student/computational-thinking',
          color: 'text-teal-600',
          bgColor: 'bg-teal-50 hover:bg-teal-100',
          iconBg: 'bg-teal-500',
          badge: 'PC',
        },
        ...QUICK_ACTIONS.slice(2),
      ]
    : QUICK_ACTIONS;

  return (
    <div className="mb-10">
      {/* Header da seção */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ações Rápidas</h2>
          <p className="text-sm text-gray-500">Acesse suas atividades favoritas</p>
        </div>
      </div>

      {/* Grid de ações - Padronizado e uniforme */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {actions.map((action, index) => (
          <QuickActionCard 
            key={action.id} 
            action={action} 
            index={index}
          />
        ))}
      </div>

      {/* Dica de gamificação */}
      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Dica do dia
            </p>
            <p className="text-sm text-gray-600">
              Complete exercícios diariamente para manter sua sequência e ganhar bônus de pontos!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsGrid;
