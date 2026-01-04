import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { KarateAvatar } from '@/components/KarateAvatar';
import { Lock, Sparkles, Save, ArrowLeft } from 'lucide-react';

// Configuração de opções de customização
const SKIN_TONES = [
  { id: 'light', label: 'Clara', unlockLevel: 0, color: '#FFE0BD' },
  { id: 'medium', label: 'Média', unlockLevel: 0, color: '#F1C27D' },
  { id: 'tan', label: 'Morena', unlockLevel: 0, color: '#C68642' },
  { id: 'dark', label: 'Escura', unlockLevel: 0, color: '#8D5524' },
  { id: 'darker', label: 'Mais Escura', unlockLevel: 0, color: '#5C3317' },
  { id: 'darkest', label: 'Muito Escura', unlockLevel: 0, color: '#3E2723' },
];

const HAIR_STYLES = [
  { id: 'short', label: 'Curto', unlockLevel: 0, icon: '✂️' },
  { id: 'medium', label: 'Médio', unlockLevel: 200, icon: '💇' },
  { id: 'long', label: 'Longo', unlockLevel: 400, icon: '🦱' },
  { id: 'bald', label: 'Careca', unlockLevel: 600, icon: '🧑‍🦲' },
  { id: 'ponytail', label: 'Rabo de Cavalo', unlockLevel: 800, icon: '🎀' },
];

const KIMONO_COLORS = [
  { id: 'white', label: 'Branco', unlockLevel: 0, color: '#FFFFFF' },
  { id: 'blue', label: 'Azul', unlockLevel: 300, color: '#3B82F6' },
  { id: 'red', label: 'Vermelho', unlockLevel: 600, color: '#EF4444' },
  { id: 'black', label: 'Preto', unlockLevel: 1000, color: '#1F2937' },
];

