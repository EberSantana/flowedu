import { useState } from 'react';
import { KarateAvatar3D, type BeltColor, type Gender } from '@/components/KarateAvatar3D';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star } from 'lucide-react';
import { Link } from 'wouter';

const BELTS: BeltColor[] = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black'];

const BELT_NAMES: Record<BeltColor, string> = {
  white: 'Faixa Branca',
  yellow: 'Faixa Amarela',
  orange: 'Faixa Laranja',
  green: 'Faixa Verde',
  blue: 'Faixa Azul',
  purple: 'Faixa Roxa',
  brown: 'Faixa Marrom',
  black: 'Faixa Preta',
};

export default function Avatar3DDemo() {
  const [selectedGender, setSelectedGender] = useState<Gender>('male');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/student">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Avatares 3D de Karatê</h1>
            <p className="text-gray-500 mt-1">Visualize todas as faixas e estilos disponíveis</p>
          </div>
        </div>

        {/* Seletor de Gênero */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Selecionar Gênero</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant={selectedGender === 'male' ? 'default' : 'outline'}
                onClick={() => setSelectedGender('male')}
                className="gap-2"
              >
                👨 Masculino
              </Button>
              <Button
                variant={selectedGender === 'female' ? 'default' : 'outline'}
                onClick={() => setSelectedGender('female')}
                className="gap-2"
              >
                👩 Feminino
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Avatares */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Todas as Faixas - Estilo 3D Realista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {BELTS.map((belt) => (
                <div 
                  key={belt}
                  className="flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <KarateAvatar3D
                    belt={belt}
                    gender={selectedGender}
                    size="lg"
                  />
                  <div className="mt-4 text-center">
                    <p className="font-bold text-gray-800">{BELT_NAMES[belt]}</p>
                    <p className="text-sm text-gray-500">
                      {belt === 'white' ? '0+ pts' :
                       belt === 'yellow' ? '200+ pts' :
                       belt === 'orange' ? '400+ pts' :
                       belt === 'green' ? '600+ pts' :
                       belt === 'blue' ? '900+ pts' :
                       belt === 'purple' ? '1200+ pts' :
                       belt === 'brown' ? '1600+ pts' :
                       '2000+ pts'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparação de Tamanhos */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Tamanhos Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-8 flex-wrap">
              {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                <div key={size} className="flex flex-col items-center">
                  <KarateAvatar3D
                    belt="black"
                    gender={selectedGender}
                    size={size}
                  />
                  <p className="mt-2 font-semibold text-gray-600 uppercase">{size}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
