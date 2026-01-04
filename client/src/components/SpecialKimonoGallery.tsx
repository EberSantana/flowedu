import React from 'react';
import { Lock, Sparkles, Trophy, Star, Crown, Zap } from 'lucide-react';
import { KarateAvatar, BeltColor, SkinTone, HairStyle } from './KarateAvatar';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

export type SpecialKimono = 
  | 'none'
  | 'golden'
  | 'silver'
  | 'patterned_dragon'
  | 'patterned_tiger'
  | 'patterned_sakura';

interface KimonoInfo {
  id: SpecialKimono;
  name: string;
  description: string;
  requiredPoints: number;
  requiredBelt: BeltColor;
  icon: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockCondition: string;
}

const KIMONO_CATALOG: KimonoInfo[] = [
  {
    id: 'golden',
    name: 'Kimono Dourado',
    description: 'Um kimono lendário que brilha com o poder dos mestres',
    requiredPoints: 10000,
    requiredBelt: 'black',
    icon: <Crown className="w-6 h-6 text-yellow-400" />,
    rarity: 'legendary',
    unlockCondition: 'Alcançar faixa preta + 10.000 pontos',
  },
  {
    id: 'silver',
    name: 'Kimono Prateado',
    description: 'Forjado com a determinação dos guerreiros',
    requiredPoints: 5000,
    requiredBelt: 'brown',
    icon: <Star className="w-6 h-6 text-gray-400" />,
    rarity: 'epic',
    unlockCondition: 'Alcançar faixa marrom + 5.000 pontos',
  },
  {
    id: 'patterned_dragon',
    name: 'Kimono do Dragão',
    description: 'Estampado com o espírito do dragão oriental',
    requiredPoints: 3000,
    requiredBelt: 'purple',
    icon: <Zap className="w-6 h-6 text-purple-500" />,
    rarity: 'rare',
    unlockCondition: 'Alcançar faixa roxa + 3.000 pontos',
  },
  {
    id: 'patterned_tiger',
    name: 'Kimono do Tigre',
    description: 'Com a força e agilidade do tigre',
    requiredPoints: 2000,
    requiredBelt: 'blue',
    icon: <Trophy className="w-6 h-6 text-orange-500" />,
    rarity: 'rare',
    unlockCondition: 'Alcançar faixa azul + 2.000 pontos',
  },
  {
    id: 'patterned_sakura',
    name: 'Kimono Sakura',
    description: 'Decorado com as delicadas flores de cerejeira',
    requiredPoints: 1000,
    requiredBelt: 'green',
    icon: <Sparkles className="w-6 h-6 text-pink-400" />,
    rarity: 'rare',
    unlockCondition: 'Alcançar faixa verde + 1.000 pontos',
  },
];

const RARITY_COLORS = {
  common: 'bg-gray-100 border-gray-300 text-gray-700',
  rare: 'bg-blue-50 border-blue-300 text-blue-700',
  epic: 'bg-purple-50 border-purple-300 text-purple-700',
  legendary: 'bg-yellow-50 border-yellow-400 text-yellow-700',
};

const RARITY_LABELS = {
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};

interface SpecialKimonoGalleryProps {
  currentPoints: number;
  currentBelt: BeltColor;
  equippedKimono: SpecialKimono;
  unlockedKimonos: SpecialKimono[];
  onEquip: (kimono: SpecialKimono) => void;
  avatarConfig?: {
    gender?: 'male' | 'female';
    skinTone?: SkinTone;
    hairStyle?: HairStyle;
    hairColor?: string;
  };
}

