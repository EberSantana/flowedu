import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { HD2D_CHARACTERS } from "../../../shared/hd2d-characters";

interface UnlockData {
  characterId: number;
  characterName: string;
}

/**
 * Hook para detectar quando um aluno desbloqueia um novo personagem HD-2D
 * Monitora os pontos do aluno e desbloqueia automaticamente personagens elegíveis
 */
export function useHD2DUnlockDetection() {
  const [pendingUnlock, setPendingUnlock] = useState<UnlockData | null>(null);
  const [checkedCharacters, setCheckedCharacters] = useState<Set<number>>(new Set());

  const { data: avatarData } = trpc.students.getHD2DCharacter.useQuery();
  const { data: gamificationData } = trpc.gamification.getStudentStats.useQuery();
  const unlockMutation = trpc.students.unlockHD2DCharacter.useMutation();

  useEffect(() => {
    if (!avatarData || !gamificationData) return;

    const unlockedCharacters = avatarData.unlockedCharacters || [1];
    const totalPoints = gamificationData.totalPoints || 0;

    // Verificar cada personagem que ainda não foi desbloqueado
    for (const character of HD2D_CHARACTERS) {
      // Pular se já está desbloqueado
      if (unlockedCharacters.includes(character.id)) continue;

      // Pular se já foi verificado nesta sessão
      if (checkedCharacters.has(character.id)) continue;

      // Verificar se o aluno tem pontos suficientes
      if (totalPoints >= character.unlockPoints) {
        // Marcar como verificado
        setCheckedCharacters((prev) => new Set(prev).add(character.id));

        // Desbloquear automaticamente
        unlockMutation.mutate(
          { characterId: character.id },
          {
            onSuccess: () => {
              // Mostrar notificação
              setPendingUnlock({
                characterId: character.id,
                characterName: character.name,
              });
            },
            onError: (error) => {
              console.error("Erro ao desbloquear personagem:", error);
            },
          }
        );

        // Desbloquear apenas um por vez
        break;
      }
    }
  }, [avatarData, gamificationData, checkedCharacters, unlockMutation]);

  const clearUnlock = () => {
    setPendingUnlock(null);
  };

  return {
    pendingUnlock,
    clearUnlock,
  };
}
