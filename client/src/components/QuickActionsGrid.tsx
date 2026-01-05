import React, { useState } from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Trophy, 
  TrendingUp, 
  BookOpen, 
  Palette,
  Brain,
  Target,
  Sparkles,
  ChevronRight,
  Star,
  Swords
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  gradient: string;
  hoverBorder: string;
  badge?: string;
  isNew?: boolean;
  points?: number;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'exercises',
    title: 'Exercícios',
    description: 'Resolver atividades e ganhar pontos',
    icon: <FileText className="w-8 h-8" />,
    href: '/student-exercises',
    color: 'text-orange-600',
    gradient: 'from-orange-50 to-amber-50',
    hoverBorder: 'hover:border-orange-300',
    points: 10,
  },
  {
    id: 'rankings',
    title: 'Rankings',
    description: 'Ver sua classificação',
    icon: <Trophy className="w-8 h-8" />,
    href: '/student-leaderboard',
    color: 'text-yellow-600',
    gradient: 'from-yellow-50 to-amber-50',
    hoverBorder: 'hover:border-yellow-300',
  },
  {
    id: 'trails',
    title: 'Trilhas',
    description: 'Acompanhar progresso',
    icon: <TrendingUp className="w-8 h-8" />,
    href: '/student-learning-paths',
    color: 'text-purple-600',
    gradient: 'from-purple-50 to-violet-50',
    hoverBorder: 'hover:border-purple-300',
  },
  {
    id: 'subjects',
    title: 'Disciplinas',
    description: 'Ver todas as disciplinas',
    icon: <BookOpen className="w-8 h-8" />,
    href: '/student-subjects',
    color: 'text-blue-600',
    gradient: 'from-blue-50 to-indigo-50',
    hoverBorder: 'hover:border-blue-300',
  },
  {
    id: 'customize',
    title: 'Personalizar',
    description: 'Customizar seu avatar',
    icon: <Palette className="w-8 h-8" />,
    href: '/student/customize-avatar',
    color: 'text-pink-600',
    gradient: 'from-pink-50 to-rose-50',
    hoverBorder: 'hover:border-pink-300',
  },
  {
    id: 'specialization',
    title: 'Especialização',
    description: 'Escolher seu caminho',
    icon: <Swords className="w-8 h-8" />,
    href: '/student/choose-specialization',
    color: 'text-indigo-600',
    gradient: 'from-indigo-50 to-purple-50',
    hoverBorder: 'hover:border-indigo-300',
    isNew: true,
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
      <Card 
        className={cn(
          'relative overflow-hidden cursor-pointer transition-all duration-300',
          'border-2 hover:shadow-xl hover:-translate-y-1',
          `bg-gradient-to-br ${action.gradient}`,
          action.hoverBorder,
          'group'
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
            <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-lg animate-pulse">
              NOVO
            </span>
          </div>
        )}

        {/* Indicador de pontos */}
        {action.points && (
          <div className="absolute top-3 right-3 z-10">
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full shadow-lg">
              <Sparkles className="w-3 h-3" />
              +{action.points} pts
            </span>
          </div>
        )}

        {/* Decoração de fundo */}
        <div className={cn(
          'absolute -right-8 -bottom-8 w-32 h-32 rounded-full transition-all duration-500',
          'bg-white/30 blur-2xl',
          isHovered && 'scale-150'
        )} />

        <CardContent className="relative p-6">
          {/* Ícone */}
          <div className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
            'bg-white shadow-lg transition-all duration-300',
            'group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl',
            action.color
          )}>
            {action.icon}
          </div>

          {/* Texto */}
          <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-gray-800">
            {action.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {action.description}
          </p>

          {/* Indicador de ação */}
          <div className={cn(
            'flex items-center gap-1 text-sm font-semibold transition-all duration-300',
            action.color,
            'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
          )}>
            <span>Acessar</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>
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
        ...QUICK_ACTIONS.slice(0, 3),
        {
          id: 'ct',
          title: 'Pensamento Computacional',
          description: 'Desenvolver habilidades de PC',
          icon: <Brain className="w-8 h-8" />,
          href: '/student/computational-thinking',
          color: 'text-teal-600',
          gradient: 'from-teal-50 to-cyan-50',
          hoverBorder: 'hover:border-teal-300',
          badge: 'PC',
        },
        ...QUICK_ACTIONS.slice(3),
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

      {/* Grid de ações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
