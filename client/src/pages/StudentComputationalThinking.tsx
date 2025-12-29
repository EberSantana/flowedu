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
import StudentLayout from '@/components/StudentLayout';

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
    <StudentLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Pensamento Computacional</h1>
              <p className="text-lg text-gray-600 mt-1">
                Desenvolva suas habilidades de resolução de problemas através das 4 dimensões
              </p>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas das 4 Dimensões */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-700">
                  Decomposição
                </CardTitle>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {profile?.decomposition?.score || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {profile?.decomposition?.exercisesCompleted || 0} exercícios completos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-700">
                  Padrões
                </CardTitle>
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {profile?.pattern_recognition?.score || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {profile?.pattern_recognition?.exercisesCompleted || 0} exercícios completos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-700">
                  Abstração
                </CardTitle>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {profile?.abstraction?.score || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {profile?.abstraction?.exercisesCompleted || 0} exercícios completos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-700">
                  Algoritmos
                </CardTitle>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">
                {profile?.algorithms?.score || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {profile?.algorithms?.exercisesCompleted || 0} exercícios completos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Perfil e Radar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Radar Chart */}
          <Card className="lg:col-span-2 border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-600" />
                Seu Perfil de Pensamento Computacional
              </CardTitle>
              <CardDescription>Pontuação em cada dimensão (0-100)</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {radarData ? (
                <div className="w-full max-w-md">
                  <Radar data={radarData} options={radarOptions} />
                </div>
              ) : (
                <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-dashed border-purple-200 w-full">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-purple-300" />
                  <p className="text-gray-600 font-medium">Complete exercícios para ver seu perfil</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Badges Conquistados */}
          <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Badges
              </CardTitle>
              <CardDescription>Conquistas desbloqueadas</CardDescription>
            </CardHeader>
            <CardContent>
              {badges && badges.length > 0 ? (
                <div className="space-y-3">
                  {badges.map((badge: any) => (
                    <div key={badge.id} className="flex items-center gap-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg px-3 py-3 border border-yellow-200">
                      <span className="text-2xl">{badge.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{badge.name}</p>
                        <p className="text-xs text-gray-600 line-clamp-1">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-600">Nenhum badge conquistado ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Exercícios Disponíveis */}
        {!selectedExercise ? (
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-600" />
                Exercícios Disponíveis
              </CardTitle>
              <CardDescription>Escolha um exercício para praticar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exercises?.map((exercise: any) => (
                  <div
                    key={exercise.id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer bg-white"
                    onClick={() => setSelectedExercise(exercise)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">{exercise.title}</h3>
                      <Badge className={`${difficultyColors[exercise.difficulty]} flex-shrink-0`}>
                        {difficultyLabels[exercise.difficulty]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{exercise.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                        <Target className="w-4 h-4 text-blue-600" />
                        {dimensionNames[exercise.dimension]}
                      </span>
                      <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                        <TrendingUp className="w-4 h-4 text-green-600" />
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
          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedExercise.title}</CardTitle>
                  <CardDescription className="mt-2 text-base">{selectedExercise.description}</CardDescription>
                </div>
                <Badge className={`${difficultyColors[selectedExercise.difficulty]} flex-shrink-0`}>
                  {difficultyLabels[selectedExercise.difficulty]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm bg-gray-50 p-3 rounded-lg">
                <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                  <Target className="w-4 h-4 text-blue-600" />
                  {dimensionNames[selectedExercise.dimension]}
                </span>
                <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  {selectedExercise.points} pontos
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className="flex-1 h-11 text-base font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Resposta'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedExercise(null);
                    setAnswer('');
                  }}
                  className="h-11 px-6"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Últimas Submissões */}
        {submissions && submissions.length > 0 && !selectedExercise && (
          <Card className="mt-8 border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-green-600" />
                Últimas Submissões
              </CardTitle>
              <CardDescription>Histórico dos seus exercícios recentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissions.map((sub: any) => (
                  <div key={sub.id} className="flex items-start gap-3 p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{sub.exerciseTitle}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{sub.feedback}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-700 font-medium">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Pontuação: {sub.score}/100
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {dimensionNames[sub.dimension]}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}
