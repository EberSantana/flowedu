import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Palette, Database, Server, Sparkles, Trophy, Zap } from 'lucide-react';
import { toast } from 'sonner';

const specializations = [
  {
    id: 'code_warrior',
    name: 'Guerreiro do Código',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    description: 'Domínio de algoritmos, estruturas de dados e lógica de programação',
    skills: ['Algoritmos Avançados', 'Estruturas de Dados', 'Otimização de Código', 'Recursão'],
    bonus: '+50% pontos em exercícios de algoritmos',
  },
  {
    id: 'interface_master',
    name: 'Mestre das Interfaces',
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
    description: 'Criação de interfaces visuais impressionantes e experiências de usuário',
    skills: ['HTML & CSS', 'Design Responsivo', 'UX/UI', 'Animações'],
    bonus: '+50% pontos em projetos de interface',
  },
  {
    id: 'data_sage',
    name: 'Sábio dos Dados',
    icon: Database,
    color: 'from-green-500 to-emerald-500',
    description: 'Análise, manipulação e visualização de dados complexos',
    skills: ['SQL Avançado', 'Análise de Dados', 'Estatística', 'Machine Learning'],
    bonus: '+50% pontos em exercícios de dados',
  },
  {
    id: 'system_architect',
    name: 'Arquiteto de Sistemas',
    icon: Server,
    color: 'from-orange-500 to-red-500',
    description: 'Construção de infraestruturas robustas e escaláveis',
    skills: ['Redes', 'DevOps', 'Cloud Computing', 'Segurança'],
    bonus: '+50% pontos em projetos de infraestrutura',
  },
];

export default function ChooseSpecialization() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);

  const { data: currentSpec, isLoading } = trpc.specializations.getMy.useQuery();
  const chooseMutation = trpc.specializations.choose.useMutation({
    onSuccess: (data) => {
      toast.success('Especialização escolhida com sucesso!', {
        description: `Você agora é um ${specializations.find(s => s.id === data.specialization)?.name}!`,
      });
      navigate('/student/dashboard');
    },
    onError: (error) => {
      toast.error('Erro ao escolher especialização', {
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (currentSpec) {
    navigate('/student/skill-tree');
    return null;
  }

  const handleChoose = () => {
    if (!selectedSpec) {
      toast.error('Selecione uma especialização');
      return;
    }

    chooseMutation.mutate({ specialization: selectedSpec as any });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-yellow-400" />
            <h1 className="text-5xl font-bold text-white">Escolha Sua Especialização</h1>
            <Sparkles className="w-10 h-10 text-yellow-400" />
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Defina seu caminho no Dojo Tech. Cada especialização oferece habilidades únicas e bônus especiais.
            <br />
            <span className="text-yellow-400 font-semibold">Esta escolha é permanente!</span>
          </p>
        </div>

        {/* Specializations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {specializations.map((spec) => {
            const Icon = spec.icon;
            const isSelected = selectedSpec === spec.id;

            return (
              <Card
                key={spec.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'ring-4 ring-yellow-400 shadow-2xl shadow-yellow-400/50'
                    : 'hover:shadow-xl'
                }`}
                onClick={() => setSelectedSpec(spec.id)}
              >
                <CardHeader className={`bg-gradient-to-r ${spec.color} text-white rounded-t-lg`}>
                  <div className="flex items-center gap-3">
                    <Icon className="w-10 h-10" />
                    <div>
                      <CardTitle className="text-2xl">{spec.name}</CardTitle>
                      {isSelected && (
                        <Badge className="bg-yellow-400 text-black mt-2">
                          <Trophy className="w-3 h-3 mr-1" />
                          Selecionado
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <CardDescription className="text-base mb-4">{spec.description}</CardDescription>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Habilidades:</h4>
                      <div className="flex flex-wrap gap-2">
                        {spec.skills.map((skill) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">{spec.bonus}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Confirm Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={handleChoose}
            disabled={!selectedSpec || chooseMutation.isPending}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg px-12 py-6 rounded-full shadow-2xl transition-all duration-300 hover:scale-110"
          >
            {chooseMutation.isPending ? (
              'Confirmando...'
            ) : (
              <>
                <Trophy className="w-6 h-6 mr-2" />
                Confirmar Especialização
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
