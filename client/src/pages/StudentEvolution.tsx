import { useState, useEffect, useRef } from 'react';
import StudentLayout from '../components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Belt3DRealistic, BeltColor, BELT_COLORS } from '@/components/Belt3DRealistic';
import { LevelUpModal } from '@/components/LevelUpModal';
import { AnimatedProgressBar } from '@/components/AnimatedProgressBar';
import { showGamificationToast, useDetectLevelUp } from '@/components/GamificationToast';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Zap, 
  Calendar,
  Award,
  Lock,
  Sparkles,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Configuração das faixas
const BELT_CONFIG: Array<{
  name: BeltColor;
  label: string;
  minPoints: number;
  color: string;
  icon: string;
}> = [
  { name: 'white', label: 'Branca', minPoints: 0, color: '#FFFFFF', icon: '⚪' },
  { name: 'yellow', label: 'Amarela', minPoints: 100, color: '#FFD700', icon: '🟡' },
  { name: 'orange', label: 'Laranja', minPoints: 250, color: '#FF8C00', icon: '🟠' },
  { name: 'green', label: 'Verde', minPoints: 500, color: '#22C55E', icon: '🟢' },
  { name: 'blue', label: 'Azul', minPoints: 1000, color: '#3B82F6', icon: '🔵' },
  { name: 'purple', label: 'Roxa', minPoints: 2000, color: '#8B5CF6', icon: '🟣' },
  { name: 'brown', label: 'Marrom', minPoints: 3500, color: '#A16207', icon: '🟤' },
  { name: 'black', label: 'Preta', minPoints: 5000, color: '#1A1A1A', icon: '⚫' },
];

// Helper para calcular faixa baseado em pontos
function getBeltFromPoints(points: number): BeltColor {
  for (let i = BELT_CONFIG.length - 1; i >= 0; i--) {
    if (points >= BELT_CONFIG[i].minPoints) {
      return BELT_CONFIG[i].name;
    }
  }
  return 'white';
}

// Helper para próximo threshold
function getNextBeltThreshold(points: number): number {
  for (const belt of BELT_CONFIG) {
    if (points < belt.minPoints) {
      return belt.minPoints;
    }
  }
  return BELT_CONFIG[BELT_CONFIG.length - 1].minPoints;
}

