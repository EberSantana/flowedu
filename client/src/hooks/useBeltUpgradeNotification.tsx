import { useState, useEffect } from 'react';
import { BeltColor } from '@/components/KarateAvatar';

interface BeltUpgradeData {
  oldBelt: BeltColor;
  newBelt: BeltColor;
  totalPoints: number;
}

const STORAGE_KEY = 'last_known_belt';

export function useBeltUpgradeNotification(currentBelt: BeltColor, totalPoints: number) {
  const [upgradeData, setUpgradeData] = useState<BeltUpgradeData | null>(null);

  useEffect(() => {
    // Recuperar última faixa conhecida do localStorage
    const lastKnownBelt = localStorage.getItem(STORAGE_KEY) as BeltColor | null;

    // Se houver uma faixa anterior e for diferente da atual, mostrar notificação
    if (lastKnownBelt && lastKnownBelt !== currentBelt) {
      setUpgradeData({
        oldBelt: lastKnownBelt,
        newBelt: currentBelt,
        totalPoints,
      });
    }

    // Atualizar faixa no localStorage
    localStorage.setItem(STORAGE_KEY, currentBelt);
  }, [currentBelt, totalPoints]);

  const clearNotification = () => {
    setUpgradeData(null);
  };

  return {
    upgradeData,
    clearNotification,
  };
}
