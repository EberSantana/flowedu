import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { HD2DAvatarDisplay, HD2DAvatarGallery } from "@/components/HD2DAvatarDisplay";
import { HD2D_CHARACTERS, getCharacterById, getNextCharacterToUnlock } from "../../../../shared/hd2d-characters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Lock, Trophy, Star, Zap } from "lucide-react";
import { toast } from "sonner";

/**
 * Página de customização de avatar HD-2D para alunos
 * Permite selecionar personagens desbloqueados e ver progresso
 */
export default function CustomizeHD2DAvatar() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);

  // Buscar dados do avatar
  const { data: avatarData, isLoading: loadingAvatar } = trpc.students.getHD2DCharacter.useQuery();
  const { data: gamificationData, isLoading: loadingGamification } = trpc.gamification.getStudentStats.useQuery();

  // Mutation para trocar personagem
  const changeCharacterMutation = trpc.students.changeHD2DCharacter.useMutation({
    onSuccess: () => {
      toast.success("Personagem alterado com sucesso!", {
        description: "Seu novo avatar está ativo!",
        icon: <Sparkles className="w-4 h-4" />,
      });
    },
    onError: (error) => {
      toast.error("Erro ao trocar personagem", {
        description: error.message,
      });
    },
  });

  if (loadingAvatar || loadingGamification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Carregando avatares...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentCharacterId = avatarData?.characterId || 1;
  const unlockedCharacters = avatarData?.unlockedCharacters || [1];
  const totalPoints = gamificationData?.totalPoints || 0;
  const currentCharacter = getCharacterById(currentCharacterId);
  const nextCharacter = getNextCharacterToUnlock(totalPoints);

  const handleSelectCharacter = (characterId: number) => {
    if (characterId === currentCharacterId) {
      toast.info("Este personagem já está ativo!");
      return;
    }
    setSelectedCharacterId(characterId);
  };

  const handleConfirmChange = () => {
    if (!selectedCharacterId) return;
    changeCharacterMutation.mutate({ characterId: selectedCharacterId });
    setSelectedCharacterId(null);
  };

  const handleCancelChange = () => {
    setSelectedCharacterId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Galeria de Personagens HD-2D
          </h1>
          <p className="text-muted-foreground text-lg">
            Escolha seu avatar e desbloqueie novos personagens com seus pontos!
          </p>
        </div>

        {/* Personagem Atual */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Personagem Ativo
            </CardTitle>
            <CardDescription>Este é o seu avatar atual no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <HD2DAvatarDisplay
                  characterId={currentCharacterId}
                  size="xl"
                  showName
                  showTitle
                  showAura
                  showParticles
                  animate
                />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{currentCharacter?.name}</h3>
                  <p className="text-muted-foreground italic mb-4">{currentCharacter?.title}</p>
                  <p className="text-sm leading-relaxed">{currentCharacter?.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Personalidade</p>
                    <p className="font-semibold">{currentCharacter?.personality}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Habilidade Especial</p>
                    <p className="font-semibold">{currentCharacter?.specialAbility}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progresso de Desbloqueio */}
        {nextCharacter && (
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-600" />
                Próximo Personagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <HD2DAvatarDisplay
                      characterId={nextCharacter.id}
                      size="md"
                      showAura={false}
                      showParticles={false}
                      animate={false}
                    />
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <Lock className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="text-lg font-bold">{nextCharacter.name}</h4>
                    <p className="text-sm text-muted-foreground">{nextCharacter.title}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-semibold">
                        {totalPoints} / {nextCharacter.unlockPoints} pontos
                      </span>
                    </div>
                    <Progress
                      value={(totalPoints / nextCharacter.unlockPoints) * 100}
                      className="h-2"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Faltam {nextCharacter.unlockPoints - totalPoints} pontos para desbloquear!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Galeria de Personagens */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Todos os Personagens
            </CardTitle>
            <CardDescription>
              Desbloqueie personagens ganhando pontos em exercícios e atividades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HD2DAvatarGallery
              unlockedCharacters={unlockedCharacters}
              currentCharacterId={currentCharacterId}
              totalPoints={totalPoints}
              onSelectCharacter={handleSelectCharacter}
            />
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                  <p className="text-sm text-muted-foreground">Pontos Totais</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unlockedCharacters.length}</p>
                  <p className="text-sm text-muted-foreground">Personagens Desbloqueados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/10 border-pink-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{HD2D_CHARACTERS.length - unlockedCharacters.length}</p>
                  <p className="text-sm text-muted-foreground">A Desbloquear</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {selectedCharacterId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full animate-fade-in-up">
            <CardHeader>
              <CardTitle>Confirmar Troca de Personagem</CardTitle>
              <CardDescription>
                Deseja ativar este personagem como seu avatar?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <HD2DAvatarDisplay
                  characterId={selectedCharacterId}
                  size="lg"
                  showName
                  showTitle
                  showAura
                  showParticles
                  animate
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancelChange}
                  disabled={changeCharacterMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirmChange}
                  disabled={changeCharacterMutation.isPending}
                >
                  {changeCharacterMutation.isPending ? "Ativando..." : "Confirmar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
