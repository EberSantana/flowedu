import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { KarateAvatar3D, type BeltColor, type Gender } from '@/components/KarateAvatar3D';
import { 
  Save, 
  ArrowLeft, 
  Check, 
  Star,
  Trophy,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StudentLayout from '@/components/StudentLayout';

// Configuração de gênero
const GENDERS: { id: Gender; label: string; icon: string }[] = [
  { id: 'male', label: 'Masculino', icon: '👨' },
  { id: 'female', label: 'Feminino', icon: '👩' },
];

// Configuração das faixas
const BELT_CONFIG: Record<BeltColor, { name: string; minPoints: number; color: string }> = {
  white: { name: 'Faixa Branca', minPoints: 0, color: 'bg-gray-200' },
  yellow: { name: 'Faixa Amarela', minPoints: 200, color: 'bg-yellow-400' },
  orange: { name: 'Faixa Laranja', minPoints: 400, color: 'bg-orange-400' },
  green: { name: 'Faixa Verde', minPoints: 600, color: 'bg-green-500' },
  blue: { name: 'Faixa Azul', minPoints: 900, color: 'bg-blue-500' },
  purple: { name: 'Faixa Roxa', minPoints: 1200, color: 'bg-purple-500' },
  brown: { name: 'Faixa Marrom', minPoints: 1600, color: 'bg-amber-700' },
  black: { name: 'Faixa Preta', minPoints: 2000, color: 'bg-gray-900' },
};

function getBeltFromPoints(points: number): BeltColor {
  if (points >= 2000) return 'black';
  if (points >= 1600) return 'brown';
  if (points >= 1200) return 'purple';
  if (points >= 900) return 'blue';
  if (points >= 600) return 'green';
  if (points >= 400) return 'orange';
  if (points >= 200) return 'yellow';
  return 'white';
}

export default function CustomizeAvatar3D() {
  const [, navigate] = useLocation();
  const { data: stats } = trpc.gamification.getStudentStats.useQuery();
  
  const totalPoints = stats?.totalPoints || 0;
  const currentBelt = getBeltFromPoints(totalPoints);
  
  // Estado do avatar
  const [selectedGender, setSelectedGender] = useState<Gender>('male');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Salvar preferência localmente por enquanto
    localStorage.setItem('avatarGender', selectedGender);
    toast.success('Avatar atualizado com sucesso!', {
      description: 'Suas preferências foram salvas.',
      icon: <Check className="w-5 h-5 text-green-500" />,
    });
    setIsSaving(false);
  };

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/student')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Personalizar Avatar 3D</h1>
              <p className="text-gray-500 mt-1">Escolha o estilo do seu karateca</p>
            </div>
          </div>
          
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Preview do Avatar */}
          <Card className="lg:sticky lg:top-6 h-fit">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Seu Avatar 3D
              </CardTitle>
              <CardDescription>
                Visualize as mudanças em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-8">
              {/* Avatar 3D Grande */}
              <div className="relative mb-6">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 rounded-3xl blur-xl opacity-50" />
                <KarateAvatar3D
                  belt={currentBelt}
                  gender={selectedGender}
                  size="xl"
                  className="relative z-10"
                />
              </div>
              
              {/* Info da Faixa */}
              <div className={cn(
                'px-6 py-3 rounded-full font-bold text-sm shadow-lg',
                BELT_CONFIG[currentBelt].color,
                currentBelt === 'black' ? 'text-white' : 'text-gray-800'
              )}>
                {BELT_CONFIG[currentBelt].name}
              </div>
              
              {/* Pontos */}
              <div className="mt-4 flex items-center gap-2 text-gray-600">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold">{totalPoints.toLocaleString()} pontos</span>
              </div>
            </CardContent>
          </Card>

          {/* Opções de Customização */}
          <div className="space-y-6">
            {/* Seleção de Gênero */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-blue-500" />
                  Gênero do Avatar
                </CardTitle>
                <CardDescription>
                  Escolha o estilo do seu personagem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {GENDERS.map((gender) => (
                    <button
                      key={gender.id}
                      onClick={() => setSelectedGender(gender.id)}
                      className={cn(
                        'relative p-6 rounded-xl border-2 transition-all duration-300',
                        'hover:shadow-lg hover:scale-[1.02]',
                        selectedGender === gender.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      )}
                    >
                      {selectedGender === gender.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div className="text-4xl mb-3">{gender.icon}</div>
                      <div className="font-semibold text-gray-800">{gender.label}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Preview de Todas as Faixas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Evolução das Faixas
                </CardTitle>
                <CardDescription>
                  Veja como seu avatar evolui conforme você ganha pontos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {(Object.keys(BELT_CONFIG) as BeltColor[]).map((belt) => {
                    const config = BELT_CONFIG[belt];
                    const isUnlocked = totalPoints >= config.minPoints;
                    const isCurrent = belt === currentBelt;
                    
                    return (
                      <div
                        key={belt}
                        className={cn(
                          'relative p-3 rounded-xl text-center transition-all',
                          isCurrent && 'ring-2 ring-blue-500 ring-offset-2',
                          !isUnlocked && 'opacity-50 grayscale'
                        )}
                      >
                        <KarateAvatar3D
                          belt={belt}
                          gender={selectedGender}
                          size="sm"
                          className="mx-auto mb-2"
                        />
                        <div className="text-xs font-medium text-gray-600 truncate">
                          {config.name.replace('Faixa ', '')}
                        </div>
                        <div className="text-xs text-gray-400">
                          {config.minPoints}+ pts
                        </div>
                        
                        {isCurrent && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Star className="w-3 h-3 text-white fill-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Dica */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500 rounded-xl">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Dica de Evolução</h3>
                    <p className="text-sm text-gray-600">
                      Complete exercícios e trilhas de aprendizagem para ganhar pontos e 
                      desbloquear novas faixas! Quanto mais você aprende, mais seu avatar evolui.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
