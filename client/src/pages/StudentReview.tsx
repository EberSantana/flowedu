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

export default function StudentReview() {

  // Filtros
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedQuestionType, setSelectedQuestionType] = useState<string | null>(null);

  // Queries
  const { data: subjects, isLoading: loadingSubjects } =
    trpc.subjectGamification.getMySubjects.useQuery();

  const { data: wrongAnswers, isLoading: loadingAnswers, refetch: refetchAnswers } =
    trpc.studentReview.getWrongAnswers.useQuery({
      subjectId: selectedSubject || undefined,
      moduleId: selectedModule || undefined,
      questionType: selectedQuestionType || undefined,
      limit: 20,
    });

  const { data: stats, isLoading: loadingStats } =
    trpc.studentReview.getStats.useQuery({});

  const { data: errorPatterns, isLoading: loadingPatterns } =
    trpc.studentReview.getErrorPatterns.useQuery({});

  // Mutations
  const markAsReviewedMutation = trpc.studentReview.markAsReviewed.useMutation({
    onSuccess: () => {
      refetchAnswers();
      toastFn.success("✅ Questão marcada como revisada! Continue revisando para melhorar seu desempenho.");
    },
  });

  const handleMarkAsReviewed = (answerId: number) => {
    markAsReviewedMutation.mutate({ answerId });
  };

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
                  Revise questões erradas com dicas personalizadas de IA
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {loadingStats ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </>
            ) : (
              <>
                <Card className="border-l-4 border-red-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Questões Erradas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.totalQuestionsReviewed || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Para revisar
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Já Revisadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.totalQuestionsRetaken || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Concluídas
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      Taxa de Melhoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.avgImprovementRate || 0}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Progresso
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-500" />
                      Sessões de Revisão
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.totalSessions || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Realizadas
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Análise de Padrões de Erro */}
          {errorPatterns && errorPatterns.errorsByModule && errorPatterns.errorsByModule.length > 0 && (
            <Card className="mb-8 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <TrendingUp className="h-5 w-5" />
                  Análise de Padrões de Erro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {errorPatterns.errorsByModule.map((pattern: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg border border-orange-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            Módulo: {pattern.moduleName || 'Geral'}
                          </h4>

                          <p className="text-sm text-gray-700">
                            {pattern.count} erro(s) identificado(s)
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                          {pattern.count} erros
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                      <SelectItem value="open">Dissertativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedSubject(null);
                      setSelectedModule(null);
                      setSelectedQuestionType(null);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Questões Erradas */}
          <div className="space-y-6">
            {loadingAnswers ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </>
            ) : wrongAnswers && wrongAnswers.length > 0 ? (
              wrongAnswers.map((answer: any) => (
                <QuestionReviewCard
                  key={answer.id}
                  answer={answer}
                  onMarkAsReviewed={handleMarkAsReviewed}
                />
              ))
            ) : (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="py-16 text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Parabéns! 🎉
                  </h3>
                  <p className="text-gray-600">
                    Você não tem questões erradas para revisar no momento.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

// Componente de Card de Questão
function QuestionReviewCard({
  answer,
  onMarkAsReviewed,
}: {
  answer: any;
  onMarkAsReviewed: (id: number) => void;
}) {
  const [showStudyTips, setShowStudyTips] = useState(false);

  const getStudyTipsMutation = trpc.studentReview.getStudyTips.useMutation();
  const [studyTips, setStudyTips] = useState<any>(null);
  const [loadingTips, setLoadingTips] = useState(false);

  const handleGetTips = async () => {
    setLoadingTips(true);
    setShowStudyTips(true);
    toastFn.info("🤖 Gerando dicas personalizadas... A IA está analisando sua resposta.");
    
    try {
      const result = await getStudyTipsMutation.mutateAsync({
        answerId: answer.id,
        questionText: answer.correctAnswer,
        studentAnswer: answer.studentAnswer,
        correctAnswer: answer.correctAnswer,
        questionType: answer.questionType,
      });
      setStudyTips(result);
      setLoadingTips(false);
    } catch (error) {
      setLoadingTips(false);
      toastFn.error("❌ Erro ao gerar dicas. Tente novamente em alguns instantes.");
    }
  };

  return (
    <Card className="border-l-4 border-red-500 hover:shadow-lg transition-shadow">
      <CardHeader className="bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{answer.exerciseTitle}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Questão {answer.questionNumber}
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {answer.questionType === "multiple_choice"
                  ? "Múltipla Escolha"
                  : "Dissertativa"}
              </Badge>
              {answer.aiScore !== null && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Nota IA: {answer.aiScore}%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Resposta do Aluno */}
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Sua Resposta (Incorreta)
          </h4>
          <p className="text-gray-700">{answer.studentAnswer}</p>
        </div>

        {/* Resposta Correta */}
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Resposta Correta
          </h4>
          <p className="text-gray-700">{answer.correctAnswer}</p>
        </div>

        {/* Feedback da IA (se existir) */}
        {answer.aiFeedback && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Feedback da IA
            </h4>
            <p className="text-gray-700 whitespace-pre-wrap">{answer.aiFeedback}</p>
          </div>
        )}

        {/* Dicas de Estudo */}
        {showStudyTips && studyTips && (
          <div className="mb-4 p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg">
            <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5" />
              Dicas de Estudo Personalizadas
            </h4>

            {/* Explicação do Conceito */}
            <div className="mb-4">
              <h5 className="font-semibold text-purple-800 mb-2">📚 Explicação do Conceito</h5>
              <p className="text-gray-700 leading-relaxed">{studyTips.explanation}</p>
            </div>

            {/* Dicas Práticas */}
            <div className="mb-4">
              <h5 className="font-semibold text-purple-800 mb-2">💡 Dicas Práticas</h5>
              <ul className="space-y-2">
                {studyTips.tips.map((tip: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">{index + 1}.</span>
                    <span className="text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Materiais Complementares */}
            {studyTips.resources && studyTips.resources.length > 0 && (
              <div className="mb-4">
                <h5 className="font-semibold text-purple-800 mb-2">📖 Materiais Complementares</h5>
                <ul className="space-y-2">
                  {studyTips.resources.map((resource: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-purple-600">•</span>
                      <span className="text-gray-700">{resource}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Estratégia de Revisão */}
            {studyTips.strategy && (
              <div className="p-3 bg-white rounded-lg border border-purple-200">
                <h5 className="font-semibold text-purple-800 mb-2">🎯 Estratégia Recomendada</h5>
                <p className="text-gray-700">{studyTips.strategy}</p>
              </div>
            )}
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-3 mt-6">
          {!showStudyTips && (
            <Button
              onClick={handleGetTips}
              disabled={loadingTips}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              {loadingTips ? "Gerando dicas..." : "Obter Dicas de IA"}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => onMarkAsReviewed(answer.id)}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Marcar como Revisada
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
