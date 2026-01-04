import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { KarateAvatarPro, type BeltColor, type AvatarMood } from '@/components/KarateAvatarPro';
import { 
  Lock, 
  Sparkles, 
  Save, 
  ArrowLeft, 
  Check, 
  Star,
  Zap,
  Trophy,
  Palette,
  User,
  Shirt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StudentLayout from '@/components/StudentLayout';

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
  { id: 'short', label: 'Curto', unlockLevel: 0, icon: '✂️', description: 'Estilo clássico' },
  { id: 'medium', label: 'Médio', unlockLevel: 200, icon: '💇', description: 'Desbloqueie com 200 pts' },
  { id: 'long', label: 'Longo', unlockLevel: 400, icon: '🦱', description: 'Desbloqueie com 400 pts' },
  { id: 'bald', label: 'Careca', unlockLevel: 600, icon: '🧑‍🦲', description: 'Desbloqueie com 600 pts' },
  { id: 'ponytail', label: 'Rabo de Cavalo', unlockLevel: 800, icon: '🎀', description: 'Desbloqueie com 800 pts' },
];

const KIMONO_COLORS = [
  { id: 'white', label: 'Branco', unlockLevel: 0, color: '#FFFFFF', description: 'Tradicional' },
  { id: 'blue', label: 'Azul', unlockLevel: 300, color: '#3B82F6', description: 'Desbloqueie com 300 pts' },
  { id: 'red', label: 'Vermelho', unlockLevel: 600, color: '#EF4444', description: 'Desbloqueie com 600 pts' },
  { id: 'black', label: 'Preto', unlockLevel: 1000, color: '#1F2937', description: 'Desbloqueie com 1000 pts' },
];

// Componente de seleção de opção
interface OptionSelectorProps {
  options: Array<{
    id: string;
    label: string;
    unlockLevel: number;
    color?: string;
    icon?: string;
    description?: string;
  }>;
  selectedId: string;
  currentPoints: number;
  onSelect: (id: string) => void;
  type: 'color' | 'icon';
  accentColor: string;
}

