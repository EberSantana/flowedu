import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Trophy, Medal, TrendingUp, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  getBeltFromPoints, 
  getNextBeltThreshold,
  BELT_CONFIG,
  type BeltColor 
} from "@/components/MinimalKarateAvatar";
import { BeltDisplay } from "@/components/KarateBelt3D";

export default function StudentGamificationSimple() {
  const { data: stats, isLoading: statsLoading } = trpc.gamification.getStudentStats.useQuery();
  const { data: ranking, isLoading: rankingLoading } = trpc.gamification.getClassRanking.useQuery({ limit: 10 });

  if (statsLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const totalPoints = stats?.totalPoints || 0;
  const currentBelt = getBeltFromPoints(totalPoints);
  const nextThreshold = getNextBeltThreshold(totalPoints);
  
  // Calcular progresso para próxima faixa
  const currentBeltConfig = BELT_CONFIG.find(b => b.name === currentBelt);
  const currentBeltMin = currentBeltConfig?.minPoints || 0;
  const progressPercent = currentBelt === 'black' 
    ? 100 
    : Math.min(100, ((totalPoints - currentBeltMin) / (nextThreshold - currentBeltMin)) * 100);
  const pointsToNext = Math.max(0, nextThreshold - totalPoints);

  // Encontrar posição do aluno no ranking
  const myPosition = ranking?.findIndex(r => r.studentId === stats?.studentId) ?? -1;
  const myRank = myPosition !== -1 ? myPosition + 1 : null;

  // Top 3 alunos
  const topThree = ranking?.slice(0, 3) || [];

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
        {/* Header simples */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Minha Evolução</h1>
          <p className="text-gray-500 mt-1">Acompanhe seu progresso no dojo</p>
        </div>

        {/* Card Principal - Avatar + Faixa + Pontos */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Faixa 3D */}
              <div className="flex-shrink-0">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                  <BeltDisplay color={currentBelt} label="" size="xl" showLabel={false} />
                </div>
              </div>

              {/* Informações de Progresso */}
              <div className="flex-1 w-full space-y-6 text-center md:text-left">
                {/* Faixa Atual */}
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide font-medium mb-1">Faixa Atual</p>
                  <h2 className="text-4xl font-bold text-gray-900">
                    {BELT_CONFIG.find(b => b.name === currentBelt)?.label || 'Branca'}
                  </h2>
                </div>

                {/* Pontos */}
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-600">{totalPoints}</span>
                    <span className="text-sm text-blue-500">Tech Coins</span>
                  </div>
                </div>

                {/* Progresso para Próxima Faixa */}
                {currentBelt !== 'black' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Próxima faixa
                      </span>
                      <span className="font-semibold text-gray-900">
                        {totalPoints} / {nextThreshold}
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-3" />
                    <p className="text-sm text-gray-500">
                      Faltam <span className="font-semibold text-gray-700">{pointsToNext}</span> Tech Coins para a próxima faixa
                    </p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 font-semibold flex items-center justify-center md:justify-start gap-2">
                      <Trophy className="w-5 h-5" />
                      Parabéns! Você alcançou a Faixa Preta!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Ranking Simplificado */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Medal className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Ranking da Turma</h3>
                <p className="text-sm text-gray-500">Sua posição entre os colegas</p>
              </div>
            </div>

            {rankingLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sua Posição */}
                {myRank && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold text-purple-600">#{myRank}</div>
                        <div>
                          <p className="font-semibold text-gray-900">Sua posição</p>
                          <p className="text-sm text-gray-500">{totalPoints} Tech Coins</p>
                        </div>
                      </div>
                      <BeltDisplay color={currentBelt} label="" size="sm" showLabel={false} />
                    </div>
                  </div>
                )}

                {/* Top 3 */}
                {topThree.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Nenhum aluno no ranking ainda.</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-600 mb-3">Top 3</p>
                    {topThree.map((student, index) => {
                      const medalEmojis = ['🥇', '🥈', '🥉'];
                      const bgColors = ['bg-yellow-50 border-yellow-200', 'bg-gray-50 border-gray-200', 'bg-orange-50 border-orange-200'];
                      const studentBelt = getBeltFromPoints(student.totalPoints || 0);
                      const isMe = myRank === index + 1;

                      return (
                        <div 
                          key={student.studentId}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                            isMe ? 'bg-blue-50 border-blue-300' : bgColors[index]
                          }`}
                        >
                          <div className="text-2xl">{medalEmojis[index]}</div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {student.studentName}
                              {isMe && <Badge variant="secondary" className="ml-2 text-xs">Você</Badge>}
                            </p>
                            <p className="text-sm text-gray-500">
                              {student.totalPoints} Tech Coins • Faixa {BELT_CONFIG.find(b => b.name === studentBelt)?.label}
                            </p>
                          </div>
                          <BeltDisplay color={studentBelt} label="" size="sm" showLabel={false} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Jornada das Faixas */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Jornada das Faixas</h3>
                <p className="text-sm text-gray-500">Seu caminho até a faixa preta</p>
              </div>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {BELT_CONFIG.map((belt, index) => {
                const isCurrentOrPast = BELT_CONFIG.findIndex(b => b.name === currentBelt) >= index;
                const isCurrent = belt.name === currentBelt;

                return (
                  <div 
                    key={belt.name}
                    className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                      isCurrent 
                        ? 'bg-blue-100 border-2 border-blue-400 scale-105' 
                        : isCurrentOrPast 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-gray-50 border border-gray-200 opacity-50'
                    }`}
                  >
                    <div 
                      className="w-6 h-6 rounded-full border-2 mb-2"
                      style={{ 
                        backgroundColor: belt.color,
                        borderColor: belt.name === 'white' ? '#D1D5DB' : belt.color
                      }}
                    />
                    <span className={`text-xs font-medium ${isCurrent ? 'text-blue-700' : 'text-gray-600'}`}>
                      {belt.label}
                    </span>
                    <span className="text-xs text-gray-400">{belt.minPoints}+</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
