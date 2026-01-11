import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, CheckCircle2, XCircle, Lightbulb, MessageSquare, FileText, Filter, BookMarked } from "lucide-react";
import { Streamdown } from "streamdown";

export function AnswerNotebook() {
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<"all" | "correct" | "incorrect">("all");

  // Buscar disciplinas matriculadas
  const { data: subjects } = trpc.studentPortal.getEnrolledSubjects.useQuery();

  // Buscar histórico de respostas
  const { data: answerHistory, isLoading } = trpc.studentExercises.getAnswerHistory.useQuery({
    subjectId: selectedSubject,
    status: statusFilter,
    limit: 100,
  });

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
              answerHistory.map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {item.subject.name}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Questão {item.answer.questionNumber}
                          </Badge>
                          {item.answer.isCorrect ? (
                            <Badge className="bg-green-500 hover:bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Correto
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500 hover:bg-red-600">
                              <XCircle className="h-3 w-3 mr-1" />
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
                    {item.answer.correctAnswer && (
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <div className="flex items-start gap-2 mb-2">
                          <FileText className="h-5 w-5 text-slate-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800 mb-2">Enunciado</h4>
                            <div className="text-slate-700">
                              <Streamdown>{item.exercise.questions?.[item.answer.questionNumber - 1]?.question || "Questão não disponível"}</Streamdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sua Resposta */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 mb-2">Sua Resposta</h4>
                          <p className="text-blue-800">{item.answer.studentAnswer}</p>
                        </div>
                      </div>
                    </div>

                    {/* Resposta Correta */}
                    {item.answer.correctAnswer && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-green-900 mb-2">Resposta Correta</h4>
                            <p className="text-green-800">{item.answer.correctAnswer}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Dicas de Estudo */}
                    {item.answer.studyTips && (
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-5 w-5 text-amber-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-amber-900 mb-2">Dicas de Estudo</h4>
                            <div className="text-amber-800 prose prose-sm max-w-none">
                              <Streamdown>{item.answer.studyTips}</Streamdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Feedback da IA */}
                    {item.answer.aiFeedback && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-5 w-5 text-purple-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-purple-900 mb-2">Feedback da IA</h4>
                            <div className="text-purple-800 prose prose-sm max-w-none">
                              <Streamdown>{item.answer.aiFeedback}</Streamdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Explicação Detalhada */}
                    {item.answer.detailedExplanation && (
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <BookOpen className="h-5 w-5 text-indigo-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-indigo-900 mb-2">Explicação Detalhada</h4>
                            <div className="text-indigo-800 prose prose-sm max-w-none">
                              <Streamdown>{item.answer.detailedExplanation}</Streamdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Estratégia de Estudo */}
                    {item.answer.studyStrategy && (
                      <div className="bg-teal-50 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <BookMarked className="h-5 w-5 text-teal-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-teal-900 mb-2">Estratégia de Estudo</h4>
                            <div className="text-teal-800 prose prose-sm max-w-none">
                              <Streamdown>{item.answer.studyStrategy}</Streamdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
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
