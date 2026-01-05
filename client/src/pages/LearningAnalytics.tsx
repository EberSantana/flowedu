import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

export function LearningAnalytics() {
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<any>(null);

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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <PageWrapper>
        <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
          {/* Header com Gradiente */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-1">
                  Análise de Aprendizado com IA
                </h1>
                <p className="text-purple-100 text-lg">
                  Monitore comportamento, padrões e evolução dos seus alunos
                </p>
              </div>
            </div>
          </div>

          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card className="bg-white shadow-md hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total de Alunos
                  </CardTitle>
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{classAnalytics?.totalStudents || 0}</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-600"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Alertas Críticos
                  </CardTitle>
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {alertStats?.critical || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Precisam Atenção
                  </CardTitle>
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {classAnalytics?.studentsNeedingAttention || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Insights Recentes
                  </CardTitle>
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {classAnalytics?.recentInsights?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seleção de Aluno e Análise */}
          <Card className="bg-white shadow-md border-l-4 border-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                Análise Individual
              </CardTitle>
              <CardDescription>
                Selecione um aluno para gerar análise detalhada com IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Select
                  value={selectedStudent?.toString()}
                  onValueChange={(value) => setSelectedStudent(parseInt(value))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleAnalyzeStudent}
                  disabled={!selectedStudent || isAnalyzing}
                  className="gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analisar com IA
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs com Resultados */}
          {selectedStudent && (
            <Tabs defaultValue="insights" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="insights">
                  Insights ({studentInsights?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="alerts">
                  Alertas ({studentAlerts?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="patterns">
                  Padrões ({learningPatterns?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Tab de Insights */}
              <TabsContent value="insights" className="space-y-4">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3 pr-4">
                    {studentInsights && studentInsights.length > 0 ? (
                      studentInsights.map((insight) => (
                        <Card key={insight.id} className="border-l-4" style={{
                          borderLeftColor: insight.priority === 'critical' ? '#ef4444' :
                            insight.priority === 'high' ? '#f97316' :
                            insight.priority === 'medium' ? '#3b82f6' : '#6b7280'
                        }}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Lightbulb className="h-4 w-4" />
                                  {insight.title}
                                </CardTitle>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant={getPriorityColor(insight.priority)}>
                                    {insight.priority}
                                  </Badge>
                                  <Badge variant="outline">
                                    {insight.insightType}
                                  </Badge>
                                  <Badge variant="secondary">
                                    Confiança: {Math.round(insight.confidence * 100)}%
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => dismissInsightMutation.mutate({ insightId: insight.id })}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                            {insight.actionable && insight.actionSuggestion && (
                              <div className="bg-blue-50 p-3 rounded-md">
                                <p className="text-sm font-medium text-blue-900 mb-1">
                                  💡 Ação Sugerida:
                                </p>
                                <p className="text-sm text-blue-800">{insight.actionSuggestion}</p>
                              </div>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Gerado em {new Date(insight.generatedAt).toLocaleString('pt-BR')}
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center text-gray-500">
                          Nenhum insight disponível. Clique em "Analisar com IA" para gerar.
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Tab de Alertas */}
              <TabsContent value="alerts" className="space-y-4">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3 pr-4">
                    {studentAlerts && studentAlerts.length > 0 ? (
                      studentAlerts.map((alert) => (
                        <Card key={alert.id} className="border-l-4" style={{
                          borderLeftColor: alert.severity === 'critical' ? '#ef4444' :
                            alert.severity === 'urgent' ? '#f97316' :
                            alert.severity === 'warning' ? '#eab308' : '#3b82f6'
                        }}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  {alert.title}
                                </CardTitle>
                                <div className="flex gap-2 mt-2">
                                  <Badge className={getSeverityColor(alert.severity)}>
                                    {alert.severity}
                                  </Badge>
                                  <Badge variant="outline">
                                    {alert.alertType.replace(/_/g, ' ')}
                                  </Badge>
                                  {alert.acknowledged && (
                                    <Badge variant="secondary">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Reconhecido
                                    </Badge>
                                  )}
                                  {alert.resolved && (
                                    <Badge variant="default">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Resolvido
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-gray-700">{alert.message}</p>
                            {alert.recommendedAction && (
                              <div className="bg-orange-50 p-3 rounded-md">
                                <p className="text-sm font-medium text-orange-900 mb-1">
                                  🎯 Ação Recomendada:
                                </p>
                                <p className="text-sm text-orange-800">{alert.recommendedAction}</p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              {!alert.acknowledged && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => acknowledgeAlertMutation.mutate({ alertId: alert.id })}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Reconhecer
                                </Button>
                              )}
                              {!alert.resolved && (
                                <Button
                                  size="sm"
                                  onClick={() => resolveAlertMutation.mutate({ alertId: alert.id })}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Resolver
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              Criado em {new Date(alert.createdAt).toLocaleString('pt-BR')}
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center text-gray-500">
                          Nenhum alerta para este aluno.
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Tab de Padrões */}
              <TabsContent value="patterns" className="space-y-4">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3 pr-4">
                    {learningPatterns && learningPatterns.length > 0 ? (
                      learningPatterns.map((pattern) => (
                        <Card key={pattern.id}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              {pattern.patternType.replace(/_/g, ' ').toUpperCase()}
                            </CardTitle>
                            <Badge variant="secondary">
                              Confiança: {Math.round(pattern.confidence * 100)}%
                            </Badge>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-700">{pattern.patternDescription}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Detectado em {new Date(pattern.detectedAt).toLocaleString('pt-BR')}
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center text-gray-500">
                          Nenhum padrão identificado ainda. Clique em "Analisar com IA" para detectar padrões.
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </PageWrapper>
    </div>
  );
}