export default function StudentEvolution() {
  const { student } = useStudentAuth();
  const [selectedBelt, setSelectedBelt] = useState<BeltColor | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{
    oldBelt: any;
    newBelt: any;
  } | null>(null);
  const previousBeltRef = useRef<BeltColor | null>(null);

  // Buscar estatísticas do aluno
  const { data: stats, isLoading } = trpc.gamification.getStudentStats.useQuery();

  const totalPoints = stats?.totalPoints || 0;
  const currentBelt = getBeltFromPoints(totalPoints);

  // Detectar mudança de faixa e mostrar modal
  useEffect(() => {
    if (previousBeltRef.current && previousBeltRef.current !== currentBelt) {
      const oldBeltConfig = BELT_CONFIG.find(b => b.name === previousBeltRef.current);
      const newBeltConfig = BELT_CONFIG.find(b => b.name === currentBelt);
      
      if (oldBeltConfig && newBeltConfig) {
        setLevelUpData({
          oldBelt: {
            name: oldBeltConfig.name,
            displayName: oldBeltConfig.label,
            level: BELT_CONFIG.findIndex(b => b.name === oldBeltConfig.name) + 1,
            color: oldBeltConfig.color,
            icon: oldBeltConfig.icon
          },
          newBelt: {
            name: newBeltConfig.name,
            displayName: newBeltConfig.label,
            level: BELT_CONFIG.findIndex(b => b.name === newBeltConfig.name) + 1,
            color: newBeltConfig.color,
            icon: newBeltConfig.icon
          }
        });
        setShowLevelUpModal(true);
      }
    }
    previousBeltRef.current = currentBelt;
  }, [currentBelt]);
  const nextThreshold = getNextBeltThreshold(totalPoints);
  const currentBeltIndex = BELT_CONFIG.findIndex(b => b.name === currentBelt);
  const currentBeltConfig = BELT_CONFIG[currentBeltIndex];
  const nextBeltConfig = currentBeltIndex < BELT_CONFIG.length - 1 ? BELT_CONFIG[currentBeltIndex + 1] : null;

  // Calcular progresso
  const currentBeltMin = currentBeltConfig?.minPoints || 0;
  const progressPercent = currentBelt === 'black' 
    ? 100 
    : Math.min(100, ((totalPoints - currentBeltMin) / (nextThreshold - currentBeltMin)) * 100);
  const pointsToNext = Math.max(0, nextThreshold - totalPoints);

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium text-lg">Carregando sua evolução...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Minha Evolução</h1>
          <p className="text-gray-500 mt-2">Acompanhe seu progresso no dojo</p>
        </div>

        {/* Card de Faixa Atual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
        <Card 
          className="border-2 shadow-xl overflow-hidden"
          style={{
            borderColor: `${BELT_COLORS[currentBelt].primary}44`,
            background: `linear-gradient(135deg, ${BELT_COLORS[currentBelt].primary}08 0%, transparent 100%)`
          }}
        >
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Faixa 3D */}
              <div className="flex-shrink-0">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-4 text-center font-semibold">
                    FAIXA ATUAL
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    {currentBeltConfig?.label}
                  </h2>
                  <Belt3DRealistic
                    color={currentBelt}
                    size="xl"
                    animated={true}
                    interactive={true}
                    showLabel={false}
                  />
                </div>
              </div>

              {/* Informações de progresso */}
              <div className="flex-1 space-y-6 w-full">
                {/* Tech Coins */}
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <div className="flex items-center gap-2 bg-blue-50 px-5 py-3 rounded-full border border-blue-200">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-blue-600 text-xl">{totalPoints}</span>
                    <span className="text-blue-500">Tech Coins</span>
                  </div>
                </div>

                {/* Barra de Progresso Animada */}
                {currentBelt !== 'black' && nextBeltConfig && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="flex items-center gap-2 text-gray-500">
                        <TrendingUp className="w-4 h-4" />
                        Próxima faixa: {nextBeltConfig.label}
                      </span>
                    </div>
                    <AnimatedProgressBar
                      currentPoints={totalPoints}
                      minPoints={currentBeltMin}
                      maxPoints={nextThreshold}
                      currentColor={BELT_COLORS[currentBelt].primary}
                      nextColor={BELT_COLORS[nextBeltConfig.name as BeltColor].primary}
                      height={20}
                      showPercentage={true}
                    />
                  </motion.div>
                )}

                {currentBelt === 'black' && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 rounded-full border border-yellow-400/30">
                      <Trophy className="w-5 h-5 text-yellow-600" />
                      <span className="font-bold text-yellow-700">Mestre - Nível Máximo Alcançado!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Ranking da Turma */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Ranking da Turma
            </CardTitle>
            <p className="text-sm text-gray-500">Sua posição entre os colegas</p>
          </CardHeader>
          <CardContent>
            {/* Posição do aluno */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-blue-600">#{stats?.rank || '-'}</span>
                  <div>
                    <p className="font-semibold text-gray-900">Sua posição</p>
                    <p className="text-sm text-gray-500">{totalPoints} Tech Coins</p>
                  </div>
                </div>
                <Belt3DRealistic
                  color={currentBelt}
                  size="sm"
                  animated={false}
                  interactive={false}
                  showLabel={false}
                />
              </div>
            </div>

            {/* Top 3 */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-500">Top 3</p>
              {[1, 2, 3].map((position) => (
                <div 
                  key={position}
                  className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      position === 1 && 'bg-yellow-100 text-yellow-700',
                      position === 2 && 'bg-gray-100 text-gray-600',
                      position === 3 && 'bg-orange-100 text-orange-700'
                    )}>
                      {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Aluno {position}</p>
                      <p className="text-xs text-gray-500">{500 - (position - 1) * 100} Tech Coins • Faixa {position === 1 ? 'Verde' : 'Amarela'}</p>
                    </div>
                  </div>
                  <Belt3DRealistic
                    color={position === 1 ? 'green' : 'yellow'}
                    size="sm"
                    animated={false}
                    interactive={false}
                    showLabel={false}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Jornada das Faixas */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Jornada das Faixas
            </CardTitle>
            <p className="text-sm text-gray-500">Seu caminho até a faixa preta</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {BELT_CONFIG.map((belt, index) => {
                const isUnlocked = totalPoints >= belt.minPoints;
                const isCurrent = belt.name === currentBelt;

                return (
                  <div
                    key={belt.name}
                    className={cn(
                      'relative flex flex-col items-center p-3 rounded-xl transition-all duration-300',
                      isUnlocked && 'cursor-pointer hover:scale-105',
                      isCurrent && 'ring-2 ring-offset-2',
                      !isUnlocked && 'opacity-40'
                    )}
                    style={{
                      backgroundColor: isUnlocked ? `${belt.color}15` : 'transparent',
                      ...(isCurrent && { boxShadow: `0 0 0 2px ${belt.color}` })
                    }}
                    onClick={() => isUnlocked && setSelectedBelt(belt.name)}
                  >
                    {/* Indicador de atual */}
                    {isCurrent && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                        <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                      </div>
                    )}

                    {/* Faixa mini */}
                    <div 
                      className={cn(
                        'w-12 h-4 rounded-full mb-2 shadow-sm',
                        !isUnlocked && 'grayscale'
                      )}
                      style={{
                        background: `linear-gradient(135deg, ${belt.color}dd 0%, ${belt.color} 100%)`,
                        border: belt.name === 'white' ? '1px solid #E5E7EB' : 'none'
                      }}
                    />

                    {/* Cadeado para faixas bloqueadas */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                    )}

                    {/* Pontos necessários */}
                    <span className="text-xs text-gray-500 mt-1">
                      {belt.minPoints}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Estatísticas Detalhadas */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-700">
                {stats?.totalExercisesCompleted || 0}
              </div>
              <div className="text-sm text-blue-600 mt-1">Exercícios Completos</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-700">
                {stats?.totalPerfectScores || 0}
              </div>
              <div className="text-sm text-green-600 mt-1">100% Acertos</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-700">
                {stats?.streakDays || 0}
              </div>
              <div className="text-sm text-orange-600 mt-1">Dias Seguidos</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-700">
                {((stats?.totalPerfectScores || 0) / Math.max(1, stats?.totalExercisesCompleted || 1) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-purple-600 mt-1">Precisão Média</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modal de Level Up */}
      {showLevelUpModal && levelUpData && (
        <LevelUpModal
          isOpen={showLevelUpModal}
          onClose={() => setShowLevelUpModal(false)}
          oldBelt={levelUpData.oldBelt}
          newBelt={levelUpData.newBelt}
          totalPoints={totalPoints}
        />
      )}
    </StudentLayout>
  );
}