export const SpecialKimonoGallery: React.FC<SpecialKimonoGalleryProps> = ({
  currentPoints,
  currentBelt,
  equippedKimono,
  unlockedKimonos,
  onEquip,
  avatarConfig = {},
}) => {
  const beltOrder: BeltColor[] = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black'];
  const currentBeltIndex = beltOrder.indexOf(currentBelt);

  const isUnlocked = (kimono: KimonoInfo): boolean => {
    const requiredBeltIndex = beltOrder.indexOf(kimono.requiredBelt);
    const hasBelt = currentBeltIndex >= requiredBeltIndex;
    const hasPoints = currentPoints >= kimono.requiredPoints;
    return hasBelt && hasPoints;
  };

  const isOwned = (kimonoId: SpecialKimono): boolean => {
    return unlockedKimonos.includes(kimonoId);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Galeria de Kimonos Especiais</h2>
        <p className="text-gray-600">
          Desbloqueie kimonos exclusivos através de conquistas extraordinárias
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {KIMONO_CATALOG.map((kimono) => {
          const unlocked = isUnlocked(kimono);
          const owned = isOwned(kimono.id);
          const equipped = equippedKimono === kimono.id;

          return (
            <Card
              key={kimono.id}
              className={`p-6 transition-all duration-300 ${
                equipped
                  ? 'ring-4 ring-primary shadow-xl scale-105'
                  : unlocked
                    ? 'hover:shadow-lg hover:scale-102'
                    : 'opacity-60'
              } ${RARITY_COLORS[kimono.rarity]} border-2`}
            >
              {/* Badge de raridade */}
              <div className="flex items-center justify-between mb-4">
                <Badge
                  variant={equipped ? 'default' : 'outline'}
                  className={`${
                    equipped ? 'bg-primary text-white' : ''
                  } font-semibold`}
                >
                  {RARITY_LABELS[kimono.rarity]}
                </Badge>
                {equipped && (
                  <Badge variant="default" className="bg-green-600">
                    Equipado
                  </Badge>
                )}
              </div>

              {/* Preview do avatar */}
              <div className="flex justify-center mb-4 relative">
                {unlocked ? (
                  <div className="relative">
                    <KarateAvatar
                      belt={currentBelt}
                      size="lg"
                      gender={avatarConfig.gender || 'male'}
                      skinTone={avatarConfig.skinTone || 'light'}
                      hairStyle={avatarConfig.hairStyle || 'short'}
                      hairColor={avatarConfig.hairColor || 'black'}
                      kimonoColor={
                        kimono.id === 'golden'
                          ? 'gold'
                          : kimono.id === 'silver'
                            ? 'silver'
                            : 'white'
                      }
                      specialPattern={
                        kimono.id.startsWith('patterned_')
                          ? (kimono.id.replace('patterned_', '') as any)
                          : undefined
                      }
                    />
                    {!owned && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                        <Sparkles className="w-12 h-12 text-yellow-400 animate-pulse" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center bg-gray-200 rounded-lg">
                    <Lock className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Informações */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {kimono.icon}
                  <h3 className="text-xl font-bold">{kimono.name}</h3>
                </div>

                <p className="text-sm text-gray-600">{kimono.description}</p>

                {/* Condições de desbloqueio */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Requisitos:</span>
                  </div>
                  <div className="pl-4 space-y-1 text-xs">
                    <div className={currentPoints >= kimono.requiredPoints ? 'text-green-600' : 'text-gray-500'}>
                      • {kimono.requiredPoints.toLocaleString()} pontos
                      {currentPoints >= kimono.requiredPoints && ' ✓'}
                    </div>
                    <div
                      className={
                        beltOrder.indexOf(currentBelt) >= beltOrder.indexOf(kimono.requiredBelt)
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }
                    >
                      • Faixa {kimono.requiredBelt === 'white' ? 'Branca' : kimono.requiredBelt === 'yellow' ? 'Amarela' : kimono.requiredBelt === 'orange' ? 'Laranja' : kimono.requiredBelt === 'green' ? 'Verde' : kimono.requiredBelt === 'blue' ? 'Azul' : kimono.requiredBelt === 'purple' ? 'Roxa' : kimono.requiredBelt === 'brown' ? 'Marrom' : 'Preta'}
                      {beltOrder.indexOf(currentBelt) >= beltOrder.indexOf(kimono.requiredBelt) && ' ✓'}
                    </div>
                  </div>
                </div>

                {/* Botão de ação */}
                <div className="pt-2">
                  {!unlocked ? (
                    <Button disabled className="w-full" variant="outline">
                      <Lock className="w-4 h-4 mr-2" />
                      Bloqueado
                    </Button>
                  ) : !owned ? (
                    <Button
                      onClick={() => onEquip(kimono.id)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Desbloquear
                    </Button>
                  ) : equipped ? (
                    <Button disabled className="w-full" variant="default">
                      Equipado
                    </Button>
                  ) : (
                    <Button onClick={() => onEquip(kimono.id)} className="w-full" variant="outline">
                      Equipar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
