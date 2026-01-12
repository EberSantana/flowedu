import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Calendar, 
  Plus,
  BarChart3,
  Brain,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import PageWrapper from '@/components/PageWrapper';

export function MistakeNotebook() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Queries
  const statsQuery = trpc.mistakeNotebook.getStats.useQuery();
  const questionsQuery = trpc.mistakeNotebook.listQuestions.useQuery({});
  const topicsQuery = trpc.mistakeNotebook.listTopics.useQuery({});
  const insightsQuery = trpc.mistakeNotebook.listInsights.useQuery({ onlyUnread: false });
  const studyPlansQuery = trpc.mistakeNotebook.listStudyPlans.useQuery({});
  
  const stats = statsQuery.data;
  const questions = questionsQuery.data || [];
  const topics = topicsQuery.data || [];
  const insights = insightsQuery.data || [];
  const studyPlans = studyPlansQuery.data || [];
  
  // Mutations
  const analyzePatternsMutation = trpc.mistakeNotebook.analyzePatterns.useMutation();
  const generateSuggestionsMutation = trpc.mistakeNotebook.generateSuggestions.useMutation();
  
  const handleAnalyzePatterns = async () => {
    try {
      await analyzePatternsMutation.mutateAsync({});
      insightsQuery.refetch();
    } catch (error) {
      console.error('Error analyzing patterns:', error);
    }
  };
  
  const handleGenerateSuggestions = async () => {
    try {
      await generateSuggestionsMutation.mutateAsync();
      insightsQuery.refetch();
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'hard': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'easy': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <PageWrapper>
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📚 Caderno de Erros e Acertos com IA
            </h1>
            <p className="text-gray-600">
              Registre suas questões, analise padrões de erro e receba sugestões personalizadas de estudo
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard">
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="questions">
                <BookOpen className="w-4 h-4 mr-2" />
                Questões
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <Brain className="w-4 h-4 mr-2" />
                Análise IA
              </TabsTrigger>
              <TabsTrigger value="suggestions">
                <Lightbulb className="w-4 h-4 mr-2" />
                Sugestões
              </TabsTrigger>
              <TabsTrigger value="plans">
                <Calendar className="w-4 h-4 mr-2" />
                Planos
              </TabsTrigger>
            </TabsList>
            
            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Estatísticas Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total de Questões
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {stats?.totalQuestions || 0}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Taxa de Acerto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {stats?.successRate.toFixed(1) || 0}%
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Tópicos Críticos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {stats?.criticalTopics || 0}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total de Tentativas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {stats?.totalAttempts || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Tópicos Prioritários */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Tópicos que Precisam de Atenção
                  </CardTitle>
                  <CardDescription>
                    Foque nos tópicos com maior taxa de erro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topics.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum tópico registrado ainda</p>
                      <p className="text-sm">Adicione questões para começar a análise</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topics.slice(0, 5).map((topic) => (
                        <div key={topic.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(topic.priority)}`} />
                              <h4 className="font-medium">{topic.topicName}</h4>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{topic.subject}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">
                              {topic.errorRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {topic.totalQuestions} questões
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Distribuição por Matéria */}
              {stats && Object.keys(stats.questionsBySubject).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Matéria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.questionsBySubject).map(([subject, count]) => (
                        <div key={subject} className="flex items-center justify-between">
                          <span className="font-medium">{subject}</span>
                          <Badge variant="secondary">{count} questões</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Questões Tab */}
            <TabsContent value="questions" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Minhas Questões</h2>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Questão
                </Button>
              </div>
              
              {questions.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma questão registrada</h3>
                    <p className="text-gray-600 mb-4">
                      Comece adicionando questões que você errou ou quer revisar
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeira Questão
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {questions.map((question) => (
                    <Card key={question.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getDifficultyColor(question.difficulty)}>
                                {question.difficulty === 'easy' ? 'Fácil' : question.difficulty === 'medium' ? 'Média' : 'Difícil'}
                              </Badge>
                              <Badge variant="outline">{question.subject}</Badge>
                            </div>
                            <CardTitle className="text-lg">{question.topic}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-4 line-clamp-3">
                          {question.questionText}
                        </p>
                        {question.tags && question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {question.tags.map((tag: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Adicionada em {new Date(question.createdAt).toLocaleDateString('pt-BR')}</span>
                          <Button variant="outline" size="sm">Ver Detalhes</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Análise IA Tab */}
            <TabsContent value="analysis" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Análise Inteligente de Padrões
                  </CardTitle>
                  <CardDescription>
                    Use IA para identificar seus padrões de erro e áreas de dificuldade
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleAnalyzePatterns}
                    disabled={analyzePatternsMutation.isPending || topics.length === 0}
                    className="w-full"
                  >
                    {analyzePatternsMutation.isPending ? 'Analisando...' : 'Analisar Padrões com IA'}
                  </Button>
                  
                  {topics.length === 0 && (
                    <p className="text-sm text-gray-600 text-center">
                      Adicione pelo menos uma questão para gerar análises
                    </p>
                  )}
                </CardContent>
              </Card>
              
              {/* Insights Gerados */}
              {insights.filter(i => i.insightType === 'pattern_analysis').length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Insights Recentes</h3>
                  {insights
                    .filter(i => i.insightType === 'pattern_analysis')
                    .map((insight) => (
                      <Card key={insight.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                            {!insight.isRead && (
                              <Badge variant="default">Novo</Badge>
                            )}
                          </div>
                          <CardDescription>
                            {new Date(insight.generatedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap">{insight.content}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>
            
            {/* Sugestões Tab */}
            <TabsContent value="suggestions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Sugestões Personalizadas de Estudo
                  </CardTitle>
                  <CardDescription>
                    Receba recomendações baseadas no seu desempenho
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleGenerateSuggestions}
                    disabled={generateSuggestionsMutation.isPending || questions.length === 0}
                    className="w-full"
                  >
                    {generateSuggestionsMutation.isPending ? 'Gerando...' : 'Gerar Sugestões com IA'}
                  </Button>
                  
                  {questions.length === 0 && (
                    <p className="text-sm text-gray-600 text-center">
                      Adicione questões para receber sugestões personalizadas
                    </p>
                  )}
                </CardContent>
              </Card>
              
              {/* Sugestões Geradas */}
              {insights.filter(i => i.insightType === 'study_suggestion').length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Sugestões Recentes</h3>
                  {insights
                    .filter(i => i.insightType === 'study_suggestion')
                    .map((insight) => (
                      <Card key={insight.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                            {!insight.isRead && (
                              <Badge variant="default">Novo</Badge>
                            )}
                          </div>
                          <CardDescription>
                            {new Date(insight.generatedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap">{insight.content}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>
            
            {/* Planos Tab */}
            <TabsContent value="plans" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Planos de Estudo</h2>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Novo Plano
                </Button>
              </div>
              
              {studyPlans.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum plano de estudos</h3>
                    <p className="text-gray-600 mb-4">
                      Crie um plano personalizado baseado nas suas dificuldades
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Plano
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {studyPlans.map((plan) => (
                    <Card key={plan.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{plan.title}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                          </div>
                          <Badge 
                            variant={plan.status === 'active' ? 'default' : 'secondary'}
                          >
                            {plan.status === 'active' ? 'Ativo' : plan.status === 'completed' ? 'Concluído' : 'Abandonado'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {new Date(plan.startDate).toLocaleDateString('pt-BR')} - {new Date(plan.endDate).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="font-medium">
                              {plan.completedTasks}/{plan.totalTasks} tarefas
                            </span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${plan.progressPercentage}%` }}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {plan.progressPercentage.toFixed(0)}% concluído
                            </span>
                            <Button variant="outline" size="sm">Ver Detalhes</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PageWrapper>
    </div>
  );
}
