import { useState } from "react";
import { trpc } from "@/lib/trpc";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingBag, 
  Coins, 
  Crown, 
  Glasses, 
  Sparkles, 
  Image, 
  Star,
  Lock,
  Check,
  ShoppingCart,
  Package,
  Shirt
} from "lucide-react";
import { toast } from "sonner";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { KarateAvatarPro, type BeltColor } from "@/components/KarateAvatarPro";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Configuração de faixas
const BELT_ORDER = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black'];
const BELT_NAMES: Record<string, string> = {
  white: 'Branca',
  yellow: 'Amarela',
  orange: 'Laranja',
  green: 'Verde',
  blue: 'Azul',
  purple: 'Roxa',
  brown: 'Marrom',
  black: 'Preta',
};

// Ícones por categoria
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  hat: <Crown className="h-5 w-5" />,
  glasses: <Glasses className="h-5 w-5" />,
  accessory: <Sparkles className="h-5 w-5" />,
  background: <Image className="h-5 w-5" />,
  special: <Star className="h-5 w-5" />,
};

const CATEGORY_NAMES: Record<string, string> = {
  all: 'Todos',
  hat: 'Chapéus',
  glasses: 'Óculos',
  accessory: 'Acessórios',
  background: 'Fundos',
  special: 'Especiais',
};

type ShopItem = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: number;
  imageUrl: string | null;
  svgData: string | null;
  requiredBelt: string | null;
  isActive: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requiredPoints: number;
  stock: number;
  metadata: unknown;
  sortOrder: number;
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

