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
        <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
          {/* Header Moderno */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-90 rounded-2xl"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
            
            <div className="relative px-8 py-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/30">
                  <Brain className="h-10 w-10 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                    Análise de Aprendizado com IA
                  </h1>
                  <p className="text-indigo-100 text-lg font-medium">
                    Monitore comportamento, padrões e evolução dos seus alunos com inteligência artificial
                  </p>
                </div>
                <div className="hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">
                  <Sparkles className="h-5 w-5 text-yellow-300" />
                  <span className="text-white font-semibold">Powered by AI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas em Grid Moderno */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-500 to-blue-600">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <BarChart3 className="h-8 w-8 text-white/30" />
                </div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total de Alunos</p>
                <p className="text-4xl font-bold text-white">{classAnalytics?.totalStudents || 0}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-red-500 to-red-600">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <AlertCircle className="h-8 w-8 text-white/30" />
                </div>
                <p className="text-red-100 text-sm font-medium mb-1">Alertas Críticos</p>
                <p className="text-4xl font-bold text-white">{alertStats?.critical || 0}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-500 to-orange-600">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <Activity className="h-8 w-8 text-white/30" />
                </div>
                <p className="text-orange-100 text-sm font-medium mb-1">Precisam Atenção</p>
                <p className="text-4xl font-bold text-white">{classAnalytics?.studentsNeedingAttention || 0}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-yellow-500 to-yellow-600">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Lightbulb className="h-6 w-6 text-white" />
                  </div>
                  <Sparkles className="h-8 w-8 text-white/30" />
                </div>
                <p className="text-yellow-100 text-sm font-medium mb-1">Insights Recentes</p>
                <p className="text-4xl font-bold text-white">{classAnalytics?.recentInsights?.length || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Seleção de Aluno - Design Melhorado */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Análise Individual com IA</CardTitle>
                  <CardDescription className="text-base">
                    Selecione um aluno para gerar análise detalhada e personalizada
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Selecione o Aluno
                  </label>
                  <Select
                    value={selectedStudent?.toString()}
                    onValueChange={(value) => setSelectedStudent(parseInt(value))}
                  >
                    <SelectTrigger className="h-12 text-base border-2 hover:border-purple-300 transition-colors">
                      <SelectValue placeholder="Escolha um aluno da lista" />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()} className="text-base py-3">
                          {student.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleAnalyzeStudent}
                    disabled={!selectedStudent || isAnalyzing}
                    size="lg"
                    className="h-12 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isAnalyzing ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Analisar com IA
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {selectedStudentData && (
                <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {selectedStudentData.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedStudentData.fullName}</p>
                      <p className="text-sm text-gray-600">Matrícula: {selectedStudentData.registrationNumber}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs com Resultados - Design Melhorado */}
          {selectedStudent && (
            <Card className="border-0 shadow-lg bg-white">
              <Tabs defaultValue="insights" className="w-full">
                <div className="border-b bg-gray-50 px-6 pt-4">
                  <TabsList className="grid w-full max-w-2xl grid-cols-3 h-12 bg-white border shadow-sm">
                    <TabsTrigger value="insights" className="text-base font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Insights ({studentInsights?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="text-base font-medium data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Alertas ({studentAlerts?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="patterns" className="text-base font-medium data-[state=active]:bg-green-600 data-[state=active]:text-white">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Padrões ({learningPatterns?.length || 0})
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab de Insights */}
                <TabsContent value="insights" className="p-6">
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {studentInsights && studentInsights.length > 0 ? (
                        studentInsights.map((insight) => (
                          <Card key={insight.id} className="border-l-4 shadow-md hover:shadow-lg transition-all duration-300" style={{
                            borderLeftColor: insight.priority === 'critical' ? '#ef4444' :
                              insight.priority === 'high' ? '#f97316' :
                              insight.priority === 'medium' ? '#3b82f6' : '#6b7280'
                          }}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    {getPriorityIcon(insight.priority)}
                                    <CardTitle className="text-lg font-semibold text-gray-900">
                                      {insight.title}
                                    </CardTitle>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant={getPriorityColor(insight.priority)} className="text-xs font-semibold">
                                      {insight.priority.toUpperCase()}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {insight.insightType}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      Confiança: {Math.round(insight.confidence * 100)}%
                                    </Badge>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => dismissInsightMutation.mutate({ insightId: insight.id })}
                                  className="hover:bg-red-50 hover:text-red-600"
                                >
                                  <XCircle className="h-5 w-5" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <p className="text-base text-gray-700 leading-relaxed">{insight.description}</p>
                              {insight.actionable && insight.actionSuggestion && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <Lightbulb className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-blue-900 mb-1">
                                        Ação Sugerida
                                      </p>
                                      <p className="text-sm text-blue-800 leading-relaxed">{insight.actionSuggestion}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                                <Clock className="h-3 w-3" />
                                Gerado em {new Date(insight.generatedAt).toLocaleString('pt-BR')}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Card className="border-2 border-dashed">
                          <CardContent className="py-16 text-center">
                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                              <Lightbulb className="h-8 w-8 text-purple-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-900 mb-2">Nenhum insight disponível</p>
                            <p className="text-gray-600">Clique em "Analisar com IA" para gerar insights personalizados</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Tab de Alertas */}
                <TabsContent value="alerts" className="p-6">
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {studentAlerts && studentAlerts.length > 0 ? (
                        studentAlerts.map((alert) => (
                          <Card key={alert.id} className="border-l-4 shadow-md hover:shadow-lg transition-all duration-300" style={{
                            borderLeftColor: alert.severity === 'critical' ? '#ef4444' :
                              alert.severity === 'urgent' ? '#f97316' :
                              alert.severity === 'warning' ? '#eab308' : '#3b82f6'
                          }}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                    <CardTitle className="text-lg font-semibold text-gray-900">
                                      {alert.title}
                                    </CardTitle>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge className={`${getSeverityColor(alert.severity)} text-white text-xs font-semibold`}>
                                      {alert.severity.toUpperCase()}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {alert.alertType.replace(/_/g, ' ')}
                                    </Badge>
                                    {alert.acknowledged && (
                                      <Badge variant="secondary" className="text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Reconhecido
                                      </Badge>
                                    )}
                                    {alert.resolved && (
                                      <Badge className="bg-green-600 text-white text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Resolvido
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <p className="text-base text-gray-700 leading-relaxed">{alert.message}</p>
                              {alert.recommendedAction && (
                                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-100">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <Target className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-orange-900 mb-1">
                                        Ação Recomendada
                                      </p>
                                      <p className="text-sm text-orange-800 leading-relaxed">{alert.recommendedAction}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 pt-2">
                                {!alert.acknowledged && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => acknowledgeAlertMutation.mutate({ alertId: alert.id })}
                                    className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Reconhecer
                                  </Button>
                                )}
                                {!alert.resolved && (
                                  <Button
                                    size="sm"
                                    onClick={() => resolveAlertMutation.mutate({ alertId: alert.id })}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Marcar como Resolvido
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                                <Clock className="h-3 w-3" />
                                Criado em {new Date(alert.createdAt).toLocaleString('pt-BR')}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Card className="border-2 border-dashed">
                          <CardContent className="py-16 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                              <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-900 mb-2">Nenhum alerta ativo</p>
                            <p className="text-gray-600">Este aluno não possui alertas no momento</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Tab de Padrões */}
                <TabsContent value="patterns" className="p-6">
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {learningPatterns && learningPatterns.length > 0 ? (
                        learningPatterns.map((pattern) => (
                          <Card key={pattern.id} className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all duration-300">
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                  <TrendingUp className="h-5 w-5 text-green-600" />
                                </div>
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                  {pattern.patternType.replace(/_/g, ' ').toUpperCase()}
                                </CardTitle>
                              </div>
                              <Badge variant="secondary" className="w-fit">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Confiança: {Math.round(pattern.confidence * 100)}%
                              </Badge>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <p className="text-base text-gray-700 leading-relaxed">{pattern.patternDescription}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                                <Clock className="h-3 w-3" />
                                Detectado em {new Date(pattern.detectedAt).toLocaleString('pt-BR')}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Card className="border-2 border-dashed">
                          <CardContent className="py-16 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                              <TrendingUp className="h-8 w-8 text-green-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-900 mb-2">Nenhum padrão identificado</p>
                            <p className="text-gray-600">Clique em "Analisar com IA" para detectar padrões de aprendizado</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </Card>
          )}
        </div>
      </PageWrapper>
    </div>
  );
}