const OptionSelector: React.FC<OptionSelectorProps> = ({
  options,
  selectedId,
  currentPoints,
  onSelect,
  type,
  accentColor,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {options.map((option) => {
        const isUnlocked = currentPoints >= option.unlockLevel;
        const isSelected = selectedId === option.id;

        return (
          <button
            key={option.id}
            onClick={() => isUnlocked && onSelect(option.id)}
            disabled={!isUnlocked}
            className={cn(
              'relative p-4 rounded-xl border-2 transition-all duration-300',
              'hover:shadow-lg hover:-translate-y-0.5',
              isSelected && `border-${accentColor}-500 bg-${accentColor}-50 shadow-md ring-2 ring-${accentColor}-200`,
              !isSelected && isUnlocked && 'border-gray-200 hover:border-gray-300 bg-white',
              !isUnlocked && 'opacity-60 cursor-not-allowed bg-gray-50'
            )}
            style={{
              borderColor: isSelected ? `var(--${accentColor}-500, #3B82F6)` : undefined,
              backgroundColor: isSelected ? `var(--${accentColor}-50, #EFF6FF)` : undefined,
            }}
          >
            {/* Indicador de selecionado */}
            {isSelected && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-in">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Conteúdo */}
            {type === 'color' ? (
              <div 
                className="w-full h-14 rounded-lg mb-3 border-2 border-gray-200 shadow-inner transition-transform hover:scale-105"
                style={{ backgroundColor: option.color }}
              />
            ) : (
              <div className="text-4xl mb-3 transition-transform hover:scale-110">
                {option.icon}
              </div>
            )}

            <p className="text-sm font-semibold text-gray-800">{option.label}</p>
            
            {option.description && (
              <p className="text-xs text-gray-500 mt-1">{option.description}</p>
            )}

            {/* Overlay de bloqueado */}
            {!isUnlocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/40 rounded-xl backdrop-blur-sm">
                <Lock className="w-6 h-6 text-white mb-1" />
                <span className="text-xs text-white font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {option.unlockLevel} pts
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

// Componente de seção de customização
interface CustomizationSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  children: React.ReactNode;
}

const CustomizationSection: React.FC<CustomizationSectionProps> = ({
  title,
  description,
  icon,
  accentColor,
  children,
}) => (
  <Card className={cn(
    'border-2 overflow-hidden transition-all duration-300 hover:shadow-lg',
    `border-l-4 border-l-${accentColor}-500`
  )}>
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          `bg-${accentColor}-100`
        )}>
          {icon}
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export function CustomizeAvatar() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.gamification.getStudentStats.useQuery();
  const { data: studentData, isLoading: studentLoading } = trpc.studentAvatar.getMyAvatar.useQuery();
  const updateAvatarMutation = trpc.studentAvatar.updateMyAvatar.useMutation();

  const [selectedSkinTone, setSelectedSkinTone] = useState<string>('light');
  const [selectedHairStyle, setSelectedHairStyle] = useState<string>('short');
  const [selectedKimonoColor, setSelectedKimonoColor] = useState<string>('white');
  const [hasChanges, setHasChanges] = useState(false);
  const [avatarMood, setAvatarMood] = useState<AvatarMood>('idle');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Carregar preferências atuais
  useEffect(() => {
    if (studentData) {
      setSelectedSkinTone(studentData.avatarSkinTone || 'light');
      setSelectedHairStyle(studentData.avatarHairStyle || 'short');
      setSelectedKimonoColor(studentData.avatarKimonoColor || 'white');
    }
  }, [studentData]);

  const currentPoints = stats?.totalPoints || 0;
  const currentBelt = (stats?.currentBelt as BeltColor) || 'white';

  const handleSave = async () => {
    try {
      await updateAvatarMutation.mutateAsync({
        avatarSkinTone: selectedSkinTone,
        avatarHairStyle: selectedHairStyle,
        avatarKimonoColor: selectedKimonoColor,
      });
      
      // Animação de sucesso
      setAvatarMood('excited');
      setShowSaveSuccess(true);
      
      setTimeout(() => {
        setAvatarMood('happy');
        setTimeout(() => setAvatarMood('idle'), 1500);
      }, 1000);
      
      setTimeout(() => setShowSaveSuccess(false), 3000);
      
      toast.success('Avatar personalizado com sucesso!', {
        description: 'Suas alterações foram salvas.',
        icon: <Sparkles className="w-5 h-5 text-yellow-500" />,
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
    setAvatarMood('happy');
    setTimeout(() => setAvatarMood('idle'), 500);
    
    if (type === 'skin') setSelectedSkinTone(value);
    if (type === 'hair') setSelectedHairStyle(value);
    if (type === 'kimono') setSelectedKimonoColor(value);
  };

  if (statsLoading || studentLoading) {
    return (
      <StudentLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-orange-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium">Carregando customização...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 py-8 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation('/student/dashboard')}
              className="mb-4 hover:bg-orange-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl shadow-lg">
                    <Palette className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                    Personalize seu Avatar
                  </h1>
                </div>
                <p className="text-gray-600 text-lg">
                  Customize seu karateca e desbloqueie novas opções conforme evolui!
                </p>
              </div>
              
              {/* Badge de pontos */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl border border-yellow-300">
                <Zap className="w-5 h-5 text-yellow-600" />
                <span className="font-bold text-yellow-700 text-lg">
                  {currentPoints.toLocaleString()} pontos
                </span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Preview do Avatar - Coluna maior */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-orange-200 shadow-xl sticky top-8 overflow-hidden">
                {/* Fundo decorativo */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50" />
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-200/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-yellow-200/30 rounded-full blur-3xl" />
                
                <CardHeader className="relative bg-gradient-to-r from-orange-100/80 to-yellow-100/80 backdrop-blur-sm">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-orange-500" />
                    Pré-visualização
                  </CardTitle>
                  <CardDescription>Veja como seu avatar ficará</CardDescription>
                </CardHeader>
                
                <CardContent className="relative flex flex-col items-center justify-center py-8">
                  {/* Avatar com efeitos */}
                  <div className="relative">
                    {/* Glow effect */}
                    <div className={cn(
                      'absolute inset-0 rounded-full blur-2xl opacity-40',
                      currentBelt === 'black' && 'bg-gradient-to-r from-yellow-400 to-amber-500',
                      currentBelt === 'purple' && 'bg-purple-400',
                      currentBelt === 'blue' && 'bg-blue-400',
                      currentBelt === 'green' && 'bg-green-400',
                      currentBelt === 'orange' && 'bg-orange-400',
                      currentBelt === 'yellow' && 'bg-yellow-400',
                      currentBelt === 'brown' && 'bg-amber-600',
                      currentBelt === 'white' && 'bg-gray-300',
                    )} />
                    
                    <KarateAvatarPro
                      belt={currentBelt}
                      size="2xl"
                      skinTone={selectedSkinTone as any}
                      hairStyle={selectedHairStyle as any}
                      kimonoColor={selectedKimonoColor as any}
                      mood={avatarMood}
                      animation="idle"
                      interactive
                      showGlow={currentBelt === 'black'}
                      showLabel
                    />
                  </div>
                  
                  {/* Indicador de sucesso */}
                  {showSaveSuccess && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-green-100 border border-green-300 rounded-lg animate-bounce-in">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">Salvo!</span>
                    </div>
                  )}
                  
                  {/* Info da faixa */}
                  <div className="mt-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm text-gray-500 font-medium">Faixa Atual</span>
                    </div>
                    <p className="text-xl font-bold text-gray-800 capitalize">
                      {currentBelt === 'white' && '⚪ Branca'}
                      {currentBelt === 'yellow' && '🟡 Amarela'}
                      {currentBelt === 'orange' && '🟠 Laranja'}
                      {currentBelt === 'green' && '🟢 Verde'}
                      {currentBelt === 'blue' && '🔵 Azul'}
                      {currentBelt === 'purple' && '🟣 Roxa'}
                      {currentBelt === 'brown' && '🟤 Marrom'}
                      {currentBelt === 'black' && '⚫ Preta'}
                    </p>
                  </div>
                  
                  {/* Dica */}
                  <div className="mt-6 p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-orange-200 text-center">
                    <p className="text-xs text-gray-600">
                      <Star className="w-3 h-3 inline mr-1 text-yellow-500" />
                      Clique no avatar para ver uma animação!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Opções de Customização - Coluna de 3 */}
            <div className="lg:col-span-3 space-y-6">
              {/* Tom de Pele */}
              <CustomizationSection
                title="Tom de Pele"
                description="Escolha o tom que mais combina com você"
                icon={<User className="w-5 h-5 text-orange-600" />}
                accentColor="orange"
              >
                <OptionSelector
                  options={SKIN_TONES}
                  selectedId={selectedSkinTone}
                  currentPoints={currentPoints}
                  onSelect={(id) => handleChange('skin', id)}
                  type="color"
                  accentColor="orange"
                />
              </CustomizationSection>

              {/* Estilo de Cabelo */}
              <CustomizationSection
                title="Estilo de Cabelo"
                description="Desbloqueie novos estilos ganhando pontos"
                icon={<Sparkles className="w-5 h-5 text-blue-600" />}
                accentColor="blue"
              >
                <OptionSelector
                  options={HAIR_STYLES}
                  selectedId={selectedHairStyle}
                  currentPoints={currentPoints}
                  onSelect={(id) => handleChange('hair', id)}
                  type="icon"
                  accentColor="blue"
                />
              </CustomizationSection>

              {/* Cor do Kimono */}
              <CustomizationSection
                title="Cor do Kimono"
                description="Cores especiais para karatecas avançados"
                icon={<Shirt className="w-5 h-5 text-purple-600" />}
                accentColor="purple"
              >
                <OptionSelector
                  options={KIMONO_COLORS}
                  selectedId={selectedKimonoColor}
                  currentPoints={currentPoints}
                  onSelect={(id) => handleChange('kimono', id)}
                  type="color"
                  accentColor="purple"
                />
              </CustomizationSection>

              {/* Botão Salvar */}
              <div className="sticky bottom-4 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || updateAvatarMutation.isPending}
                  className={cn(
                    'w-full h-14 text-lg font-bold shadow-xl transition-all duration-300',
                    'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500',
                    'hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600',
                    'hover:shadow-2xl hover:-translate-y-0.5',
                    !hasChanges && 'opacity-50'
                  )}
                >
                  {updateAvatarMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-3" />
                      {hasChanges ? 'Salvar Alterações' : 'Nenhuma alteração'}
                    </>
                  )}
                </Button>
                
                {hasChanges && (
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Você tem alterações não salvas
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