export function CustomizeAvatar() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.gamification.getStudentStats.useQuery();
  const { data: studentData, isLoading: studentLoading } = trpc.studentAvatar.getMyAvatar.useQuery();
  const updateAvatarMutation = trpc.studentAvatar.updateMyAvatar.useMutation();

  const [selectedSkinTone, setSelectedSkinTone] = useState<string>('light');
  const [selectedHairStyle, setSelectedHairStyle] = useState<string>('short');
  const [selectedKimonoColor, setSelectedKimonoColor] = useState<string>('white');
  const [hasChanges, setHasChanges] = useState(false);

  // Carregar preferências atuais
  useEffect(() => {
    if (studentData) {
      setSelectedSkinTone(studentData.avatarSkinTone || 'light');
      setSelectedHairStyle(studentData.avatarHairStyle || 'short');
      setSelectedKimonoColor(studentData.avatarKimonoColor || 'white');
    }
  }, [studentData]);

  const currentPoints = stats?.totalPoints || 0;

  const isUnlocked = (unlockLevel: number) => currentPoints >= unlockLevel;

  const handleSave = async () => {
    try {
      await updateAvatarMutation.mutateAsync({
        avatarSkinTone: selectedSkinTone,
        avatarHairStyle: selectedHairStyle,
        avatarKimonoColor: selectedKimonoColor,
      });
      
      toast.success('Avatar personalizado com sucesso! 🎨', {
        description: 'Suas alterações foram salvas.',
      });
      
      setHasChanges(false);
    } catch (error) {
      toast.error('Erro ao salvar personalização', {
        description: 'Tente novamente mais tarde.',
      });
    }
  };

  const handleChange = (type: 'skin' | 'hair' | 'kimono', value: string) => {
    setHasChanges(true);
    if (type === 'skin') setSelectedSkinTone(value);
    if (type === 'hair') setSelectedHairStyle(value);
    if (type === 'kimono') setSelectedKimonoColor(value);
  };

  if (statsLoading || studentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-8 px-4">
      <div className="container max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/student/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-orange-500" />
            <h1 className="text-4xl font-bold text-gray-900">Personalize seu Avatar</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Customize seu karateca e desbloqueie novas opções conforme evolui! 
            <span className="font-semibold text-orange-600 ml-2">
              {currentPoints} pontos
            </span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Preview do Avatar */}
          <Card className="border-2 border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-100">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                Pré-visualização
              </CardTitle>
              <CardDescription>Veja como seu avatar ficará</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 shadow-inner">
                <KarateAvatar
                  belt={(stats?.currentBelt as any) || 'white'}
                  size="xl"
                  skinTone={selectedSkinTone as any}
                  hairStyle={selectedHairStyle as any}
                  kimonoColor={selectedKimonoColor as any}
                />
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-2">Faixa Atual</p>
                <p className="text-2xl font-bold text-orange-600 capitalize">
                  {stats?.currentBelt === 'white' && '⚪ Branca'}
                  {stats?.currentBelt === 'yellow' && '🟡 Amarela'}
                  {stats?.currentBelt === 'orange' && '🟠 Laranja'}
                  {stats?.currentBelt === 'green' && '🟢 Verde'}
                  {stats?.currentBelt === 'blue' && '🔵 Azul'}
                  {stats?.currentBelt === 'purple' && '🟣 Roxa'}
                  {stats?.currentBelt === 'brown' && '🟤 Marrom'}
                  {stats?.currentBelt === 'black' && '⚫ Preta'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Opções de Customização */}
          <div className="space-y-6">
            {/* Tom de Pele */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="text-lg">Tom de Pele</CardTitle>
                <CardDescription>Escolha o tom que mais combina com você</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {SKIN_TONES.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => handleChange('skin', tone.id)}
                      disabled={!isUnlocked(tone.unlockLevel)}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all
                        ${selectedSkinTone === tone.id 
                          ? 'border-orange-500 bg-orange-50 shadow-md' 
                          : 'border-gray-200 hover:border-orange-300'
                        }
                        ${!isUnlocked(tone.unlockLevel) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div 
                        className="w-full h-12 rounded-md mb-2 border border-gray-300"
                        style={{ backgroundColor: tone.color }}
                      />
                      <p className="text-xs font-medium text-center">{tone.label}</p>
                      {!isUnlocked(tone.unlockLevel) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                          <Lock className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Estilo de Cabelo */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg">Estilo de Cabelo</CardTitle>
                <CardDescription>Desbloqueie novos estilos ganhando pontos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {HAIR_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleChange('hair', style.id)}
                      disabled={!isUnlocked(style.unlockLevel)}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all
                        ${selectedHairStyle === style.id 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-blue-300'
                        }
                        ${!isUnlocked(style.unlockLevel) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="text-3xl mb-2">{style.icon}</div>
                      <p className="text-xs font-medium text-center">{style.label}</p>
                      {!isUnlocked(style.unlockLevel) && (
                        <>
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-lg">
                            <Lock className="h-5 w-5 text-white mb-1" />
                            <span className="text-xs text-white font-bold">{style.unlockLevel} pts</span>
                          </div>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cor do Kimono */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-lg">Cor do Kimono</CardTitle>
                <CardDescription>Cores especiais para karatecas avançados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {KIMONO_COLORS.map((kimono) => (
                    <button
                      key={kimono.id}
                      onClick={() => handleChange('kimono', kimono.id)}
                      disabled={!isUnlocked(kimono.unlockLevel)}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all
                        ${selectedKimonoColor === kimono.id 
                          ? 'border-purple-500 bg-purple-50 shadow-md' 
                          : 'border-gray-200 hover:border-purple-300'
                        }
                        ${!isUnlocked(kimono.unlockLevel) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div 
                        className="w-full h-12 rounded-md mb-2 border border-gray-300"
                        style={{ backgroundColor: kimono.color }}
                      />
                      <p className="text-xs font-medium text-center">{kimono.label}</p>
                      {!isUnlocked(kimono.unlockLevel) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-lg">
                          <Lock className="h-5 w-5 text-white mb-1" />
                          <span className="text-xs text-white font-bold">{kimono.unlockLevel} pts</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Botão Salvar */}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateAvatarMutation.isPending}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            >
              {updateAvatarMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
