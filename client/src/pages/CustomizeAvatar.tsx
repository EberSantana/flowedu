import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { KarateAvatarPro, type BeltColor, type AvatarMood, type Pose, type Expression } from '@/components/KarateAvatarPro';
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
  Shirt,
  Scissors,
  Glasses,
  Smile,
  PersonStanding
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StudentLayout from '@/components/StudentLayout';

// Configuração de opções de customização - TOM DE PELE
const SKIN_TONES = [
  { id: 'light', label: 'Claro', unlockLevel: 0, color: '#FFE0BD' },
  { id: 'medium', label: 'Médio', unlockLevel: 0, color: '#F1C27D' },
  { id: 'tan', label: 'Bronzeado', unlockLevel: 0, color: '#C68642' },
  { id: 'dark', label: 'Moreno', unlockLevel: 0, color: '#8D5524' },
  { id: 'darker', label: 'Escuro', unlockLevel: 0, color: '#5C3317' },
  { id: 'darkest', label: 'Muito Escuro', unlockLevel: 0, color: '#3E2723' },
];

// ESTILOS DE CABELO
const HAIR_STYLES = [
  { id: 'short', label: 'Curto', unlockLevel: 0, icon: '✂️', description: 'Estilo clássico' },
  { id: 'medium', label: 'Médio', unlockLevel: 100, icon: '💇', description: '100 pts' },
  { id: 'long', label: 'Longo', unlockLevel: 200, icon: '🦱', description: '200 pts' },
  { id: 'bald', label: 'Careca', unlockLevel: 300, icon: '🧑‍🦲', description: '300 pts' },
  { id: 'ponytail', label: 'Rabo de Cavalo', unlockLevel: 400, icon: '🎀', description: '400 pts' },
  { id: 'mohawk', label: 'Moicano', unlockLevel: 600, icon: '🤘', description: '600 pts' },
];

// CORES DE CABELO
const HAIR_COLORS = [
  { id: 'black', label: 'Preto', unlockLevel: 0, color: '#1a1a1a' },
  { id: 'brown', label: 'Castanho', unlockLevel: 0, color: '#4a3728' },
  { id: 'blonde', label: 'Loiro', unlockLevel: 150, color: '#d4a574' },
  { id: 'red', label: 'Ruivo', unlockLevel: 300, color: '#8b3a3a' },
  { id: 'colorful', label: 'Colorido', unlockLevel: 800, color: 'linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #9b59b6)' },
];

// CORES DO KIMONO
const KIMONO_COLORS = [
  { id: 'white', label: 'Branco', unlockLevel: 0, color: '#FFFFFF', description: 'Tradicional' },
  { id: 'blue', label: 'Azul', unlockLevel: 200, color: '#3B82F6', description: '200 pts' },
  { id: 'red', label: 'Vermelho', unlockLevel: 400, color: '#EF4444', description: '400 pts' },
  { id: 'black', label: 'Preto', unlockLevel: 800, color: '#1F2937', description: '800 pts' },
];

// ESTILOS DO KIMONO
const KIMONO_STYLES = [
  { id: 'traditional', label: 'Tradicional', unlockLevel: 0, icon: '🥋', description: 'Clássico' },
  { id: 'modern', label: 'Moderno', unlockLevel: 300, icon: '✨', description: '300 pts' },
  { id: 'competition', label: 'Competição', unlockLevel: 600, icon: '🏆', description: '600 pts' },
];

// ACESSÓRIOS DE CABEÇA
const HEAD_ACCESSORIES = [
  { id: 'none', label: 'Nenhum', unlockLevel: 0, icon: '❌', description: 'Sem acessório' },
  { id: 'bandana', label: 'Bandana', unlockLevel: 100, icon: '🎀', description: '100 pts' },
  { id: 'headband', label: 'Faixa na Testa', unlockLevel: 200, icon: '🏋️', description: '200 pts' },
  { id: 'cap', label: 'Boné', unlockLevel: 400, icon: '🧢', description: '400 pts' },
  { id: 'glasses', label: 'Óculos', unlockLevel: 500, icon: '👓', description: '500 pts' },
];

