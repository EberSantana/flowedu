import { useState } from "react";
import { trpc } from "@/lib/trpc";
import StudentLayout from "@/components/StudentLayout";
import {
  BookOpen,
  Filter,
  Lightbulb,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
  GraduationCap,
  Brain,
  ListChecks,
  FileText,
  Zap,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast as toastFn } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function StudentReview() {
  // Filtros
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedQuestionType, setSelectedQuestionType] = useState<string | null>(null);
  
  // Estado para controlar questões expandidas
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  
  // Estado para controlar carregamento de material de estudo
  const [loadingMaterial, setLoadingMaterial] = useState<Set<number>>(new Set());

  // Queries
  const { data: subjects, isLoading: loadingSubjects } =
    trpc.subjectGamification.getMySubjects.useQuery();

  const { data: allAnswers, isLoading: loadingAnswers, refetch: refetchAnswers } =
    trpc.studentReview.getAllAnswersForReview.useQuery({
      subjectId: selectedSubject || undefined,
      moduleId: selectedModule || undefined,
      questionType: selectedQuestionType || undefined,
      limit: 100,
    });

  const { data: stats, isLoading: loadingStats } =
    trpc.studentReview.getStats.useQuery({});

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

  const handleGenerateMaterial = (answer: any) => {
    setLoadingMaterial((prev) => new Set(prev).add(answer.id));
    generateMaterialMutation.mutate({
      answerId: answer.id,
      questionText: answer.questionText || answer.question,
      studentAnswer: answer.studentAnswer,
      correctAnswer: answer.correctAnswer,
      questionType: answer.questionType,
      subjectName: answer.subjectName,
      moduleName: answer.moduleName,
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

  // Mapeamento de tipos para labels
  const typeLabels: Record<string, string> = {
    multiple_choice: "Múltipla Escolha",
    true_false: "Verdadeiro/Falso",
    fill_blank: "Preencher Lacunas",
    open: "Dissertativa",
    objective: "Múltipla Escolha",
    subjective: "Dissertativa",
    other: "Outros",
  };

  // Agrupar questões por tipo
  const groupedQuestions =
    allAnswers?.reduce((acc: any, answer: any) => {
      const type = answer.questionType || "other";
      if (!acc[type]) acc[type] = [];
      acc[type].push(answer);
      return acc;
    }, {}) || {};

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Revisão Inteligente</h1>
                <p className="text-purple-100 mt-1">
                  Material de estudo completo para cada questão dos seus exercícios
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4 max-w-7xl">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {loadingStats ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </>
            ) : (
              <>
                <Card className="border-l-4 border-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                      Total de Questões
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {allAnswers?.length || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Disponíveis para revisão</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Tempo de Estudo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.totalStudyTime || 0}min
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Tempo total investido</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Sessões de Revisão
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.totalSessions || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Sessões completas</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Filtros */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Disciplina
                  </label>
                  <Select
                    value={selectedSubject?.toString() || "all"}
                    onValueChange={(value) =>
                      setSelectedSubject(value === "all" ? null : parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as disciplinas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as disciplinas</SelectItem>
                      {subjects?.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tipo de Questão
                  </label>
                  <Select
                    value={selectedQuestionType || "all"}
                    onValueChange={(value) =>
                      setSelectedQuestionType(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                      <SelectItem value="objective">Múltipla Escolha</SelectItem>
                      <SelectItem value="true_false">Verdadeiro/Falso</SelectItem>
                      <SelectItem value="open">Dissertativa</SelectItem>
                      <SelectItem value="subjective">Dissertativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSubject(null);
                      setSelectedModule(null);
                      setSelectedQuestionType(null);
                    }}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Questões */}
          {loadingAnswers ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : allAnswers && allAnswers.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="py-20 text-center">
                <div className="mx-auto w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-8 shadow-inner">
                  <BookOpen className="w-14 h-14 text-gray-400" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-gray-900">
                  Nenhuma questão para revisar
                </h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto">
                  Complete alguns exercícios para ter questões disponíveis para revisão.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-purple-600" />
                  Material de Estudo Completo
                </h2>
                <p className="text-gray-600 text-base">
                  Clique em cada questão para ver explicações detalhadas, estratégias de estudo e recursos complementares
                </p>
              </div>

              {allAnswers?.map((answer: any, index: number) => {
                const isCorrect = answer.isCorrect;
                const isExpanded = expandedQuestions.has(answer.id);
                const isLoadingMaterial = loadingMaterial.has(answer.id);
                const hasMaterial = answer.detailedExplanation && answer.studyStrategy;

                return (
                  <Card
                    key={answer.id}
                    className={`border-l-4 shadow-lg ${
                      isCorrect
                        ? "border-l-green-500 bg-green-50/20"
                        : "border-l-orange-500 bg-orange-50/20"
                    }`}
                  >
                    <CardHeader className="bg-white/90 pb-4">
                      <div className="flex items-start gap-4">
                        {/* Número da questão */}
                        <div
                          className={`flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg flex-shrink-0 ${
                            isCorrect ? "bg-green-600" : "bg-orange-600"
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div className="flex-1">
                          {/* Badges de status */}
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {isCorrect ? (
                              <Badge className="bg-green-100 text-green-800 border border-green-300 px-3 py-1">
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Acertou
                              </Badge>
                            ) : (
                              <Badge className="bg-orange-100 text-orange-800 border border-orange-300 px-3 py-1">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Errou
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-gray-600">
                              {typeLabels[answer.questionType] || "Outro"}
                            </Badge>
                            {answer.subjectName && (
                              <Badge variant="outline" className="text-blue-600">
                                {answer.subjectName}
                              </Badge>
                            )}
                          </div>

                          {/* Enunciado da questão */}
                          <CardTitle className="text-xl font-bold text-gray-900 leading-relaxed mb-4">
                            {answer.questionText || answer.question}
                          </CardTitle>

                          {/* Botão para expandir/recolher */}
                          <Collapsible open={isExpanded} onOpenChange={() => toggleQuestion(answer.id)}>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-between"
                                onClick={() => toggleQuestion(answer.id)}
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

                            <CollapsibleContent className="mt-6">
                              <CardContent className="pt-0 space-y-6">
                                {/* Respostas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div
                                    className={`p-5 rounded-lg border-2 ${
                                      isCorrect
                                        ? "bg-green-50 border-green-300"
                                        : "bg-orange-50 border-orange-300"
                                    }`}
                                  >
                                    <div className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                      {isCorrect ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                      ) : (
                                        <AlertCircle className="w-5 h-5 text-orange-600" />
                                      )}
                                      Sua resposta:
                                    </div>
                                    <div className="text-gray-900 text-base leading-relaxed bg-white/70 p-4 rounded-md">
                                      {answer.studentAnswer || (
                                        <em className="text-gray-500">Não respondida</em>
                                      )}
                                    </div>
                                  </div>

                                  <div className="p-5 rounded-lg border-2 bg-blue-50 border-blue-300">
                                    <div className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                      Resposta correta:
                                    </div>
                                    <div className="text-gray-900 text-base leading-relaxed font-medium bg-white/70 p-4 rounded-md">
                                      {answer.correctAnswer}
                                    </div>
                                  </div>
                                </div>

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
                                          onClick={() => handleGenerateMaterial(answer)}
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
                                  <div className="space-y-6">
                                    {/* Explicação Detalhada */}
                                    {answer.detailedExplanation && (
                                      <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
                                        <div className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                                          <Brain className="w-6 h-6 text-blue-600" />
                                          Explicação Detalhada do Conceito
                                        </div>
                                        <div className="text-gray-800 text-base leading-relaxed bg-white/60 p-5 rounded-md whitespace-pre-wrap">
                                          {answer.detailedExplanation}
                                        </div>
                                      </div>
                                    )}

                                    {/* Estratégia de Estudo */}
                                    {answer.studyStrategy && (
                                      <div className="p-6 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
                                        <div className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                                          <Target className="w-6 h-6 text-green-600" />
                                          Como Estudar Este Tópico
                                        </div>
                                        <div className="text-gray-800 text-base leading-relaxed bg-white/60 p-5 rounded-md whitespace-pre-wrap">
                                          {answer.studyStrategy}
                                        </div>
                                      </div>
                                    )}

                                    {/* Conceitos Relacionados */}
                                    {answer.relatedConcepts && (
                                      <div className="p-6 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
                                        <div className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                                          <ListChecks className="w-6 h-6 text-purple-600" />
                                          Conceitos Relacionados para Revisar
                                        </div>
                                        <div className="space-y-2">
                                          {JSON.parse(answer.relatedConcepts).map(
                                            (concept: string, idx: number) => (
                                              <div
                                                key={idx}
                                                className="flex items-start gap-3 bg-white/60 p-4 rounded-md"
                                              >
                                                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                  <span className="text-xs font-bold text-purple-700">
                                                    {idx + 1}
                                                  </span>
                                                </div>
                                                <span className="text-gray-800 text-base leading-relaxed">
                                                  {concept}
                                                </span>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Recursos Complementares */}
                                    {answer.additionalResources && (
                                      <div className="p-6 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300">
                                        <div className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                                          <BookOpen className="w-6 h-6 text-amber-600" />
                                          Recursos Complementares
                                        </div>
                                        <div className="space-y-3">
                                          {JSON.parse(answer.additionalResources).map(
                                            (resource: any, idx: number) => (
                                              <div
                                                key={idx}
                                                className="bg-white/60 p-4 rounded-md border-l-4 border-amber-400"
                                              >
                                                <div className="flex items-start gap-3">
                                                  <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                                    {resource.type}
                                                  </Badge>
                                                  <div className="flex-1">
                                                    <div className="font-semibold text-gray-900 mb-1">
                                                      {resource.title}
                                                    </div>
                                                    <div className="text-gray-700 text-sm">
                                                      {resource.description}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Exemplos Práticos */}
                                    {answer.practiceExamples && (
                                      <div className="p-6 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-300">
                                        <div className="text-lg font-bold text-cyan-900 mb-4 flex items-center gap-2">
                                          <Zap className="w-6 h-6 text-cyan-600" />
                                          Exemplos Práticos para Praticar
                                        </div>
                                        <div className="space-y-3">
                                          {JSON.parse(answer.practiceExamples).map(
                                            (example: string, idx: number) => (
                                              <div
                                                key={idx}
                                                className="bg-white/60 p-4 rounded-md border-l-4 border-cyan-400"
                                              >
                                                <div className="flex items-start gap-3">
                                                  <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-bold text-cyan-700">
                                                      {idx + 1}
                                                    </span>
                                                  </div>
                                                  <span className="text-gray-800 text-base leading-relaxed flex-1">
                                                    {example}
                                                  </span>
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Erros Comuns */}
                                    {answer.commonMistakes && (
                                      <div className="p-6 rounded-lg bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300">
                                        <div className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                                          <AlertCircle className="w-6 h-6 text-red-600" />
                                          Erros Comuns e Como Evitá-los
                                        </div>
                                        <div className="space-y-3">
                                          {JSON.parse(answer.commonMistakes).map(
                                            (mistake: string, idx: number) => (
                                              <div
                                                key={idx}
                                                className="bg-white/60 p-4 rounded-md border-l-4 border-red-400"
                                              >
                                                <div className="flex items-start gap-3">
                                                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                                  </div>
                                                  <span className="text-gray-800 text-base leading-relaxed flex-1">
                                                    {mistake}
                                                  </span>
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Tempo Estimado e Dicas de Memorização */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {answer.timeToMaster && (
                                        <div className="p-5 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
                                          <div className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-indigo-600" />
                                            Tempo Estimado para Domínio
                                          </div>
                                          <div className="text-3xl font-bold text-indigo-700">
                                            {answer.timeToMaster} minutos
                                          </div>
                                          <p className="text-sm text-indigo-600 mt-2">
                                            Tempo recomendado de estudo dedicado
                                          </p>
                                        </div>
                                      )}

                                      {answer.reviewCount !== undefined && (
                                        <div className="p-5 rounded-lg bg-gradient-to-br from-teal-50 to-green-50 border-2 border-teal-300">
                                          <div className="text-sm font-bold text-teal-900 mb-3 flex items-center gap-2">
                                            <RefreshCw className="w-5 h-5 text-teal-600" />
                                            Vezes Revisadas
                                          </div>
                                          <div className="text-3xl font-bold text-teal-700">
                                            {answer.reviewCount}
                                          </div>
                                          <p className="text-sm text-teal-600 mt-2">
                                            Continue revisando para fixar!
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
