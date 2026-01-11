import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  MessageSquare, 
  FileText, 
  Filter, 
  BookMarked,
  Sparkles,
  Loader2,
  Brain,
  Target,
  GraduationCap,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from "lucide-react";
import { Streamdown } from "streamdown";
import { toast as toastFn } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function AnswerNotebook() {
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<"all" | "correct" | "incorrect">("all");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [loadingMaterial, setLoadingMaterial] = useState<Set<number>>(new Set());

  // Buscar disciplinas matriculadas
  const { data: subjects } = trpc.studentPortal.getEnrolledSubjects.useQuery();

  // Buscar histórico de respostas
  const { data: answerHistory, isLoading, refetch: refetchAnswers } = trpc.studentExercises.getAnswerHistory.useQuery({
    subjectId: selectedSubject,
    status: statusFilter,
    limit: 100,
  });

  // Mutation para gerar material de estudo detalhado
  const generateMaterialMutation = trpc.studentReview.generateDetailedStudyMaterial.useMutation({
    onSuccess: (data, variables) => {
      setLoadingMaterial((prev) => {
        const newSet = new Set(prev);
        newSet.delete(variables.answerId);
        return newSet;
      });
      refetchAnswers();
      toastFn.success("✨ Material de estudo gerado com sucesso!");
    },
    onError: (error, variables) => {
      setLoadingMaterial((prev) => {
        const newSet = new Set(prev);
        newSet.delete(variables.answerId);
        return newSet;
      });
      toastFn.error("Erro ao gerar material de estudo. Tente novamente.");
    },
  });

  const handleGenerateMaterial = (item: any) => {
    const answerId = item.answer.id;
    setLoadingMaterial((prev) => new Set(prev).add(answerId));
    
    // Extrair o texto da questão
    const questionText = item.exercise.questions?.[item.answer.questionNumber - 1]?.question || 
                        item.exercise.questions?.[item.answer.questionNumber - 1]?.text ||
                        "Questão não disponível";
    
    generateMaterialMutation.mutate({
      answerId: answerId,
      questionText: questionText,
      studentAnswer: item.answer.studentAnswer,
      correctAnswer: item.answer.correctAnswer,
      questionType: item.answer.questionType || "objective",
      subjectName: item.subject.name,
      moduleName: item.exercise.title,
    });
  };

  const toggleQuestion = (answerId: number) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(answerId)) {
        newSet.delete(answerId);
      } else {
        newSet.add(answerId);
      }
      return newSet;
    });
  };

  // Estatísticas
  const totalAnswers = answerHistory?.length || 0;
  const correctAnswers = answerHistory?.filter(item => item.answer.isCorrect).length || 0;
  const incorrectAnswers = answerHistory?.filter(item => !item.answer.isCorrect).length || 0;
  const accuracyRate = totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(1) : "0";

  return (
    <PageWrapper>
        <div className="container mx-auto py-8 space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <BookMarked className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Caderno de Respostas</h1>
                <p className="text-slate-600">Revise suas respostas com dicas e feedbacks personalizados</p>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Total de Respostas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800">{totalAnswers}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Respostas Corretas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{correctAnswers}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Respostas Incorretas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{incorrectAnswers}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Taxa de Acerto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{accuracyRate}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Disciplina</label>
                <Select
                  value={selectedSubject?.toString() || "all"}
                  onValueChange={(value) => setSelectedSubject(value === "all" ? undefined : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as disciplinas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disciplinas</SelectItem>
                    {subjects?.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as respostas</SelectItem>
                    <SelectItem value="correct">Apenas corretas</SelectItem>
                    <SelectItem value="incorrect">Apenas incorretas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedSubject(undefined);
                    setStatusFilter("all");
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Respostas */}
          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  Carregando histórico de respostas...
                </CardContent>
              </Card>
            ) : answerHistory && answerHistory.length > 0 ? (
              answerHistory.map((item, index) => {
                const isCorrect = item.answer.isCorrect;
                const isExpanded = expandedQuestions.has(item.answer.id);
                const isLoadingMaterial = loadingMaterial.has(item.answer.id);
                const hasMaterial = item.answer.detailedExplanation && item.answer.studyStrategy;

                return (
                  <Card key={index} className={`hover:shadow-lg transition-shadow border-l-4 ${
                    isCorrect ? "border-l-green-500" : "border-l-orange-500"
                  }`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {item.subject.name}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Questão {item.answer.questionNumber}
                            </Badge>
                            {isCorrect ? (
                              <Badge className="bg-green-500 hover:bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Correto
                              </Badge>
                            ) : (
                              <Badge className="bg-orange-500 hover:bg-orange-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Incorreto
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg">{item.exercise.title}</CardTitle>
                          <CardDescription>
                            Respondido em {new Date(item.attempt.completedAt || "").toLocaleDateString("pt-BR")}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Enunciado da questão */}
                      {item.exercise.questions?.[item.answer.questionNumber - 1] && (
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <div className="flex items-start gap-2 mb-2">
                            <FileText className="h-5 w-5 text-slate-600 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-800 mb-2">Enunciado</h4>
                              <div className="text-slate-700">
                                <Streamdown>
                                  {item.exercise.questions[item.answer.questionNumber - 1]?.question || 
                                   item.exercise.questions[item.answer.questionNumber - 1]?.text ||
                                   "Questão não disponível"}
                                </Streamdown>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sua Resposta */}
                      <div className={`p-4 rounded-lg border-2 ${
                        isCorrect ? "bg-green-50 border-green-300" : "bg-orange-50 border-orange-300"
                      }`}>
                        <div className="flex items-start gap-2">
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-orange-600 mt-1 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 mb-2">Sua Resposta</h4>
                            <div className="text-slate-800 bg-white/70 p-3 rounded-md">
                              {item.answer.studentAnswer || <em className="text-slate-500">Não respondida</em>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Resposta Correta */}
                      {item.answer.correctAnswer && (
                        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-900 mb-2">Resposta Correta</h4>
                              <div className="text-blue-800 font-medium bg-white/70 p-3 rounded-md">
                                {item.answer.correctAnswer}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Botão para expandir/recolher material de estudo */}
                      <Collapsible open={isExpanded} onOpenChange={() => toggleQuestion(item.answer.id)}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() => toggleQuestion(item.answer.id)}
                          >
                            <span className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              {isExpanded ? "Ocultar" : "Ver"} Material de Estudo Completo
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </Button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="mt-4">
                          <div className="space-y-4">
                            {/* Botão para gerar material (se ainda não tiver) */}
                            {!hasMaterial && !isLoadingMaterial && (
                              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
                                <div className="flex items-start gap-4">
                                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-6 h-6 text-purple-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-lg font-bold text-purple-900 mb-2">
                                      Gerar Material de Estudo Completo
                                    </h3>
                                    <p className="text-purple-700 mb-4">
                                      Clique no botão abaixo para gerar explicações detalhadas,
                                      estratégias de estudo, recursos complementares e muito mais!
                                    </p>
                                    <Button
                                      onClick={() => handleGenerateMaterial(item)}
                                      className="bg-purple-600 hover:bg-purple-700"
                                    >
                                      <Sparkles className="w-4 h-4 mr-2" />
                                      Gerar Material de Estudo
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Loading do material */}
                            {isLoadingMaterial && (
                              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-lg border-2 border-purple-200 text-center">
                                <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-purple-900 mb-2">
                                  Gerando material de estudo...
                                </h3>
                                <p className="text-purple-700">
                                  A IA está criando explicações detalhadas e recursos personalizados
                                  para você. Isso pode levar alguns segundos.
                                </p>
                              </div>
                            )}

                            {/* Material de Estudo Detalhado */}
                            {hasMaterial && !isLoadingMaterial && (
                              <div className="space-y-4">
                                {/* Explicação Detalhada */}
                                {item.answer.detailedExplanation && (
                                  <div className="p-5 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
                                    <div className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                                      <Brain className="w-6 h-6 text-blue-600" />
                                      Explicação Detalhada
                                    </div>
                                    <div className="text-blue-800 prose prose-sm max-w-none bg-white/60 p-4 rounded-md">
                                      <Streamdown>{item.answer.detailedExplanation}</Streamdown>
                                    </div>
                                  </div>
                                )}

                                {/* Estratégia de Estudo */}
                                {item.answer.studyStrategy && (
                                  <div className="p-5 rounded-lg bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-300">
                                    <div className="text-lg font-bold text-teal-900 mb-4 flex items-center gap-2">
                                      <Target className="w-6 h-6 text-teal-600" />
                                      Estratégia de Estudo
                                    </div>
                                    <div className="text-teal-800 prose prose-sm max-w-none bg-white/60 p-4 rounded-md">
                                      <Streamdown>{item.answer.studyStrategy}</Streamdown>
                                    </div>
                                  </div>
                                )}

                                {/* Dicas de Estudo */}
                                {item.answer.studyTips && (
                                  <div className="p-5 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300">
                                    <div className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                                      <Lightbulb className="w-6 h-6 text-amber-600" />
                                      Dicas de Estudo Personalizadas
                                    </div>
                                    <div className="text-amber-800 prose prose-sm max-w-none bg-white/60 p-4 rounded-md">
                                      <Streamdown>{item.answer.studyTips}</Streamdown>
                                    </div>
                                  </div>
                                )}

                                {/* Feedback da IA */}
                                {item.answer.aiFeedback && (
                                  <div className="p-5 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
                                    <div className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                                      <MessageSquare className="w-6 h-6 text-purple-600" />
                                      Feedback da IA
                                    </div>
                                    <div className="text-purple-800 prose prose-sm max-w-none bg-white/60 p-4 rounded-md">
                                      <Streamdown>{item.answer.aiFeedback}</Streamdown>
                                    </div>
                                  </div>
                                )}

                                {/* Recursos Complementares */}
                                {item.answer.complementaryResources && (
                                  <div className="p-5 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
                                    <div className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                                      <GraduationCap className="w-6 h-6 text-green-600" />
                                      Recursos Complementares
                                    </div>
                                    <div className="text-green-800 prose prose-sm max-w-none bg-white/60 p-4 rounded-md">
                                      <Streamdown>{item.answer.complementaryResources}</Streamdown>
                                    </div>
                                  </div>
                                )}

                                {/* Dicas Rápidas */}
                                {item.answer.quickTips && (
                                  <div className="p-5 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300">
                                    <div className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                                      <Zap className="w-6 h-6 text-orange-600" />
                                      Dicas Rápidas
                                    </div>
                                    <div className="text-orange-800 prose prose-sm max-w-none bg-white/60 p-4 rounded-md">
                                      <Streamdown>{item.answer.quickTips}</Streamdown>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookMarked className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhuma resposta encontrada</h3>
                  <p className="text-slate-500">
                    Complete alguns exercícios para ver seu histórico de respostas aqui.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
    </PageWrapper>
  );
}
