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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Queries
  const { data: students, isLoading: loadingStudents } = trpc.students.list.useQuery();
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
      case "info": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "high": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium": return <Info className="h-4 w-4 text-blue-500" />;
      case "low": return <Info className="h-4 w-4 text-gray-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const selectedStudentData = students?.find(s => s.id === selectedStudent);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar />
      <PageWrapper>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 mb-1">
                  Análise de Aprendizado com IA
                </h1>
                <p className="text-slate-600">
                  Monitore comportamento, padrões e evolução dos seus alunos com inteligência artificial
                </p>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-lg border border-indigo-200">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <span className="text-indigo-700 font-semibold text-sm">Powered by AI</span>
              </div>
            </div>
          </div>

          {/* Estatísticas em Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <BarChart3 className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-slate-600 text-sm font-medium mb-1">Total de Alunos</p>
                <p className="text-3xl font-bold text-slate-900">{classAnalytics?.totalStudents || 0}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <AlertCircle className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-slate-600 text-sm font-medium mb-1">Alertas Críticos</p>
                <p className="text-3xl font-bold text-slate-900">{alertStats?.critical || 0}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                  <Activity className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-slate-600 text-sm font-medium mb-1">Precisam Atenção</p>
                <p className="text-3xl font-bold text-slate-900">{classAnalytics?.studentsNeedingAttention || 0}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Lightbulb className="h-6 w-6 text-yellow-600" />
                  </div>
                  <Sparkles className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-slate-600 text-sm font-medium mb-1">Insights Recentes</p>
                <p className="text-3xl font-bold text-slate-900">{classAnalytics?.recentInsights?.length || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Seleção de Aluno */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Análise Individual</CardTitle>
                  <CardDescription>Selecione um aluno para análise detalhada com IA</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Select
                    value={selectedStudent?.toString() || ""}
                    onValueChange={(value) => setSelectedStudent(Number(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um aluno..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingStudents ? (
                        <SelectItem value="loading" disabled>Carregando...</SelectItem>
                      ) : students && students.length > 0 ? (
                        students.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.fullName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="empty" disabled>Nenhum aluno cadastrado</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAnalyzeStudent}
                  disabled={!selectedStudent || isAnalyzing}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Activity className="mr-2 h-4 w-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Analisar com IA
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs de Análise */}
          {selectedStudent && (
            <Tabs defaultValue="insights" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100">
                <TabsTrigger value="insights" className="data-[state=active]:bg-white">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="alerts" className="data-[state=active]:bg-white">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Alertas
                </TabsTrigger>
                <TabsTrigger value="patterns" className="data-[state=active]:bg-white">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Padrões
                </TabsTrigger>
              </TabsList>

              {/* Tab: Insights */}
              <TabsContent value="insights" className="mt-4">
                <Card className="shadow-sm">
                  <CardHeader className="border-b bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-yellow-600" />
                          Insights Gerados pela IA
                        </CardTitle>
                        <CardDescription>
                          {selectedStudentData?.fullName}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {studentInsights?.length || 0} insights
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ScrollArea className="h-[400px] pr-4">
                      {!studentInsights || studentInsights.length === 0 ? (
                        <div className="text-center py-12">
                          <Lightbulb className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">Nenhum insight disponível ainda</p>
                          <p className="text-sm text-slate-400 mt-1">Clique em "Analisar com IA" para gerar insights</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {studentInsights.map((insight: any) => (
                            <Card key={insight.id} className="border-l-4 border-l-yellow-500 shadow-sm">
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {getPriorityIcon(insight.priority)}
                                    <Badge variant={getPriorityColor(insight.priority) as any}>
                                      {insight.priority}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {insight.category}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    {new Date(insight.generatedAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-slate-900 mb-2">{insight.title}</h4>
                                <p className="text-sm text-slate-600 mb-3">{insight.description}</p>
                                {insight.recommendations && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                    <p className="text-xs font-semibold text-blue-900 mb-1">Recomendações:</p>
                                    <p className="text-xs text-blue-700">{insight.recommendations}</p>
                                  </div>
                                )}
                                {insight.confidence && (
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs text-slate-500">Confiança:</span>
                                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                                      <div
                                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                                        style={{ width: `${insight.confidence}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700">{insight.confidence}%</span>
                                  </div>
                                )}
                                {!insight.dismissed && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => dismissInsightMutation.mutate({ insightId: insight.id })}
                                    className="text-xs"
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Dispensar
                                  </Button>
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
              <TabsContent value="alerts" className="mt-4">
                <Card className="shadow-sm">
                  <CardHeader className="border-b bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          Alertas de Desempenho
                        </CardTitle>
                        <CardDescription>
                          {selectedStudentData?.fullName}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {studentAlerts?.length || 0} alertas
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ScrollArea className="h-[400px] pr-4">
                      {!studentAlerts || studentAlerts.length === 0 ? (
                        <div className="text-center py-12">
                          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                          <p className="text-slate-500">Nenhum alerta ativo</p>
                          <p className="text-sm text-slate-400 mt-1">O aluno está com bom desempenho</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {studentAlerts.map((alert: any) => (
                            <Card key={alert.id} className="border-l-4 border-l-orange-500 shadow-sm">
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                                    <Badge variant="outline" className="text-xs">
                                      {alert.type}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    {new Date(alert.detectedAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-slate-900 mb-2">{alert.title}</h4>
                                <p className="text-sm text-slate-600 mb-3">{alert.message}</p>
                                {alert.metrics && (
                                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
                                    <p className="text-xs font-semibold text-slate-700 mb-1">Métricas:</p>
                                    <pre className="text-xs text-slate-600 whitespace-pre-wrap">
                                      {JSON.stringify(alert.metrics, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  {alert.status === 'active' && (
                                    <>
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
                                        className="text-xs bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Resolver
                                      </Button>
                                    </>
                                  )}
                                  {alert.status === 'acknowledged' && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                      Reconhecido
                                    </Badge>
                                  )}
                                  {alert.status === 'resolved' && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                      Resolvido
                                    </Badge>
                                  )}
                                </div>
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
              <TabsContent value="patterns" className="mt-4">
                <Card className="shadow-sm">
                  <CardHeader className="border-b bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                          Padrões de Aprendizado
                        </CardTitle>
                        <CardDescription>
                          {selectedStudentData?.fullName}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {learningPatterns?.length || 0} padrões
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ScrollArea className="h-[400px] pr-4">
                      {!learningPatterns || learningPatterns.length === 0 ? (
                        <div className="text-center py-12">
                          <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">Nenhum padrão identificado ainda</p>
                          <p className="text-sm text-slate-400 mt-1">Dados insuficientes para análise de padrões</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {learningPatterns.map((pattern: any) => (
                            <Card key={pattern.id} className="border-l-4 border-l-blue-500 shadow-sm">
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                    <Badge variant="outline" className="text-xs">
                                      {pattern.patternType}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    {new Date(pattern.identifiedAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-slate-900 mb-2">{pattern.title}</h4>
                                <p className="text-sm text-slate-600 mb-3">{pattern.description}</p>
                                {pattern.frequency && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    <span className="text-xs text-slate-600">
                                      Frequência: <strong>{pattern.frequency}</strong>
                                    </span>
                                  </div>
                                )}
                                {pattern.impact && (
                                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-purple-900 mb-1">Impacto:</p>
                                    <p className="text-xs text-purple-700">{pattern.impact}</p>
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
            </Tabs>
          )}

          {/* Alertas Gerais da Turma */}
          {!selectedStudent && (
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Alertas Gerais da Turma
                    </CardTitle>
                    <CardDescription>Situações que requerem atenção imediata</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {alerts?.length || 0} alertas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ScrollArea className="h-[400px] pr-4">
                  {!alerts || alerts.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                      <p className="text-slate-500">Nenhum alerta ativo</p>
                      <p className="text-sm text-slate-400 mt-1">Tudo está funcionando bem</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {alerts.map((alert: any) => (
                        <Card key={alert.id} className="border-l-4 border-l-red-500 shadow-sm">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                                <Badge variant="outline" className="text-xs">
                                  {alert.type}
                                </Badge>
                                <span className="text-xs text-slate-600">
                                  {alert.student?.fullName}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">
                                {new Date(alert.detectedAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <h4 className="font-semibold text-slate-900 mb-2">{alert.title}</h4>
                            <p className="text-sm text-slate-600 mb-3">{alert.message}</p>
                            <div className="flex gap-2">
                              {alert.status === 'active' && (
                                <>
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
                                    className="text-xs bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Resolver
                                  </Button>
                                </>
                              )}
                            </div>
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
