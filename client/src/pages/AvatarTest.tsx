import { KarateAvatar, AllBelts, type BeltColor } from "@/components/KarateAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AvatarTest() {
  const belts: Array<{ color: BeltColor; points: number; name: string }> = [
    { color: 'white', points: 0, name: 'Faixa Branca (0-199 pts)' },
    { color: 'yellow', points: 200, name: 'Faixa Amarela (200-399 pts)' },
    { color: 'orange', points: 400, name: 'Faixa Laranja (400-599 pts)' },
    { color: 'green', points: 600, name: 'Faixa Verde (600-899 pts)' },
    { color: 'blue', points: 900, name: 'Faixa Azul (900-1199 pts)' },
    { color: 'purple', points: 1200, name: 'Faixa Roxa (1200-1599 pts)' },
    { color: 'brown', points: 1600, name: 'Faixa Marrom (1600-1999 pts)' },
    { color: 'black', points: 2000, name: 'Faixa Preta (2000+ pts)' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🥋 Sistema de Avatares de Karatê
          </h1>
          <p className="text-xl text-gray-600">
            MVP - 8 Variações de Faixa baseadas em Pontuação
          </p>
        </div>

        {/* Grid com todas as faixas */}
        <Card className="mb-12 shadow-2xl border-2">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-2xl">Todas as Faixas do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {belts.map((belt) => (
                <div key={belt.color} className="flex flex-col items-center">
                  <KarateAvatar belt={belt.color} size="md" showLabel />
                  <div className="mt-4 text-center">
                    <p className="text-sm font-semibold text-gray-700">{belt.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{belt.points}+ pontos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Demonstração de tamanhos */}
        <Card className="mb-12 shadow-2xl border-2">
          <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
            <CardTitle className="text-2xl">Variações de Tamanho</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex items-end justify-around gap-8">
              <div className="text-center">
                <KarateAvatar belt="blue" size="sm" />
                <p className="mt-3 text-sm font-semibold text-gray-700">Pequeno (sm)</p>
              </div>
              <div className="text-center">
                <KarateAvatar belt="blue" size="md" />
                <p className="mt-3 text-sm font-semibold text-gray-700">Médio (md)</p>
              </div>
              <div className="text-center">
                <KarateAvatar belt="blue" size="lg" />
                <p className="mt-3 text-sm font-semibold text-gray-700">Grande (lg)</p>
              </div>
              <div className="text-center">
                <KarateAvatar belt="blue" size="xl" />
                <p className="mt-3 text-sm font-semibold text-gray-700">Extra Grande (xl)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simulação de progresso */}
        <Card className="shadow-2xl border-2">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
            <CardTitle className="text-2xl">Simulação de Progresso</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Aluno Iniciante */}
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <KarateAvatar belt="white" size="md" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Aluno Iniciante</h3>
                    <p className="text-sm text-gray-600">50 pontos acumulados</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold">Progresso</span>
                        <span className="text-blue-600 font-bold">50 / 200</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                          style={{ width: '25%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aluno Intermediário */}
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <KarateAvatar belt="green" size="md" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Aluno Intermediário</h3>
                    <p className="text-sm text-gray-600">750 pontos acumulados</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold">Progresso</span>
                        <span className="text-blue-600 font-bold">750 / 900</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                          style={{ width: '83%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aluno Avançado */}
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <KarateAvatar belt="brown" size="md" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Aluno Avançado</h3>
                    <p className="text-sm text-gray-600">1850 pontos acumulados</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold">Progresso</span>
                        <span className="text-blue-600 font-bold">1850 / 2000</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                          style={{ width: '92.5%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aluno Mestre */}
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-yellow-400">
                <div className="flex items-center gap-4 mb-4">
                  <KarateAvatar belt="black" size="md" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Aluno Mestre 🏆</h3>
                    <p className="text-sm text-gray-600">2500 pontos acumulados</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold">Nível Máximo!</span>
                        <span className="text-yellow-600 font-bold">⭐ Faixa Preta</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações técnicas */}
        <div className="mt-12 bg-white rounded-xl p-8 shadow-lg border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Especificações Técnicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Sistema de Pontuação</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Faixa Branca:</strong> 0-199 pontos</li>
                <li>• <strong>Faixa Amarela:</strong> 200-399 pontos</li>
                <li>• <strong>Faixa Laranja:</strong> 400-599 pontos</li>
                <li>• <strong>Faixa Verde:</strong> 600-899 pontos</li>
                <li>• <strong>Faixa Azul:</strong> 900-1199 pontos</li>
                <li>• <strong>Faixa Roxa:</strong> 1200-1599 pontos</li>
                <li>• <strong>Faixa Marrom:</strong> 1600-1999 pontos</li>
                <li>• <strong>Faixa Preta:</strong> 2000+ pontos</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Recursos Implementados</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✅ Componente KarateAvatar com SVG customizado</li>
                <li>✅ 8 variações de faixa com cores distintas</li>
                <li>✅ 4 tamanhos disponíveis (sm, md, lg, xl)</li>
                <li>✅ Campos no banco de dados para customização</li>
                <li>✅ Integração com Dashboard do aluno</li>
                <li>✅ Barra de progresso dinâmica</li>
                <li>✅ Sistema de pontuação escalonado</li>
                <li>🔄 Próximo: Integrar com sistema de gamificação</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
