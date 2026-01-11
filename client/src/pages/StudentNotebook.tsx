import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BookOpen, CheckCircle2, XCircle, Star, BookMarked, TrendingUp, Clock, Lightbulb, ExternalLink, AlertCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

export default function StudentNotebook() {
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>();
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect' | 'marked'>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  // Buscar disciplinas do aluno
  const { data: enrollments } = trpc.student.getEnrolledSubjects.useQuery();
  
  // Buscar questões com filtros
  const filters = useMemo(() => {
    const base: any = { subjectId: selectedSubject };
    if (filterType === 'correct') base.isCorrect = true;
    if (filterType === 'incorrect') base.isCorrect = false;
    if (filterType === 'marked') base.markedForReview = true;
    return base;
  }, [selectedSubject, filterType]);

  const { data: questions, isLoading, refetch } = trpc.notebook.getQuestions.useQuery(filters);
  const { data: stats } = trpc.notebook.getStats.useQuery({ subjectId: selectedSubject });

  // Mutations
  const toggleReviewMutation = trpc.notebook.toggleReview.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Marcação atualizada!');
    },
  });

  const updateMasteryMutation = trpc.notebook.updateMastery.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Status atualizado!');
    },
  });

  const generateMaterialMutation = trpc.notebook.generateStudyMaterial.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Materiais de estudo gerados com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao gerar materiais de estudo');
    },
  });

  const handleToggleReview = (answerId: number, currentStatus: boolean) => {
    toggleReviewMutation.mutate({ answerId, markedForReview: !currentStatus });
  };

  const handleUpdateMastery = (answerId: number, status: 'not_started' | 'studying' | 'practicing' | 'mastered') => {
    updateMasteryMutation.mutate({ answerId, masteryStatus: status });
  };

  const handleGenerateMaterial = (question: any) => {
    generateMaterialMutation.mutate({
      answerId: question.answerId,
      questionText: question.questionText,
      studentAnswer: question.studentAnswer,
      correctAnswer: question.correctAnswer || '',
      questionType: question.questionType,
    });
  };

  const toggleExpanded = (answerId: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(answerId)) {
        newSet.delete(answerId);
      } else {
        newSet.add(answerId);
      }
      return newSet;
    });
  };

  const getMasteryColor = (status: string) => {
    switch (status) {
      case 'mastered': return 'bg-green-500';
      case 'practicing': return 'bg-blue-500';
      case 'studying': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getMasteryLabel = (status: string) => {
    switch (status) {
      case 'mastered': return 'Dominado';
      case 'practicing': return 'Praticando';
      case 'studying': return 'Estudando';
      default: return 'Não iniciado';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          Meu Caderno de Exercícios
        </h1>
        <p className="text-muted-foreground">
          Revise suas questões, acompanhe seu progresso e receba sugestões personalizadas de estudo
        </p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Questões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Acertos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.correctQuestions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalQuestions > 0 ? Math.round((stats.correctQuestions / stats.totalQuestions) * 100) : 0}% de aproveitamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-500" />
                Erros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.incorrectQuestions}</div>
              <p className="text-xs text-muted-foreground">Para revisar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Dominadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.mastered}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalQuestions > 0 ? Math.round((stats.mastered / stats.totalQuestions) * 100) : 0}% de domínio
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Disciplina</label>
            <Select value={selectedSubject?.toString() || 'all'} onValueChange={(v) => setSelectedSubject(v === 'all' ? undefined : Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as disciplinas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as disciplinas</SelectItem>
                {enrollments?.filter(e => e.subject).map((e) => (
                  <SelectItem key={e.subject!.id} value={e.subject!.id.toString()}>
                    {e.subject!.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Tipo</label>
            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as questões</SelectItem>
                <SelectItem value="correct">Apenas acertos</SelectItem>
                <SelectItem value="incorrect">Apenas erros</SelectItem>
                <SelectItem value="marked">Marcadas para revisão</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Questões */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !questions || questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma questão encontrada</h3>
            <p className="text-muted-foreground">
              Complete alguns exercícios para ver suas questões aqui!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <Card key={q.answerId} className={`border-l-4 ${q.isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={q.isCorrect ? 'default' : 'destructive'} className="gap-1">
                        {q.isCorrect ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {q.isCorrect ? 'Correto' : 'Incorreto'}
                      </Badge>
                      <Badge variant="outline">{q.exerciseTitle}</Badge>
                      {q.markedForReview && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Revisar
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base">{q.questionText}</CardTitle>
                    <CardDescription className="mt-2">
                      Questão {q.questionNumber} • {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={q.markedForReview ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleReview(q.answerId, q.markedForReview || false)}
                      disabled={toggleReviewMutation.isPending}
                    >
                      <Star className={`h-4 w-4 ${q.markedForReview ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Collapsible open={expandedQuestions.has(q.answerId)} onOpenChange={() => toggleExpanded(q.answerId)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span>Ver detalhes</span>
                      <BookMarked className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-4 space-y-4">
                    {/* Respostas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          Sua Resposta
                        </h4>
                        <p className="text-sm">{q.studentAnswer}</p>
                      </div>

                      {q.correctAnswer && (
                        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Resposta Correta
                          </h4>
                          <p className="text-sm">{q.correctAnswer}</p>
                        </div>
                      )}
                    </div>

                    {/* Status de Domínio */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Status de Domínio
                      </h4>
                      <div className="flex gap-2">
                        {(['not_started', 'studying', 'practicing', 'mastered'] as const).map((status) => (
                          <Button
                            key={status}
                            variant={q.masteryStatus === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleUpdateMastery(q.answerId, status)}
                            disabled={updateMasteryMutation.isPending}
                            className={q.masteryStatus === status ? getMasteryColor(status) : ''}
                          >
                            {getMasteryLabel(status)}
                          </Button>
                        ))}
                      </div>
                      {q.reviewCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Revisado {q.reviewCount} {q.reviewCount === 1 ? 'vez' : 'vezes'}
                        </p>
                      )}
                    </div>

                    {/* Materiais de Estudo */}
                    {!q.detailedExplanation && !q.isCorrect && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-blue-500" />
                              Materiais de Estudo com IA
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Gere materiais personalizados para estudar este tópico
                            </p>
                          </div>
                          <Button
                            onClick={() => handleGenerateMaterial(q)}
                            disabled={generateMaterialMutation.isPending}
                            size="sm"
                          >
                            {generateMaterialMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Gerar'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {q.detailedExplanation && (
                      <Tabs defaultValue="explanation" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="explanation">Explicação</TabsTrigger>
                          <TabsTrigger value="strategy">Estratégia</TabsTrigger>
                          <TabsTrigger value="resources">Recursos</TabsTrigger>
                          <TabsTrigger value="practice">Prática</TabsTrigger>
                        </TabsList>

                        <TabsContent value="explanation" className="space-y-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              Explicação Detalhada
                            </h4>
                            <p className="text-sm whitespace-pre-wrap">{q.detailedExplanation}</p>
                          </div>

                          {q.commonMistakes && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                Erros Comuns
                              </h4>
                              <p className="text-sm">{q.commonMistakes}</p>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="strategy" className="space-y-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Como Estudar
                            </h4>
                            <p className="text-sm whitespace-pre-wrap">{q.studyStrategy}</p>
                          </div>

                          {q.timeToMaster && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                Tempo Estimado
                              </h4>
                              <p className="text-sm">
                                Aproximadamente {q.timeToMaster} minutos para dominar este conceito
                              </p>
                            </div>
                          )}

                          {q.relatedConcepts && (
                            <div className="p-4 bg-muted rounded-lg">
                              <h4 className="font-semibold text-sm mb-2">Conceitos Relacionados</h4>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {JSON.parse(q.relatedConcepts).map((concept: string, idx: number) => (
                                  <li key={idx}>{concept}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="resources" className="space-y-4">
                          {q.additionalResources && (
                            <div className="space-y-2">
                              {JSON.parse(q.additionalResources).map((resource: any, idx: number) => (
                                <a
                                  key={idx}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                  <div>
                                    <h5 className="font-semibold text-sm">{resource.title}</h5>
                                    <p className="text-xs text-muted-foreground">{resource.type}</p>
                                  </div>
                                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                </a>
                              ))}
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="practice" className="space-y-4">
                          {q.practiceExamples && (
                            <div className="space-y-3">
                              {JSON.parse(q.practiceExamples).map((example: string, idx: number) => (
                                <div key={idx} className="p-4 bg-muted rounded-lg">
                                  <h5 className="font-semibold text-sm mb-2">Exemplo {idx + 1}</h5>
                                  <p className="text-sm whitespace-pre-wrap">{example}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
