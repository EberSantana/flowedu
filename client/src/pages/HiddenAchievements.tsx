import { trpc } from "@/lib/trpc";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, Trophy } from "lucide-react";

export default function HiddenAchievements() {
  const { data: myAchievements, isLoading: myLoading } = trpc.hiddenAchievements.getMyAchievements.useQuery();
  const { data: allAchievements, isLoading: allLoading } = trpc.hiddenAchievements.getAll.useQuery();

  if (myLoading || allLoading) {
    return (
      <StudentLayout>
        <div className="container mx-auto py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const unlockedIds = new Set(myAchievements?.map((a: any) => a.id) || []);
  const unlockedCount = myAchievements?.length || 0;
  const totalCount = allAchievements?.length || 0;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <StudentLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              🎁 Conquistas Ocultas
            </h1>
            <p className="text-gray-600 mt-1">
              Descubra segredos e ganhe recompensas especiais
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Progresso</p>
            <p className="text-3xl font-bold text-purple-600">
              {unlockedCount}/{totalCount}
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Desbloqueadas</p>
                  <p className="text-2xl font-bold text-purple-600">{unlockedCount}</p>
                </div>
                <Trophy className="h-10 w-10 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gray-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bloqueadas</p>
                  <p className="text-2xl font-bold text-gray-600">{totalCount - unlockedCount}</p>
                </div>
                <Lock className="h-10 w-10 text-gray-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tech Coins Ganhos</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {myAchievements?.reduce((sum: number, a: any) => sum + (a.rewardCoins || 0), 0) || 0}
                  </p>
                </div>
                <Sparkles className="h-10 w-10 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Galeria de Conquistas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allAchievements?.map((achievement: any) => {
            const isUnlocked = unlockedIds.has(achievement.id);
            const myAchievement = myAchievements?.find((a: any) => a.id === achievement.id);

            return (
              <Card
                key={achievement.id}
                className={`relative overflow-hidden transition-all duration-300 ${
                  isUnlocked
                    ? `${getRarityColor(achievement.rarity)} border-2 shadow-lg hover:shadow-xl`
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                {/* Badge de Raridade */}
                <div className="absolute top-3 right-3">
                  <Badge className={`${getRarityBadgeColor(achievement.rarity)} text-white text-xs`}>
                    {achievement.rarity === 'common' && 'Comum'}
                    {achievement.rarity === 'rare' && 'Rara'}
                    {achievement.rarity === 'epic' && 'Épica'}
                    {achievement.rarity === 'legendary' && 'Lendária'}
                  </Badge>
                </div>

                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className={`text-4xl ${isUnlocked ? '' : 'grayscale opacity-30'}`}>
                      {isUnlocked ? achievement.icon : '🔒'}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {isUnlocked ? achievement.name : '???'}
                      </CardTitle>
                      {isUnlocked && myAchievement && (
                        <p className="text-xs text-gray-500 mt-1">
                          Desbloqueada em {new Date(myAchievement.unlockedAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-gray-700 mb-3">
                    {isUnlocked ? achievement.description : 'Conquista oculta. Continue explorando para descobrir!'}
                  </p>

                  {isUnlocked && (
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-xs text-gray-600">Recompensa</span>
                      <span className="text-sm font-bold text-yellow-600">
                        +{achievement.rewardCoins} Tech Coins
                      </span>
                    </div>
                  )}

                  {!isUnlocked && (
                    <div className="flex items-center justify-center pt-3 border-t">
                      <Lock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-xs text-gray-500">Bloqueada</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Dica */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-purple-900 mb-2">💡 Dica</h3>
                <p className="text-sm text-purple-800">
                  As conquistas ocultas são desbloqueadas automaticamente quando você realiza ações especiais no sistema.
                  Explore, pratique e seja criativo para descobrir todos os segredos!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
