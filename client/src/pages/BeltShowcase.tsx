import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import PageWrapper from '@/components/PageWrapper';
import BeltDisplay3D from '@/components/BeltDisplay3D';
import BeltLevelUpEffect from '@/components/BeltLevelUpEffect';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

const beltLevels = [
  { level: 'white' as const, name: 'Branca', color: '#F8F8F8', points: '0-99' },
  { level: 'yellow' as const, name: 'Amarela', color: '#FFD700', points: '100-299' },
  { level: 'orange' as const, name: 'Laranja', color: '#FF8C00', points: '300-599' },
  { level: 'red' as const, name: 'Vermelha', color: '#DC143C', points: '600-999' },
  { level: 'green' as const, name: 'Verde', color: '#228B22', points: '1000-1499' },
  { level: 'blue' as const, name: 'Azul', color: '#4169E1', points: '1500-2099' },
  { level: 'purple' as const, name: 'Roxa', color: '#8B008B', points: '2100-2799' },
  { level: 'brown' as const, name: 'Marrom', color: '#8B4513', points: '2800-3599' },
  { level: 'black' as const, name: 'Preta', color: '#1C1C1C', points: '3600+' },
];

const sampleBadges = [
  { type: 'velocista' as const, label: 'Velocista - Completa exercícios rapidamente' },
  { type: 'perfeccionista' as const, label: 'Perfeccionista - Média acima de 95%' },
  { type: 'mestre' as const, label: 'Mestre - Domínio completo da especialização' },
  { type: 'dedicado' as const, label: 'Dedicado - Streak de 30 dias' },
];

export default function BeltShowcase() {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [selectedBelt, setSelectedBelt] = useState(beltLevels[0]);
  const [showParticles, setShowParticles] = useState<string | null>(null);

  const handleBeltClick = (belt: typeof beltLevels[0]) => {
    setSelectedBelt(belt);
    setShowLevelUp(true);
  };

  const handleParticlesDemo = (beltLevel: string) => {
    setShowParticles(beltLevel);
    setTimeout(() => setShowParticles(null), 2000);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <PageWrapper>
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Sistema de Faixas 3D</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Explore o novo sistema visual de faixas de karatê com animações 3D, badges de conquista e efeitos especiais
            </p>
          </div>

          {/* Tamanhos */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Tamanhos Disponíveis</h2>
            <div className="flex flex-wrap items-end gap-8">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Small</p>
                <BeltDisplay3D beltLevel="yellow" size="sm" showBadges={false} />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Medium</p>
                <BeltDisplay3D beltLevel="orange" size="md" showBadges={false} />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Large</p>
                <BeltDisplay3D beltLevel="green" size="lg" showBadges={false} />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Extra Large</p>
                <BeltDisplay3D beltLevel="blue" size="xl" showBadges={false} />
              </div>
            </div>
          </Card>

          {/* Todas as faixas */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Todas as Faixas</h2>
            <p className="text-gray-600 mb-6">Passe o mouse sobre as faixas para ver o efeito 3D</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {beltLevels.map((belt) => (
                <div key={belt.level} className="text-center space-y-4">
                  <BeltDisplay3D
                    beltLevel={belt.level}
                    size="lg"
                    showBadges={false}
                    showParticles={showParticles === belt.level}
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{belt.name}</p>
                    <p className="text-sm text-gray-500">{belt.points} pontos</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      onClick={() => handleBeltClick(belt)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600"
                    >
                      Ver Celebração
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleParticlesDemo(belt.level)}
                    >
                      Partículas
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Badges de conquista */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Badges de Conquista</h2>
            <p className="text-gray-600 mb-6">Badges especiais aparecem ao lado da faixa baseados em métricas de desempenho</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {sampleBadges.map((badge, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <BeltDisplay3D
                    beltLevel="purple"
                    size="md"
                    badges={[badge]}
                  />
                  <div>
                    <p className="font-semibold text-gray-800 capitalize">{badge.type}</p>
                    <p className="text-sm text-gray-600">{badge.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Exemplo com múltiplos badges */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Faixa com Múltiplos Badges</h2>
            <p className="text-gray-600 mb-6">Um aluno pode conquistar vários badges simultaneamente</p>
            <div className="flex justify-center">
              <BeltDisplay3D
                beltLevel="black"
                size="xl"
                badges={[
                  { type: 'mestre', label: 'Mestre' },
                  { type: 'perfeccionista', label: 'Perfeccionista' },
                  { type: 'velocista', label: 'Velocista' },
                ]}
              />
            </div>
          </Card>

          {/* Instruções */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Como Funciona</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>🎨 Animação 3D:</strong> Passe o mouse sobre qualquer faixa para ver o efeito de rotação 3D
              </p>
              <p>
                <strong>🏆 Badges:</strong> Conquistas especiais aparecem automaticamente baseadas em:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Velocista:</strong> Completa exercícios rapidamente (tempo médio abaixo de 5min)</li>
                <li><strong>Perfeccionista:</strong> Mantém média de pontuação acima de 95%</li>
                <li><strong>Mestre:</strong> Conquista 5 badges Platinum na especialização</li>
                <li><strong>Dedicado:</strong> Mantém streak de 30 dias consecutivos</li>
              </ul>
              <p>
                <strong>✨ Efeito de Partículas:</strong> Ao conquistar uma nova faixa, uma animação especial de celebração é exibida com confete e partículas brilhantes
              </p>
            </div>
          </Card>
        </div>

        {/* Efeito de Level Up */}
        <BeltLevelUpEffect
          show={showLevelUp}
          newBeltLevel={selectedBelt.name}
          newBeltColor={selectedBelt.color}
          onComplete={() => setShowLevelUp(false)}
        />
      </PageWrapper>
    </div>
  );
}
