import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Target,
  Lightbulb,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  BarChart3,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";

export function LearningAnalytics() {
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Queries
  const { data: subjects } = trpc.subjects.list.useQuery();
  const { data: students, isLoading: loadingStudents } = trpc.students.list.useQuery(
    { subjectId: selectedSubject! },
    { enabled: !!selectedSubject }
  );
  const { data: classAnalytics } = trpc.analytics.getClassAnalytics.useQuery({});
  const { data: alerts } = trpc.analytics.getAlerts.useQuery();
  const { data: alertStats } = trpc.analytics.getAlertStatistics.useQuery();
  
  const { data: studentInsights, refetch: refetchInsights } = trpc.analytics.getStudentInsights.useQuery(
    { studentId: selectedStudent! },
    { enabled: !!selectedStudent }
  );
  
  const { data: studentAlerts } = trpc.analytics.getStudentAlerts.useQuery(
    { studentId: selectedStudent! },
    { enabled: !!selectedStudent }
  );
  
  const { data: learningPatterns } = trpc.analytics.getLearningPatterns.useQuery(
    { studentId: selectedStudent! },
    { enabled: !!selectedStudent }
  );

  // Mutations
  const analyzeStudentMutation = trpc.analytics.analyzeStudent.useMutation({
    onSuccess: () => {
      toast.success("Análise concluída com sucesso!");
      refetchInsights();
      setIsAnalyzing(false);
    },
    onError: (error) => {
      toast.error(`Erro ao analisar: ${error.message}`);
      setIsAnalyzing(false);
    },
  });

  const acknowledgeAlertMutation = trpc.analytics.acknowledgeAlert.useMutation({
    onSuccess: () => {
      toast.success("Alerta reconhecido!");
    },
  });

  const resolveAlertMutation = trpc.analytics.resolveAlert.useMutation({
    onSuccess: () => {
      toast.success("Alerta resolvido!");
    },
  });

  const dismissInsightMutation = trpc.analytics.dismissInsight.useMutation({
    onSuccess: () => {
      toast.success("Insight dispensado!");
      refetchInsights();
    },
  });

  const handleAnalyzeStudent = () => {
    if (!selectedStudent) {
      toast.error("Selecione um aluno primeiro");
      return;
    }
    setIsAnalyzing(true);
    analyzeStudentMutation.mutate({ studentId: selectedStudent });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500";
      case "urgent": return "bg-orange-500";
      case "warning": return "bg-yellow-500";
      case "info": return "bg-info";
      default: return "bg-gray-500";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "high": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium": return <Info className="h-4 w-4 text-info" />;
      case "low": return <Info className="h-4 w-4 text-gray-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const selectedStudentData = students?.find(s => s.id === selectedStudent);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <PageWrapper className="flex-1">
        <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
          {/* Header Centralizado */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-accent to-accent/80 flex items-center justify-center shadow-lg">
                <Brain className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Análise de Aprendizado com IA
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Monitore comportamento, padrões e evolução dos seus alunos com inteligência artificial
              </p>
            </div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-3 rounded-full border border-blue-400 shadow-sm">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-primary font-semibold">Powered by AI</span>
            </div>
          </div>

          {/* Estatísticas em Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-t-4 border-t-blue-500 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">Total de Alunos</p>
                    <p className="text-4xl font-bold text-slate-900">{classAnalytics?.totalStudents || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-red-500 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">Alertas Críticos</p>
                    <p className="text-4xl font-bold text-slate-900">{alertStats?.critical || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-orange-500 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                    <Target className="h-8 w-8 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">Precisam Atenção</p>
                    <p className="text-4xl font-bold text-slate-900">{classAnalytics?.studentsNeedingAttention || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-yellow-500 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Lightbulb className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">Insights Recentes</p>
                    <p className="text-4xl font-bold text-slate-900">{classAnalytics?.recentInsights?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seleção de Aluno - Layout Horizontal Equilibrado */}
          <Card className="shadow-lg border-2 border-slate-200">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-md">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Análise Individual</CardTitle>
                    <CardDescription>Selecione um aluno para análise detalhada com IA</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Disciplina
                  </label>
                  <Select
                    value={selectedSubject?.toString() || ""}
                    onValueChange={(value) => {
                      setSelectedSubject(Number(value));
                      setSelectedStudent(null);
                    }}
                  >
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Selecione a disciplina..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects && subjects.length > 0 ? (
                        subjects.map((subject: any) => (
                          subject.id ? (
                            <SelectItem key={subject.id} value={subject.id.toString()}>
                              {subject.name}
                            </SelectItem>
                          ) : null
                        ))
                      ) : (
                        <SelectItem value="empty" disabled>Nenhuma disciplina cadastrada</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Selecionar Aluno
                  </label>
                  <Select
                    value={selectedStudent?.toString() || ""}
                    onValueChange={(value) => setSelectedStudent(Number(value))}
                    disabled={!selectedSubject}
                  >
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder={selectedSubject ? "Escolha um aluno..." : "Selecione uma disciplina primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingStudents ? (
                        <SelectItem value="loading" disabled>Carregando...</SelectItem>
                      ) : students && students.length > 0 ? (
                        students.map((student) => (
                          student.id ? (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.fullName}
                            </SelectItem>
                          ) : null
                        ))
                      ) : (
                        <SelectItem value="empty" disabled>Nenhum aluno nesta disciplina</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAnalyzeStudent}
                  disabled={!selectedStudent || isAnalyzing}
                  className="h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md text-black"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Activity className="h-5 w-5 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Analisar com IA
                    </>
                  )}
                </Button>
              </div>

              {selectedStudentData && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-blue-400">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {selectedStudentData.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{selectedStudentData.fullName}</p>
                      <p className="text-sm text-slate-600">Aluno selecionado para análise</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs de Análise - Quando aluno selecionado */}
          {selectedStudent && (
            <Tabs defaultValue="insights" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-14 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger value="insights" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">Insights</span>
                </TabsTrigger>
                <TabsTrigger value="alerts" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Alertas</span>
                </TabsTrigger>
                <TabsTrigger value="patterns" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Padrões</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab: Insights */}
              <TabsContent value="insights" className="mt-6">
                <Card className="shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-yellow-50 to-orange-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                          <Lightbulb className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle>Insights Gerados pela IA</CardTitle>
                          <CardDescription>Recomendações personalizadas baseadas em análise de dados</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {studentInsights?.length || 0} insights
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ScrollArea className="h-[500px] pr-4">
                      {!studentInsights || studentInsights.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Lightbulb className="h-10 w-10 text-slate-400" />
                          </div>
                          <p className="text-slate-500 text-lg font-medium">Nenhum insight disponível</p>
                          <p className="text-sm text-slate-400 mt-2">Clique em "Analisar com IA" para gerar insights</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {studentInsights.map((insight: any) => (
                            <Card key={insight.id} className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    {getPriorityIcon(insight.priority)}
                                    <Badge variant={getPriorityColor(insight.priority) as any} className="text-xs">
                                      {insight.category}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    {new Date(insight.generatedAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-slate-900 mb-2 text-lg">{insight.title}</h4>
                                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{insight.description}</p>
                                {insight.recommendation && (
                                  <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-400 rounded-lg p-4 mb-3">
                                    <div className="flex items-start gap-2">
                                      <ArrowRight className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-semibold text-info mb-1">Recomendação:</p>
                                        <p className="text-sm text-info/80 leading-relaxed">{insight.recommendation}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {insight.status === 'active' && (
                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => dismissInsightMutation.mutate({ insightId: insight.id })}
                                      className="text-xs"
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Dispensar
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Alertas */}
              <TabsContent value="alerts" className="mt-6">
                <Card className="shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle>Alertas do Aluno</CardTitle>
                          <CardDescription>Situações que requerem atenção imediata</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {studentAlerts?.length || 0} alertas
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ScrollArea className="h-[500px] pr-4">
                      {!studentAlerts || studentAlerts.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-10 w-10 text-success" />
                          </div>
                          <p className="text-slate-500 text-lg font-medium">Nenhum alerta ativo</p>
                          <p className="text-sm text-slate-400 mt-2">Este aluno está com bom desempenho</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {studentAlerts.map((alert: any) => (
                            <Card key={alert.id} className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                                    <Badge variant="outline" className="text-xs">
                                      {alert.type}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    {new Date(alert.detectedAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-slate-900 mb-2 text-lg">{alert.title}</h4>
                                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{alert.message}</p>
                                {alert.status === 'active' && (
                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => acknowledgeAlertMutation.mutate({ alertId: alert.id })}
                                      className="text-xs"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Reconhecer
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => resolveAlertMutation.mutate({ alertId: alert.id })}
                                      className="text-xs bg-success hover:bg-success/90"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Resolver
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Padrões */}
              <TabsContent value="patterns" className="mt-6">
                <Card className="shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-accent/10 to-accent/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle>Padrões de Aprendizado</CardTitle>
                          <CardDescription>Comportamentos e tendências identificados ao longo do tempo</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {learningPatterns?.length || 0} padrões
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ScrollArea className="h-[500px] pr-4">
                      {!learningPatterns || learningPatterns.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="h-10 w-10 text-slate-400" />
                          </div>
                          <p className="text-slate-500 text-lg font-medium">Nenhum padrão identificado</p>
                          <p className="text-sm text-slate-400 mt-2">Mais dados são necessários para identificar padrões</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {learningPatterns.map((pattern: any) => {
                            // Traduzir tipos de padrão para português
                            const patternTypeLabels: Record<string, string> = {
                              'learning_pace': 'Ritmo de Aprendizado',
                              'preferred_time': 'Horário Preferido',
                              'difficulty_areas': 'Áreas de Dificuldade',
                              'strength_areas': 'Áreas de Força',
                              'engagement_pattern': 'Padrão de Engajamento',
                              'submission_pattern': 'Padrão de Submissão',
                              'improvement_trend': 'Tendência de Melhoria',
                              'struggle_pattern': 'Padrão de Dificuldade',
                              'consistency': 'Consistência',
                              'collaboration': 'Colaboração'
                            };
                            const patternLabel = patternTypeLabels[pattern.patternType] || pattern.patternType;
                            
                            // Formatar data corretamente
                            const formatDate = (dateValue: any) => {
                              if (!dateValue) return 'Data não disponível';
                              try {
                                const date = new Date(dateValue);
                                if (isNaN(date.getTime())) return 'Data não disponível';
                                return date.toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                });
                              } catch {
                                return 'Data não disponível';
                              }
                            };
                            
                            return (
                              <Card key={pattern.id} className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="pt-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4 text-purple-600" />
                                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                        {patternLabel}
                                      </Badge>
                                      {pattern.confidence && (
                                        <Badge variant="secondary" className="text-xs">
                                          {Math.round(pattern.confidence * 100)}% confiança
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-xs text-slate-500">
                                      {formatDate(pattern.detectedAt || pattern.lastUpdated)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                                    {pattern.patternDescription || 'Padrão identificado pela análise de IA'}
                                  </p>
                                  {pattern.evidence && typeof pattern.evidence === 'object' && (
                                    <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 rounded-lg p-4">
                                      <p className="text-xs font-semibold text-purple-900 mb-1">Evidências:</p>
                                      <p className="text-sm text-purple-700 leading-relaxed">
                                        {typeof pattern.evidence === 'string' 
                                          ? pattern.evidence 
                                          : JSON.stringify(pattern.evidence, null, 2)}
                                      </p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Alertas Gerais da Turma - Quando nenhum aluno selecionado */}
          {!selectedStudent && (
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Alertas Gerais da Turma</CardTitle>
                      <CardDescription>Situações que requerem atenção imediata</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {alerts?.length || 0} alertas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ScrollArea className="h-[500px] pr-4">
                  {!alerts || alerts.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                      </div>
                      <p className="text-slate-500 text-lg font-medium">Nenhum alerta ativo</p>
                      <p className="text-sm text-slate-400 mt-2">Tudo está funcionando bem</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {alerts.map((alert: any) => (
                        <Card key={alert.id} className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                                <Badge variant="outline" className="text-xs">
                                  {alert.type}
                                </Badge>
                                <span className="text-sm text-slate-600 font-medium">
                                  {alert.student?.fullName}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">
                                {new Date(alert.detectedAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <h4 className="font-semibold text-slate-900 mb-2 text-lg">{alert.title}</h4>
                            <p className="text-sm text-slate-600 mb-4 leading-relaxed">{alert.message}</p>
                            {alert.status === 'active' && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => acknowledgeAlertMutation.mutate({ alertId: alert.id })}
                                  className="text-xs"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Reconhecer
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => resolveAlertMutation.mutate({ alertId: alert.id })}
                                  className="text-xs bg-success hover:bg-success/90"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resolver
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </PageWrapper>
    </div>
  );
}

export default LearningAnalytics;
