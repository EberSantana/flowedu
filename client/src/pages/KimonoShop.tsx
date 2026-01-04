import React, { useState } from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { KimonoAvatarDisplay, type BeltColor } from '@/components/KimonoAvatarDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import { 
  ArrowLeft,
  Lock,
  Check,
  Star,
  Sparkles,
  Award,
  ShoppingBag,
  Palette,
  Shirt,
  Crown
} from 'lucide-react';

// Cores de kimono disponíveis
const KIMONO_COLORS = [
  { id: 'white', name: 'Branco Tradicional', color: '#FFFFFF', borderColor: '#E5E7EB', unlockLevel: 0, price: 0 },
  { id: 'blue', name: 'Azul Competição', color: '#1E40AF', borderColor: '#3B82F6', unlockLevel: 2, price: 100 },
  { id: 'black', name: 'Preto Elite', color: '#1F2937', borderColor: '#374151', unlockLevel: 5, price: 250 },
  { id: 'red', name: 'Vermelho Campeão', color: '#DC2626', borderColor: '#EF4444', unlockLevel: 7, price: 500 },
];

// Estilos de kimono
const KIMONO_STYLES = [
  { id: 'traditional', name: 'Tradicional', description: 'Corte clássico japonês', unlockLevel: 0, price: 0 },
  { id: 'modern', name: 'Moderno', description: 'Design contemporâneo', unlockLevel: 3, price: 150 },
  { id: 'competition', name: 'Competição', description: 'Aprovado pela WKF', unlockLevel: 5, price: 300 },
  { id: 'master', name: 'Mestre', description: 'Edição especial dourada', unlockLevel: 8, price: 1000 },
];

// Emblemas/Patches
const EMBLEMS = [
  { id: 'none', name: 'Sem Emblema', icon: '⬜', unlockLevel: 0, price: 0 },
  { id: 'dragon', name: 'Dragão', icon: '🐉', unlockLevel: 2, price: 50 },
  { id: 'tiger', name: 'Tigre', icon: '🐅', unlockLevel: 3, price: 75 },
  { id: 'phoenix', name: 'Fênix', icon: '🔥', unlockLevel: 4, price: 100 },
  { id: 'samurai', name: 'Samurai', icon: '⚔️', unlockLevel: 5, price: 150 },
  { id: 'lotus', name: 'Flor de Lótus', icon: '🪷', unlockLevel: 6, price: 200 },
  { id: 'kanji', name: 'Kanji Força', icon: '力', unlockLevel: 7, price: 300 },
  { id: 'gold_star', name: 'Estrela Dourada', icon: '⭐', unlockLevel: 8, price: 500 },
];

// Bordados
const EMBROIDERIES = [
  { id: 'none', name: 'Sem Bordado', unlockLevel: 0, price: 0 },
  { id: 'name', name: 'Nome Personalizado', unlockLevel: 1, price: 25 },
  { id: 'dojo', name: 'Nome do Dojo', unlockLevel: 2, price: 50 },
  { id: 'kanji_simple', name: 'Kanji Simples', unlockLevel: 3, price: 75 },
  { id: 'kanji_gold', name: 'Kanji Dourado', unlockLevel: 6, price: 200 },
  { id: 'full_back', name: 'Bordado Costas Completo', unlockLevel: 8, price: 400 },
];

// Calcular nível baseado em pontos
const calculateLevel = (points: number): number => {
  if (points < 200) return 1;
  if (points < 400) return 2;
  if (points < 600) return 3;
  if (points < 900) return 4;
  if (points < 1200) return 5;
  if (points < 1600) return 6;
  if (points < 2000) return 7;
  return 8;
};

// Calcular faixa baseado em pontos
const calculateBelt = (points: number): BeltColor => {
  if (points < 200) return 'white';
  if (points < 400) return 'yellow';
  if (points < 600) return 'orange';
  if (points < 900) return 'green';
  if (points < 1200) return 'blue';
  if (points < 1600) return 'purple';
  if (points < 2000) return 'brown';
  return 'black';
};

