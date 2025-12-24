import { useState } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Award, CheckCircle2, Clock, Target } from 'lucide-react';


ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function StudentComputationalThinking() {

  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  const { data: profile, refetch: refetchProfile } = trpc.computationalThinking.getProfile.useQuery();
  const { data: exercises } = trpc.computationalThinking.getExercises.useQuery();
  const { data: badges } = trpc.computationalThinking.getBadges.useQuery();
  const { data: submissions } = trpc.computationalThinking.getSubmissions.useQuery({ limit: 5 });

  const submitExercise = trpc.computationalThinking.submitExercise.useMutation({
    onSuccess: (data) => {
      alert(`Exercício enviado!\n\nPontuação: ${data.score}/100\n${data.feedback}`);
      refetchProfile();
      setSelectedExercise(null);
      setAnswer('');
      setIsSubmitting(false);
    },
    onError: (error) => {
      alert(`Erro ao enviar: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = () => {
    if (!answer.trim()) {
      alert('Por favor, escreva sua resposta antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    submitExercise.mutate({
      exerciseId: selectedExercise.id,
      answer: answer.trim(),
      timeSpent,
    });
  };

  // Dados do radar chart
  const radarData = profile ? {
    labels: ['Decomposição', 'Padrões', 'Abstração', 'Algoritmos'],
    datasets: [
      {
        label: 'Minha Pontuação',
        data: [
          profile.decomposition?.score || 0,
          profile.pattern_recognition?.score || 0,
          profile.abstraction?.score || 0,
          profile.algorithms?.score || 0,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
      },
    ],
  } : null;

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const dimensionNames: Record<string, string> = {
    decomposition: 'Decomposição',
    pattern_recognition: 'Reconhecimento de Padrões',
    abstraction: 'Abstração',
    algorithms: 'Algoritmos',
  };

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  const difficultyLabels: Record<string, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Pensamento Computacional</h1>
          </div>
          <p className="text-gray-600">
            Desenvolva suas habilidades de resolução de problemas através das 4 dimensões do Pensamento Computacional
          </p>
        </div>

        {/* Perfil e Radar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Radar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Seu Perfil de Pensamento Computacional</CardTitle>
              <CardDescription>Pontuação em cada dimensão (0-100)</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {radarData ? (
                <div className="w-full max-w-md">
                  <Radar data={radarData} options={radarOptions} />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Complete exercícios para ver seu perfil</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cards de Estatísticas */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Decomposição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {profile?.decomposition?.score || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {profile?.decomposition?.exercisesCompleted || 0} exercícios
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Reconhecimento de Padrões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {profile?.pattern_recognition?.score || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {profile?.pattern_recognition?.exercisesCompleted || 0} exercícios
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Abstração</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {profile?.abstraction?.score || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {profile?.abstraction?.exercisesCompleted || 0} exercícios
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Algoritmos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {profile?.algorithms?.score || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {profile?.algorithms?.exercisesCompleted || 0} exercícios
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Badges Conquistados */}
        {badges && badges.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Badges Conquistados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {badges.map((badge: any) => (
                  <div key={badge.id} className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2">
                    <span className="text-2xl">{badge.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{badge.name}</p>
                      <p className="text-xs text-gray-600">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercícios Disponíveis */}
        {!selectedExercise ? (
          <Card>
            <CardHeader>
              <CardTitle>Exercícios Disponíveis</CardTitle>
              <CardDescription>Escolha um exercício para praticar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exercises?.map((exercise: any) => (
                  <div
                    key={exercise.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedExercise(exercise)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{exercise.title}</h3>
                      <Badge className={difficultyColors[exercise.difficulty]}>
                        {difficultyLabels[exercise.difficulty]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{exercise.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {dimensionNames[exercise.dimension]}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {exercise.points} pontos
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Exercício Selecionado */
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedExercise.title}</CardTitle>
                  <CardDescription className="mt-2">{selectedExercise.description}</CardDescription>
                </div>
                <Badge className={difficultyColors[selectedExercise.difficulty]}>
                  {difficultyLabels[selectedExercise.difficulty]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {dimensionNames[selectedExercise.dimension]}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {selectedExercise.points} pontos
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sua Resposta
                </label>
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Escreva sua resposta aqui..."
                  rows={8}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Resposta'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedExercise(null);
                    setAnswer('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Últimas Submissões */}
        {submissions && submissions.length > 0 && !selectedExercise && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Últimas Submissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissions.map((sub: any) => (
                  <div key={sub.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{sub.exerciseTitle}</p>
                      <p className="text-xs text-gray-600 mt-1">{sub.feedback}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>Pontuação: {sub.score}/100</span>
                        <span>•</span>
                        <span>{dimensionNames[sub.dimension]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
