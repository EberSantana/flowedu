import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Calendar, TrendingUp, Award } from "lucide-react";
import StudentLayout from '../components/StudentLayout';
import { KarateAvatar, type BeltColor } from "@/components/KarateAvatar";

// Configuração das faixas com labels em português
const BELT_CONFIG: Record<BeltColor, { label: string; color: string; pointsRequired: number }> = {
  white: { label: 'Branca', color: '#E5E7EB', pointsRequired: 0 },
  yellow: { label: 'Amarela', color: '#FCD34D', pointsRequired: 200 },
  orange: { label: 'Laranja', color: '#FB923C', pointsRequired: 400 },
  green: { label: 'Verde', color: '#4ADE80', pointsRequired: 600 },
  blue: { label: 'Azul', color: '#60A5FA', pointsRequired: 900 },
  purple: { label: 'Roxa', color: '#A78BFA', pointsRequired: 1200 },
  brown: { label: 'Marrom', color: '#92400E', pointsRequired: 1600 },
  black: { label: 'Preta', color: '#1F2937', pointsRequired: 2000 },
};

export default function StudentBeltHistory() {
  const { data: history, isLoading } = trpc.gamification.getBeltHistory.useQuery();
  const { data: stats } = trpc.gamification.getStudentStats.useQuery();

  const currentBelt = (stats?.currentBelt as BeltColor) || 'white';
  const totalPoints = stats?.totalPoints || 0;

  // Formatar data em português
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Histórico de Evolução
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Acompanhe sua jornada e conquistas de faixas
              </p>
            </div>
          </div>
        </div>

        {/* Status Atual */}
        <Card className="mb-8 border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <Award className="w-7 h-7 text-amber-600" />
              Status Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <KarateAvatar belt={currentBelt} size="xl" showLabel={false} />
              <div className="flex-1">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  Faixa {BELT_CONFIG[currentBelt].label}
                </div>
                <div className="text-lg text-gray-600 mb-4">
                  {totalPoints} pontos acumulados
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <TrendingUp className="w-4 h-4" />
                  {history?.length || 0} faixas conquistadas até agora
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Linha do Tempo */}
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <Calendar className="w-7 h-7 text-blue-600" />
              Linha do Tempo de Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando histórico...</p>
              </div>
            ) : history && history.length > 0 ? (
              <div className="space-y-6">
                {history.map((entry, index) => {
                  const belt = entry.belt as BeltColor;
                  const beltInfo = BELT_CONFIG[belt];
                  const isLatest = index === history.length - 1;

                  return (
                    <div
                      key={entry.id}
                      className={`relative pl-12 pb-6 ${
                        index !== history.length - 1 ? 'border-l-4 border-gray-300' : ''
                      }`}
                    >
                      {/* Marcador da linha do tempo */}
                      <div
                        className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                          isLatest
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 ring-4 ring-amber-200'
                            : 'bg-white border-4'
                        }`}
                        style={{
                          borderColor: isLatest ? undefined : beltInfo.color,
                        }}
                      >
                        {isLatest && <Trophy className="w-4 h-4 text-white" />}
                      </div>

                      {/* Conteúdo */}
                      <div
                        className={`ml-4 p-5 rounded-xl border-2 transition-all duration-300 ${
                          isLatest
                            ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-md'
                            : 'bg-white border-gray-200 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-3">
                          <KarateAvatar belt={belt} size="md" showLabel={false} />
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900">
                              Faixa {beltInfo.label}
                              {isLatest && (
                                <span className="ml-3 text-sm font-semibold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                                  Atual
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(entry.achievedAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Trophy className="w-4 h-4" />
                                {entry.pointsAtAchievement} pontos
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mensagem de conquista */}
                        <p className="text-gray-700 text-sm">
                          {index === 0
                            ? '🎯 Início da jornada! Primeira faixa conquistada.'
                            : index === history.length - 1
                            ? '🎉 Parabéns! Esta é sua conquista mais recente. Continue assim!'
                            : `✨ Evolução conquistada com ${entry.pointsAtAchievement} pontos.`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg mb-2">Nenhuma faixa conquistada ainda</p>
                <p className="text-gray-500 text-sm">
                  Complete exercícios e atividades para começar sua jornada!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximas Metas */}
        {currentBelt !== 'black' && (
          <Card className="mt-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <TrendingUp className="w-7 h-7 text-blue-600" />
                Próxima Meta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(BELT_CONFIG)
                  .filter(([_, info]) => info.pointsRequired > totalPoints)
                  .slice(0, 3)
                  .map(([beltKey, info]) => {
                    const pointsNeeded = info.pointsRequired - totalPoints;
                    const progress = (totalPoints / info.pointsRequired) * 100;

                    return (
                      <div key={beltKey} className="p-4 bg-white rounded-lg border-2 border-gray-200">
                        <div className="flex items-center gap-4 mb-3">
                          <KarateAvatar belt={beltKey as BeltColor} size="sm" showLabel={false} />
                          <div className="flex-1">
                            <div className="font-bold text-gray-900">Faixa {info.label}</div>
                            <div className="text-sm text-gray-600">
                              Faltam {pointsNeeded} pontos ({info.pointsRequired} pontos necessários)
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem de Faixa Preta */}
        {currentBelt === 'black' && (
          <Card className="mt-8 border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-white shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                🥋 Mestre Faixa Preta!
              </h3>
              <p className="text-lg text-gray-700 mb-2">
                Você alcançou o nível máximo! Parabéns pela dedicação e esforço.
              </p>
              <p className="text-gray-600">
                Continue praticando e ajudando outros alunos em sua jornada!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}