export default function KimonoShop() {
  const { user } = useAuth();
  const [selectedColor, setSelectedColor] = useState('white');
  const [selectedStyle, setSelectedStyle] = useState('traditional');
  const [selectedEmblem, setSelectedEmblem] = useState('none');
  const [selectedEmbroidery, setSelectedEmbroidery] = useState('none');

  // Buscar estatísticas de gamificação do aluno
  const { data: statsData } = trpc.gamification.getStudentStats.useQuery();

  const totalPoints = statsData?.totalPoints || 0;
  const currentLevel = calculateLevel(totalPoints);
  const currentBelt = calculateBelt(totalPoints);

  const isUnlocked = (unlockLevel: number) => currentLevel >= unlockLevel;

  const handlePurchase = (itemName: string, price: number) => {
    if (price === 0) {
      toast.success(`${itemName} selecionado!`);
    } else if (totalPoints >= price) {
      toast.success(`${itemName} adquirido por ${price} pontos!`);
    } else {
      toast.error(`Pontos insuficientes! Você precisa de ${price - totalPoints} pontos a mais.`);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Sidebar />
      
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/student">
            <Button variant="ghost" size="sm" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Loja de Kimonos</h1>
              <p className="text-gray-600">Personalize seu kimono com itens exclusivos</p>
            </div>
          </div>

          {/* Status do jogador */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md border">
              <Award className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Nível {currentLevel}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md border">
              <Star className="w-5 h-5 text-amber-500" />
              <span className="font-medium">{totalPoints.toLocaleString()} pontos</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md border">
              <Crown className="w-5 h-5 text-purple-500" />
              <span className="font-medium">{currentBelt === 'black' ? 'Faixa Preta' : `Faixa ${currentBelt.charAt(0).toUpperCase() + currentBelt.slice(1)}`}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Preview do Kimono */}
          <div className="xl:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Preview do Kimono
                </CardTitle>
                <CardDescription>Visualize suas customizações</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <KimonoAvatarDisplay 
                  belt={currentBelt}
                  size="2xl"
                  showGlow={currentBelt === 'black'}
                  showLabel
                />
                
                <div className="mt-6 w-full space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cor:</span>
                    <span className="font-medium">{KIMONO_COLORS.find(c => c.id === selectedColor)?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Estilo:</span>
                    <span className="font-medium">{KIMONO_STYLES.find(s => s.id === selectedStyle)?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Emblema:</span>
                    <span className="font-medium">{EMBLEMS.find(e => e.id === selectedEmblem)?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Bordado:</span>
                    <span className="font-medium">{EMBROIDERIES.find(e => e.id === selectedEmbroidery)?.name}</span>
                  </div>
                </div>

                <Button className="w-full mt-6 gap-2" size="lg">
                  <Check className="w-5 h-5" />
                  Aplicar Customização
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Opções de Customização */}
          <div className="xl:col-span-2">
            <Tabs defaultValue="colors" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="colors" className="gap-2">
                  <Palette className="w-4 h-4" />
                  Cores
                </TabsTrigger>
                <TabsTrigger value="styles" className="gap-2">
                  <Shirt className="w-4 h-4" />
                  Estilos
                </TabsTrigger>
                <TabsTrigger value="emblems" className="gap-2">
                  <Award className="w-4 h-4" />
                  Emblemas
                </TabsTrigger>
                <TabsTrigger value="embroidery" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Bordados
                </TabsTrigger>
              </TabsList>

              {/* Cores */}
              <TabsContent value="colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {KIMONO_COLORS.map((color) => {
                    const unlocked = isUnlocked(color.unlockLevel);
                    const isSelected = selectedColor === color.id;
                    
                    return (
                      <Card 
                        key={color.id}
                        className={cn(
                          'cursor-pointer transition-all duration-300',
                          isSelected && 'ring-2 ring-blue-500 shadow-lg',
                          !unlocked && 'opacity-60'
                        )}
                        onClick={() => unlocked && setSelectedColor(color.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-16 h-16 rounded-xl shadow-inner border-2"
                              style={{ 
                                backgroundColor: color.color,
                                borderColor: color.borderColor
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-800">{color.name}</h3>
                                {!unlocked && <Lock className="w-4 h-4 text-gray-400" />}
                                {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                              </div>
                              <p className="text-sm text-gray-500">
                                {unlocked ? (
                                  color.price > 0 ? `${color.price} pontos` : 'Grátis'
                                ) : (
                                  `Desbloqueia no nível ${color.unlockLevel}`
                                )}
                              </p>
                            </div>
                            {unlocked && color.price > 0 && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePurchase(color.name, color.price);
                                }}
                              >
                                Comprar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Estilos */}
              <TabsContent value="styles">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {KIMONO_STYLES.map((style) => {
                    const unlocked = isUnlocked(style.unlockLevel);
                    const isSelected = selectedStyle === style.id;
                    
                    return (
                      <Card 
                        key={style.id}
                        className={cn(
                          'cursor-pointer transition-all duration-300',
                          isSelected && 'ring-2 ring-blue-500 shadow-lg',
                          !unlocked && 'opacity-60'
                        )}
                        onClick={() => unlocked && setSelectedStyle(style.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-800">{style.name}</h3>
                                {!unlocked && <Lock className="w-4 h-4 text-gray-400" />}
                                {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                              </div>
                              <p className="text-sm text-gray-600">{style.description}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {unlocked ? (
                                  style.price > 0 ? `${style.price} pontos` : 'Grátis'
                                ) : (
                                  `Desbloqueia no nível ${style.unlockLevel}`
                                )}
                              </p>
                            </div>
                            {unlocked && style.price > 0 && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePurchase(style.name, style.price);
                                }}
                              >
                                Comprar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Emblemas */}
              <TabsContent value="emblems">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {EMBLEMS.map((emblem) => {
                    const unlocked = isUnlocked(emblem.unlockLevel);
                    const isSelected = selectedEmblem === emblem.id;
                    
                    return (
                      <Card 
                        key={emblem.id}
                        className={cn(
                          'cursor-pointer transition-all duration-300',
                          isSelected && 'ring-2 ring-blue-500 shadow-lg',
                          !unlocked && 'opacity-60'
                        )}
                        onClick={() => unlocked && setSelectedEmblem(emblem.id)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="text-4xl mb-2">{emblem.icon}</div>
                          <div className="flex items-center justify-center gap-1">
                            <h3 className="font-bold text-gray-800 text-sm">{emblem.name}</h3>
                            {!unlocked && <Lock className="w-3 h-3 text-gray-400" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {unlocked ? (
                              emblem.price > 0 ? `${emblem.price} pts` : 'Grátis'
                            ) : (
                              `Nível ${emblem.unlockLevel}`
                            )}
                          </p>
                          {isSelected && (
                            <Badge className="mt-2 bg-blue-500">Selecionado</Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Bordados */}
              <TabsContent value="embroidery">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {EMBROIDERIES.map((embroidery) => {
                    const unlocked = isUnlocked(embroidery.unlockLevel);
                    const isSelected = selectedEmbroidery === embroidery.id;
                    
                    return (
                      <Card 
                        key={embroidery.id}
                        className={cn(
                          'cursor-pointer transition-all duration-300',
                          isSelected && 'ring-2 ring-blue-500 shadow-lg',
                          !unlocked && 'opacity-60'
                        )}
                        onClick={() => unlocked && setSelectedEmbroidery(embroidery.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-800">{embroidery.name}</h3>
                                {!unlocked && <Lock className="w-4 h-4 text-gray-400" />}
                                {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {unlocked ? (
                                  embroidery.price > 0 ? `${embroidery.price} pontos` : 'Grátis'
                                ) : (
                                  `Desbloqueia no nível ${embroidery.unlockLevel}`
                                )}
                              </p>
                            </div>
                            {unlocked && embroidery.price > 0 && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePurchase(embroidery.name, embroidery.price);
                                }}
                              >
                                Comprar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