// EXPRESSÕES FACIAIS
const EXPRESSIONS = [
  { id: 'neutral', label: 'Neutro', unlockLevel: 0, icon: '😐', description: 'Expressão padrão' },
  { id: 'happy', label: 'Feliz', unlockLevel: 0, icon: '😊', description: 'Sorridente' },
  { id: 'determined', label: 'Determinado', unlockLevel: 150, icon: '😤', description: '150 pts' },
  { id: 'focused', label: 'Concentrado', unlockLevel: 300, icon: '🧘', description: '300 pts' },
  { id: 'victorious', label: 'Vitorioso', unlockLevel: 500, icon: '🤩', description: '500 pts' },
];

// POSES
const POSES = [
  { id: 'standing', label: 'Saudação', unlockLevel: 0, icon: '🧍', description: 'Posição inicial' },
  { id: 'fighting', label: 'Posição de Luta', unlockLevel: 200, icon: '🥊', description: '200 pts' },
  { id: 'punch', label: 'Soco', unlockLevel: 400, icon: '👊', description: '400 pts' },
  { id: 'kick', label: 'Chute', unlockLevel: 700, icon: '🦵', description: '700 pts' },
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
  type: 'color' | 'icon' | 'gradient';
  columns?: number;
}

const OptionSelector: React.FC<OptionSelectorProps> = ({
  options,
  selectedId,
  currentPoints,
  onSelect,
  type,
  columns = 3,
}) => {
  return (
    <div className={cn(
      "grid gap-3",
      columns === 2 && "grid-cols-2",
      columns === 3 && "grid-cols-2 sm:grid-cols-3",
      columns === 4 && "grid-cols-2 sm:grid-cols-4",
      columns === 5 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
      columns === 6 && "grid-cols-3 sm:grid-cols-6"
    )}>
      {options.map((option) => {
        const isUnlocked = currentPoints >= option.unlockLevel;
        const isSelected = selectedId === option.id;

        return (
          <button
            key={option.id}
            onClick={() => isUnlocked && onSelect(option.id)}
            disabled={!isUnlocked}
            className={cn(
              'relative p-3 rounded-xl border-2 transition-all duration-300',
              'hover:shadow-lg hover:-translate-y-0.5',
              isSelected && 'border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-200',
              !isSelected && isUnlocked && 'border-gray-200 hover:border-gray-300 bg-white',
              !isUnlocked && 'opacity-60 cursor-not-allowed bg-gray-50'
            )}
          >
            {/* Indicador de selecionado */}
            {isSelected && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Conteúdo */}
            {type === 'color' && (
              <div 
                className="w-full h-10 rounded-lg mb-2 border border-gray-200 shadow-inner"
                style={{ backgroundColor: option.color }}
              />
            )}
            
            {type === 'gradient' && (
              <div 
                className="w-full h-10 rounded-lg mb-2 border border-gray-200 shadow-inner"
                style={{ background: option.color }}
              />
            )}
            
            {type === 'icon' && (
              <div className="text-2xl mb-2 text-center">
                {option.icon}
              </div>
            )}

            <p className="text-xs font-semibold text-gray-800 text-center">{option.label}</p>
            
            {option.description && option.unlockLevel > 0 && (
              <p className="text-[10px] text-gray-500 mt-0.5 text-center">{option.description}</p>
            )}

            {/* Overlay de bloqueado */}
            {!isUnlocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 rounded-xl backdrop-blur-sm">
                <Lock className="w-4 h-4 text-white mb-0.5" />
                <span className="text-[10px] text-white font-bold flex items-center gap-0.5">
                  <Zap className="w-2 h-2" />
                  {option.unlockLevel}
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
  iconBg: string;
  children: React.ReactNode;
}

const CustomizationSection: React.FC<CustomizationSectionProps> = ({
  title,
  description,
  icon,
  iconBg,
  children,
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

export function CustomizeAvatar() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.gamification.getStudentStats.useQuery();
  const { data: studentData, isLoading: studentLoading } = trpc.studentAvatar.getMyAvatar.useQuery();
  const updateAvatarMutation = trpc.studentAvatar.updateMyAvatar.useMutation();

  // Estados de customização
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [selectedSkinTone, setSelectedSkinTone] = useState<string>('light');
  const [selectedHairStyle, setSelectedHairStyle] = useState<string>('short');
  const [selectedHairColor, setSelectedHairColor] = useState<string>('black');
  const [selectedKimonoColor, setSelectedKimonoColor] = useState<string>('white');
  const [selectedKimonoStyle, setSelectedKimonoStyle] = useState<string>('traditional');
  const [selectedHeadAccessory, setSelectedHeadAccessory] = useState<string>('none');
  const [selectedExpression, setSelectedExpression] = useState<string>('neutral');
  const [selectedPose, setSelectedPose] = useState<string>('standing');
  
  const [hasChanges, setHasChanges] = useState(false);
  const [avatarMood, setAvatarMood] = useState<AvatarMood>('idle');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Carregar preferências atuais
  useEffect(() => {
    if (studentData) {
      setSelectedGender((studentData.avatarGender as 'male' | 'female') || 'male');
      setSelectedSkinTone(studentData.avatarSkinTone || 'light');
      setSelectedHairStyle(studentData.avatarHairStyle || 'short');
      setSelectedHairColor(studentData.avatarHairColor || 'black');
      setSelectedKimonoColor(studentData.avatarKimonoColor || 'white');
      setSelectedKimonoStyle(studentData.avatarKimonoStyle || 'traditional');
      setSelectedHeadAccessory(studentData.avatarHeadAccessory || 'none');
      setSelectedExpression(studentData.avatarExpression || 'neutral');
      setSelectedPose(studentData.avatarPose || 'standing');
    }
  }, [studentData]);

  const currentPoints = stats?.totalPoints || 0;
  const currentBelt = (stats?.currentBelt as BeltColor) || 'white';

  const handleSave = async () => {
    try {
      await updateAvatarMutation.mutateAsync({
        avatarGender: selectedGender,
        avatarSkinTone: selectedSkinTone,
        avatarHairStyle: selectedHairStyle,
        avatarHairColor: selectedHairColor,
        avatarKimonoColor: selectedKimonoColor,
        avatarKimonoStyle: selectedKimonoStyle,
        avatarHeadAccessory: selectedHeadAccessory,
        avatarExpression: selectedExpression,
        avatarPose: selectedPose,
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

  const handleChange = (setter: (value: string) => void) => (value: string) => {
    setHasChanges(true);
    setAvatarMood('happy');
    setTimeout(() => setAvatarMood('idle'), 500);
    setter(value);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 py-6 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setLocation('/student/dashboard')}
              className="mb-3 hover:bg-orange-100"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl shadow-lg">
                    <Palette className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Personalize seu Avatar
                  </h1>
                </div>
                <p className="text-gray-600 text-sm">
                  Customize seu karateca e desbloqueie novas opções!
                </p>
              </div>
              
              {/* Badge de pontos */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-yellow-300">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span className="font-bold text-yellow-700">
                  {currentPoints.toLocaleString()} pontos
                </span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Preview do Avatar - Coluna lateral */}
            <div className="lg:col-span-4 xl:col-span-3">
              <Card className="border-2 border-orange-200 shadow-xl sticky top-4 overflow-hidden">
                {/* Fundo decorativo */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50" />
                
                <CardHeader className="relative bg-gradient-to-r from-orange-100/80 to-yellow-100/80 backdrop-blur-sm py-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-orange-500" />
                    Pré-visualização
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative flex flex-col items-center justify-center py-6">
                  {/* Avatar com efeitos */}
                  <div className="relative">
                    <KarateAvatarPro
                      belt={currentBelt}
                      size="xl"
                      skinTone={selectedSkinTone as any}
                      hairStyle={selectedHairStyle as any}
                      hairColor={selectedHairColor as any}
                      kimonoColor={selectedKimonoColor as any}
                      kimonoStyle={selectedKimonoStyle as any}
                      headAccessory={selectedHeadAccessory as any}
                      expression={selectedExpression as Expression}
                      pose={selectedPose as Pose}
                      mood={avatarMood}
                      animation="idle"
                      interactive
                      showGlow={currentBelt === 'black'}
                      showLabel
                    />
                  </div>
                  
                  {/* Indicador de sucesso */}
                  {showSaveSuccess && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-green-100 border border-green-300 rounded-lg">
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-semibold text-green-700">Salvo!</span>
                    </div>
                  )}
                  
                  {/* Info da faixa */}
                  <div className="mt-4 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs text-gray-500 font-medium">Faixa Atual</span>
                    </div>
                    <p className="text-base font-bold text-gray-800 capitalize">
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
                  <div className="mt-4 p-2 bg-white/80 backdrop-blur-sm rounded-lg border border-orange-200 text-center">
                    <p className="text-[10px] text-gray-600">
                      <Star className="w-3 h-3 inline mr-1 text-yellow-500" />
                      Clique no avatar para interagir!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Opções de Customização */}
            <div className="lg:col-span-8 xl:col-span-9">
              <Card className="border shadow-lg">
                <CardContent className="p-4">
                  <Tabs defaultValue="appearance" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="appearance" className="text-xs sm:text-sm">
                        <User className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Aparência</span>
                        <span className="sm:hidden">Corpo</span>
                      </TabsTrigger>
                      <TabsTrigger value="equipment" className="text-xs sm:text-sm">
                        <Shirt className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Equipamentos</span>
                        <span className="sm:hidden">Roupa</span>
                      </TabsTrigger>
                      <TabsTrigger value="expression" className="text-xs sm:text-sm">
                        <Smile className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Expressão/Pose</span>
                        <span className="sm:hidden">Pose</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Aba Aparência */}
                    <TabsContent value="appearance" className="space-y-6">
                      {/* Gênero do Avatar */}
                      <CustomizationSection
                        title="Gênero do Avatar"
                        description="Escolha a apresentação visual do seu karateca"
                        icon={<User className="w-4 h-4 text-indigo-600" />}
                        iconBg="bg-indigo-100"
                      >
                        <div className="flex gap-4">
                          <button
                            onClick={() => setSelectedGender('male')}
                            className={selectedGender === 'male' ? 'flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 bg-indigo-500 text-white shadow-lg scale-105' : 'flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 bg-gray-100 text-gray-700 hover:bg-gray-200'}
                          >
                            👨 Masculino
                          </button>
                          <button
                            onClick={() => setSelectedGender('female')}
                            className={selectedGender === 'female' ? 'flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 bg-pink-500 text-white shadow-lg scale-105' : 'flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 bg-gray-100 text-gray-700 hover:bg-gray-200'}
                          >
                            👩 Feminino
                          </button>
                        </div>
                      </CustomizationSection>

                      {/* Tom de Pele */}
                      <CustomizationSection
                        title="Tom de Pele"
                        description="Escolha o tom que mais combina com você"
                        icon={<User className="w-4 h-4 text-orange-600" />}
                        iconBg="bg-orange-100"
                      >
                        <OptionSelector
                          options={SKIN_TONES}
                          selectedId={selectedSkinTone}
                          currentPoints={currentPoints}
                          onSelect={handleChange(setSelectedSkinTone)}
                          type="color"
                          columns={6}
                        />
                      </CustomizationSection>

                      {/* Estilo de Cabelo */}
                      <CustomizationSection
                        title="Estilo de Cabelo"
                        description="Desbloqueie novos estilos ganhando pontos"
                        icon={<Scissors className="w-4 h-4 text-blue-600" />}
                        iconBg="bg-blue-100"
                      >
                        <OptionSelector
                          options={HAIR_STYLES}
                          selectedId={selectedHairStyle}
                          currentPoints={currentPoints}
                          onSelect={handleChange(setSelectedHairStyle)}
                          type="icon"
                          columns={6}
                        />
                      </CustomizationSection>

                      {/* Cor do Cabelo */}
                      <CustomizationSection
                        title="Cor do Cabelo"
                        description="Personalize a cor do seu cabelo"
                        icon={<Palette className="w-4 h-4 text-purple-600" />}
                        iconBg="bg-purple-100"
                      >
                        <OptionSelector
                          options={HAIR_COLORS}
                          selectedId={selectedHairColor}
                          currentPoints={currentPoints}
                          onSelect={handleChange(setSelectedHairColor)}
                          type="gradient"
                          columns={5}
                        />
                      </CustomizationSection>
                    </TabsContent>

                    {/* Aba Equipamentos */}
                    <TabsContent value="equipment" className="space-y-6">
                      {/* Cor do Kimono */}
                      <CustomizationSection
                        title="Cor do Kimono"
                        description="Cores especiais para karatecas avançados"
                        icon={<Shirt className="w-4 h-4 text-red-600" />}
                        iconBg="bg-red-100"
                      >
                        <OptionSelector
                          options={KIMONO_COLORS}
                          selectedId={selectedKimonoColor}
                          currentPoints={currentPoints}
                          onSelect={handleChange(setSelectedKimonoColor)}
                          type="color"
                          columns={4}
                        />
                      </CustomizationSection>

                      {/* Estilo do Kimono */}
                      <CustomizationSection
                        title="Estilo do Kimono"
                        description="Escolha o estilo do seu uniforme"
                        icon={<Star className="w-4 h-4 text-amber-600" />}
                        iconBg="bg-amber-100"
                      >
                        <OptionSelector
                          options={KIMONO_STYLES}
                          selectedId={selectedKimonoStyle}
                          currentPoints={currentPoints}
                          onSelect={handleChange(setSelectedKimonoStyle)}
                          type="icon"
                          columns={3}
                        />
                      </CustomizationSection>

                      {/* Acessórios de Cabeça */}
                      <CustomizationSection
                        title="Acessórios de Cabeça"
                        description="Adicione um toque especial ao seu avatar"
                        icon={<Glasses className="w-4 h-4 text-indigo-600" />}
                        iconBg="bg-indigo-100"
                      >
                        <OptionSelector
                          options={HEAD_ACCESSORIES}
                          selectedId={selectedHeadAccessory}
                          currentPoints={currentPoints}
                          onSelect={handleChange(setSelectedHeadAccessory)}
                          type="icon"
                          columns={5}
                        />
                      </CustomizationSection>
                    </TabsContent>

                    {/* Aba Expressão/Pose */}
                    <TabsContent value="expression" className="space-y-6">
                      {/* Expressão Facial */}
                      <CustomizationSection
                        title="Expressão Facial"
                        description="Como seu karateca está se sentindo?"
                        icon={<Smile className="w-4 h-4 text-green-600" />}
                        iconBg="bg-green-100"
                      >
                        <OptionSelector
                          options={EXPRESSIONS}
                          selectedId={selectedExpression}
                          currentPoints={currentPoints}
                          onSelect={handleChange(setSelectedExpression)}
                          type="icon"
                          columns={5}
                        />
                      </CustomizationSection>

                      {/* Pose */}
                      <CustomizationSection
                        title="Pose"
                        description="Escolha a pose do seu avatar"
                        icon={<PersonStanding className="w-4 h-4 text-cyan-600" />}
                        iconBg="bg-cyan-100"
                      >
                        <OptionSelector
                          options={POSES}
                          selectedId={selectedPose}
                          currentPoints={currentPoints}
                          onSelect={handleChange(setSelectedPose)}
                          type="icon"
                          columns={4}
                        />
                      </CustomizationSection>
                    </TabsContent>
                  </Tabs>

                  {/* Botão Salvar */}
                  <div className="mt-6 pt-4 border-t">
                    <Button
                      onClick={handleSave}
                      disabled={!hasChanges || updateAvatarMutation.isPending}
                      className={cn(
                        'w-full h-12 text-base font-bold shadow-lg transition-all duration-300',
                        'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500',
                        'hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600',
                        'hover:shadow-xl hover:-translate-y-0.5',
                        !hasChanges && 'opacity-50'
                      )}
                    >
                      {updateAvatarMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {hasChanges ? 'Salvar Alterações' : 'Nenhuma alteração'}
                        </>
                      )}
                    </Button>
                    
                    {hasChanges && (
                      <p className="text-center text-xs text-gray-500 mt-2">
                        Você tem alterações não salvas
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
