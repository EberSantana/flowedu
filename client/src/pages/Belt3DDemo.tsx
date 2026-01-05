import { useState } from 'react';
import { Belt3DWebGL, Belt3DWebGLSkeleton } from '@/components/Belt3DWebGL';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BeltColor } from '@/components/Belt3DRealistic';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'wouter';

export default function Belt3DDemo() {
  const [selectedBelt, setSelectedBelt] = useState<BeltColor>('black');
  const [animated, setAnimated] = useState(true);
  const [interactive, setInteractive] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  const belts: Array<{ color: BeltColor; label: string }> = [
    { color: 'white', label: 'Branca' },
    { color: 'yellow', label: 'Amarela' },
    { color: 'orange', label: 'Laranja' },
    { color: 'green', label: 'Verde' },
    { color: 'blue', label: 'Azul' },
    { color: 'purple', label: 'Roxa' },
    { color: 'brown', label: 'Marrom' },
    { color: 'black', label: 'Preta' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/student/evolution">
            <Button variant="ghost" className="mb-4 text-white hover:text-white/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold">Animações 3D WebGL</h1>
          </div>
          <p className="text-gray-400">
            Faixas de karatê renderizadas em tempo real com Three.js
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visualização Principal */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Visualização 3D</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center min-h-[500px]">
                <Belt3DWebGL
                  color={selectedBelt}
                  size="xl"
                  animated={animated}
                  interactive={interactive}
                  autoRotate={autoRotate}
                  showLabel={true}
                />
              </CardContent>
            </Card>

            {/* Controles */}
            <Card className="mt-6 bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Controles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Animações de Partículas</span>
                  <Button
                    variant={animated ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAnimated(!animated)}
                  >
                    {animated ? 'Ativado' : 'Desativado'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Controles Interativos</span>
                  <Button
                    variant={interactive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInteractive(!interactive)}
                  >
                    {interactive ? 'Ativado' : 'Desativado'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Rotação Automática</span>
                  <Button
                    variant={autoRotate ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAutoRotate(!autoRotate)}
                  >
                    {autoRotate ? 'Ativado' : 'Desativado'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seletor de Faixas */}
          <div>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Selecionar Faixa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {belts.map((belt) => (
                    <Button
                      key={belt.color}
                      variant={selectedBelt === belt.color ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedBelt(belt.color)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white/20"
                          style={{
                            backgroundColor: belt.color === 'white' ? '#F0F0F0' : 
                              belt.color === 'yellow' ? '#FFD700' :
                              belt.color === 'orange' ? '#FF8C00' :
                              belt.color === 'green' ? '#22C55E' :
                              belt.color === 'blue' ? '#3B82F6' :
                              belt.color === 'purple' ? '#8B5CF6' :
                              belt.color === 'brown' ? '#A16207' :
                              '#1A1A1A'
                          }}
                        />
                        <span>Faixa {belt.label}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Informações Técnicas */}
            <Card className="mt-6 bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Tecnologias</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-400 space-y-2">
                <div>✨ Three.js - Renderização WebGL</div>
                <div>🎨 React Three Fiber - Integração React</div>
                <div>🎭 Drei - Helpers e controles</div>
                <div>💫 Partículas animadas em tempo real</div>
                <div>🌟 Iluminação realista (3 pontos)</div>
                <div>🎮 Controles de órbita interativos</div>
                <div>🔮 Materiais PBR (Metalness/Roughness)</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Galeria de Todas as Faixas */}
        <Card className="mt-8 bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Galeria de Faixas 3D</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {belts.map((belt) => (
                <div
                  key={belt.color}
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={() => setSelectedBelt(belt.color)}
                >
                  <Belt3DWebGL
                    color={belt.color}
                    size="sm"
                    animated={false}
                    interactive={false}
                    showLabel={true}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="mt-8 bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Como Usar</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-2">
            <p>🖱️ <strong>Arraste</strong> para rotacionar a faixa</p>
            <p>🔍 <strong>Scroll</strong> para zoom (se habilitado)</p>
            <p>👆 <strong>Clique</strong> em uma faixa na galeria para visualizá-la</p>
            <p>⚙️ <strong>Use os controles</strong> para ativar/desativar efeitos</p>
            <p>✨ <strong>Partículas animadas</strong> aparecem ao redor da faixa</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