export default function StudentShop() {
  const { student } = useStudentAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Buscar dados
  const { data: stats } = trpc.gamification.getStudentStats.useQuery();
  const { data: shopItems, isLoading: itemsLoading } = trpc.shop.getItems.useQuery({});
  const { data: myItems, refetch: refetchMyItems } = trpc.shop.getMyItems.useQuery();
  const { data: equippedItems, refetch: refetchEquipped } = trpc.shop.getEquippedItems.useQuery();

  // Mutations
  const purchaseMutation = trpc.shop.purchase.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      refetchMyItems();
      setShowConfirmDialog(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const equipMutation = trpc.shop.equip.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      refetchEquipped();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const unequipMutation = trpc.shop.unequip.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      refetchEquipped();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const studentPoints = stats?.totalPoints || 0;
  const currentBelt = (stats?.currentBelt as BeltColor) || getBeltFromPoints(studentPoints);
  const currentBeltIndex = BELT_ORDER.indexOf(currentBelt);

  // IDs dos itens que o aluno já possui
  const ownedItemIds = new Set(myItems?.map(p => p.item.id) || []);

  // Filtrar itens por categoria
  const filteredItems = (shopItems || []).filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  );

  // Verificar se pode comprar item
  const canPurchaseItem = (item: ShopItem) => {
    const requiredBeltIndex = BELT_ORDER.indexOf(item.requiredBelt || 'white');
    return currentBeltIndex >= requiredBeltIndex && studentPoints >= item.price;
  };

  // Verificar se item está bloqueado por faixa
  const isLockedByBelt = (item: ShopItem) => {
    const requiredBeltIndex = BELT_ORDER.indexOf(item.requiredBelt || 'white');
    return currentBeltIndex < requiredBeltIndex;
  };

  // Verificar se item está equipado
  const isItemEquipped = (itemId: number) => {
    return equippedItems?.some(e => e.item.id === itemId);
  };

  // Handler de compra
  const handlePurchase = () => {
    if (selectedItem) {
      purchaseMutation.mutate({ itemId: selectedItem.id });
    }
  };

  // Handler de equipar/desequipar
  const handleToggleEquip = (item: ShopItem) => {
    if (isItemEquipped(item.id)) {
      unequipMutation.mutate({ slot: item.category as any });
    } else {
      equipMutation.mutate({ itemId: item.id });
    }
  };

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ShoppingBag className="h-8 w-8 text-purple-600" />
                Loja do Dojo
              </h1>
              <p className="text-gray-600 mt-1">
                Gaste seus pontos em acessórios exclusivos para personalizar seu avatar
              </p>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-amber-100 px-4 py-2 rounded-full border border-yellow-300">
              <Coins className="h-6 w-6 text-yellow-600" />
              <span className="text-xl font-bold text-yellow-700">{studentPoints}</span>
              <span className="text-sm text-yellow-600">pontos</span>
            </div>
          </div>
        </div>

        {/* Preview do Avatar com itens equipados */}
        <Card className="mb-8 bg-gradient-to-br from-slate-50 to-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Seu Avatar
            </CardTitle>
            <CardDescription>
              Visualize seu avatar com os itens equipados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Avatar Preview */}
              <div className="relative">
                <div className="w-48 h-48 flex items-center justify-center bg-white rounded-2xl shadow-lg border-2 border-slate-200">
                  <KarateAvatarPro
                    belt={currentBelt}
                    size="lg"
                    skinTone={(student as any)?.avatarSkinTone || 'light'}
                    hairStyle={(student as any)?.avatarHairStyle || 'short'}
                    kimonoColor={(student as any)?.avatarKimonoColor || 'white'}
                    mood="happy"
                  />
                </div>
                <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600">
                  Faixa {BELT_NAMES[currentBelt]}
                </Badge>
              </div>

              {/* Itens Equipados */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-4">Itens Equipados</h3>
                {equippedItems && equippedItems.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {equippedItems.map((equipped) => (
                      <div
                        key={equipped.slot}
                        className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {CATEGORY_ICONS[equipped.item.category]}
                          <span className="text-xs text-gray-500 capitalize">
                            {CATEGORY_NAMES[equipped.item.category]}
                          </span>
                        </div>
                        <p className="font-medium text-sm text-gray-800 truncate">
                          {equipped.item.name}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleToggleEquip(equipped.item)}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Nenhum item equipado. Compre itens na loja e equipe-os aqui!
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Categorias */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
            {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white px-4 py-2 rounded-full border border-slate-200 bg-white"
              >
                <span className="flex items-center gap-2">
                  {key !== 'all' && CATEGORY_ICONS[key]}
                  {name}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Grid de Itens */}
        {itemsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Carregando itens...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum item disponível nesta categoria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const owned = ownedItemIds.has(item.id);
              const locked = isLockedByBelt(item);
              const equipped = isItemEquipped(item.id);
              const canAfford = studentPoints >= item.price;

              return (
                <Card
                  key={item.id}
                  className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                    locked ? 'opacity-75 grayscale' : ''
                  } ${equipped ? 'ring-2 ring-purple-500' : ''}`}
                >
                  {/* Badge de Raridade */}
                  {item.rarity !== 'common' && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Raro
                      </Badge>
                    </div>
                  )}

                  {/* Badge de Equipado */}
                  {equipped && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="bg-green-500 text-white">
                        <Check className="h-3 w-3 mr-1" />
                        Equipado
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      {CATEGORY_ICONS[item.category]}
                      <span className="capitalize">{CATEGORY_NAMES[item.category]}</span>
                    </div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                  </CardHeader>

                  <CardContent>
                    {/* Preview do Item */}
                    <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-4 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="max-h-20 object-contain"
                        />
                      ) : (
                        <div className="text-4xl">
                          {item.category === 'hat' && '🎩'}
                          {item.category === 'glasses' && '🕶️'}
                          {item.category === 'accessory' && '🏅'}
                          {item.category === 'background' && '🏯'}
                          {item.category === 'special' && '✨'}
                        </div>
                      )}
                    </div>

                    {/* Descrição */}
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Requisitos */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-yellow-600" />
                        <span className={`font-bold ${canAfford ? 'text-yellow-700' : 'text-red-500'}`}>
                          {item.price}
                        </span>
                      </div>
                      {item.requiredBelt && item.requiredBelt !== 'white' && (
                        <Badge variant="outline" className={locked ? 'border-red-300 text-red-600' : ''}>
                          {locked && <Lock className="h-3 w-3 mr-1" />}
                          Faixa {BELT_NAMES[item.requiredBelt]}
                        </Badge>
                      )}
                    </div>

                    {/* Botão de Ação */}
                    {owned ? (
                      <Button
                        className={`w-full ${
                          equipped
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        variant="ghost"
                        onClick={() => handleToggleEquip(item)}
                        disabled={equipMutation.isPending || unequipMutation.isPending}
                      >
                        {equipped ? (
                          <>Desequipar</>
                        ) : (
                          <>
                            <Shirt className="h-4 w-4 mr-2" />
                            Equipar
                          </>
                        )}
                      </Button>
                    ) : locked ? (
                      <Button className="w-full" variant="outline" disabled>
                        <Lock className="h-4 w-4 mr-2" />
                        Bloqueado
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={!canAfford}
                        onClick={() => {
                          setSelectedItem(item);
                          setShowConfirmDialog(true);
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {canAfford ? 'Comprar' : 'Pontos Insuficientes'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Meus Itens */}
        {myItems && myItems.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Meus Itens ({myItems.length})
              </CardTitle>
              <CardDescription>
                Itens que você já comprou
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {myItems.map((purchase) => {
                  const equipped = isItemEquipped(purchase.item.id);
                  return (
                    <div
                      key={purchase.purchaseId}
                      className={`bg-slate-50 rounded-lg p-3 border ${
                        equipped ? 'border-purple-400 bg-purple-50' : 'border-slate-200'
                      }`}
                    >
                      <div className="text-2xl text-center mb-2">
                        {purchase.item.category === 'hat' && '🎩'}
                        {purchase.item.category === 'glasses' && '🕶️'}
                        {purchase.item.category === 'accessory' && '🏅'}
                        {purchase.item.category === 'background' && '🏯'}
                        {purchase.item.category === 'special' && '✨'}
                      </div>
                      <p className="text-xs font-medium text-center text-gray-800 truncate">
                        {purchase.item.name}
                      </p>
                      {equipped && (
                        <Badge className="w-full mt-2 justify-center bg-purple-100 text-purple-700">
                          Equipado
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Confirmação de Compra */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Compra</DialogTitle>
              <DialogDescription>
                Você está prestes a comprar este item
              </DialogDescription>
            </DialogHeader>

            {selectedItem && (
              <div className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-4xl">
                    {selectedItem.category === 'hat' && '🎩'}
                    {selectedItem.category === 'glasses' && '🕶️'}
                    {selectedItem.category === 'accessory' && '🏅'}
                    {selectedItem.category === 'background' && '🏯'}
                    {selectedItem.category === 'special' && '✨'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedItem.name}</h3>
                    <p className="text-sm text-gray-600">{selectedItem.description}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Coins className="h-5 w-5 text-yellow-600" />
                      <span className="font-bold text-yellow-700">{selectedItem.price} pontos</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Seus pontos atuais:</span>
                    <span className="font-bold">{studentPoints}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Após a compra:</span>
                    <span className="font-bold text-green-600">
                      {studentPoints - selectedItem.price}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handlePurchase}
                disabled={purchaseMutation.isPending}
              >
                {purchaseMutation.isPending ? 'Comprando...' : 'Confirmar Compra'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StudentLayout>
  );
}
