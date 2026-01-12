import { useState } from "react";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  Users,
  BarChart3,
  Download,
  Eye,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

export default function AssessmentResults() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [, setLocation] = useLocation();
  const [correcting, setCorrecting] = useState<number | null>(null);

  // Queries
  // @ts-ignore
  const { data: assessment, isLoading: loadingAssessment } = trpc.answerSheet.getAssessment.useQuery(
    { assessmentId: parseInt(assessmentId!) },
    { enabled: !!assessmentId }
  );

  // @ts-ignore
  const { data: answerSheets, isLoading: loadingSheets, refetch } = trpc.answerSheet.listAnswerSheets.useQuery(
    { assessmentId: parseInt(assessmentId!) },
    { enabled: !!assessmentId }
  );

  // Mutations
  // @ts-ignore
  const correctMutation = trpc.answerSheet.correctAnswerSheet.useMutation({
    onSuccess: (result) => {
      toast.success("Correção concluída!", {
        description: `Nota: ${result.totalScore} pontos (${result.percentageScore.toFixed(1)}%)`
      });
      refetch();
      setCorrecting(null);
    },
    onError: (error: any) => {
      toast.error("Erro na correção", { description: error.message });
      setCorrecting(null);
    }
  });

  const handleCorrect = (answerSheetId: number) => {
    setCorrecting(answerSheetId);
    correctMutation.mutate({ answerSheetId });
  };

  const handleCorrectAll = () => {
    const pendingSheets = answerSheets?.filter((s: any) => s.status === 'submitted');
    if (!pendingSheets?.length) {
      toast.info("Não há cadernos pendentes de correção");
      return;
    }
    
    pendingSheets.forEach((sheet: any) => {
      correctMutation.mutate({ answerSheetId: sheet.id });
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-gray-100">Não Iniciado</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-500">Em Andamento</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-600">Aguardando Correção</Badge>;
      case 'corrected':
        return <Badge className="bg-green-600">Corrigido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const isLoading = loadingAssessment || loadingSheets;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Estatísticas
  const stats = {
    total: answerSheets?.length || 0,
    pending: answerSheets?.filter((s: any) => s.status === 'pending').length || 0,
    inProgress: answerSheets?.filter((s: any) => s.status === 'in_progress').length || 0,
    submitted: answerSheets?.filter((s: any) => s.status === 'submitted').length || 0,
    corrected: answerSheets?.filter((s: any) => s.status === 'corrected').length || 0,
  };

  const correctedSheets = answerSheets?.filter((s: any) => s.status === 'corrected') || [];
  const avgScore = correctedSheets.length > 0
    ? correctedSheets.reduce((sum: number, s: any) => sum + (s.percentageScore || 0), 0) / correctedSheets.length
    : 0;
  const passRate = correctedSheets.length > 0
    ? (correctedSheets.filter((s: any) => s.percentageScore >= (assessment?.passingScore || 60)).length / correctedSheets.length) * 100
    : 0;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => setLocation("/assessments")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Resultados: {assessment?.title}
            </h1>
            <p className="text-gray-600">
              {assessment?.subjectName} • {assessment?.totalQuestions} questões
            </p>
          </div>
          
          {stats.submitted > 0 && (
            <Button onClick={handleCorrectAll} className="bg-green-600 hover:bg-green-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Corrigir Todos ({stats.submitted})
            </Button>
          )}
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                  <p className="text-sm text-gray-600">Em Andamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.submitted}</p>
                  <p className="text-sm text-gray-600">Aguardando</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.corrected}</p>
                  <p className="text-sm text-gray-600">Corrigidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{avgScore.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Média</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo de Desempenho */}
        {correctedSheets.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Resumo de Desempenho</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Taxa de Aprovação</p>
                  <div className="flex items-center gap-2">
                    <Progress value={passRate} className="flex-1 h-3" />
                    <span className="font-bold text-lg">{passRate.toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Média de Acertos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(correctedSheets.reduce((sum: number, s: any) => sum + (s.correctAnswers || 0), 0) / correctedSheets.length).toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Média de Erros</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(correctedSheets.reduce((sum: number, s: any) => sum + (s.wrongAnswers || 0), 0) / correctedSheets.length).toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Média em Branco</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {(correctedSheets.reduce((sum: number, s: any) => sum + (s.blankAnswers || 0), 0) / correctedSheets.length).toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cadernos de Respostas</CardTitle>
          </CardHeader>
          <CardContent>
            {answerSheets?.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhum caderno encontrado
                </h3>
                <p className="text-gray-500">
                  Os alunos ainda não iniciaram esta avaliação.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Acertos</TableHead>
                    <TableHead className="text-center">Erros</TableHead>
                    <TableHead className="text-center">Branco</TableHead>
                    <TableHead className="text-center">Nota</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {answerSheets?.map((sheet: any) => (
                    <TableRow key={sheet.id}>
                      <TableCell className="font-medium">{sheet.studentName}</TableCell>
                      <TableCell className="font-mono text-sm">{sheet.registrationNumber}</TableCell>
                      <TableCell className="font-mono text-sm">{sheet.sheetCode}</TableCell>
                      <TableCell>{getStatusBadge(sheet.status)}</TableCell>
                      <TableCell className="text-center">
                        {sheet.status === 'corrected' ? (
                          <span className="flex items-center justify-center gap-1 text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            {sheet.correctAnswers}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {sheet.status === 'corrected' ? (
                          <span className="flex items-center justify-center gap-1 text-red-600">
                            <XCircle className="w-4 h-4" />
                            {sheet.wrongAnswers}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {sheet.status === 'corrected' ? (
                          <span className="flex items-center justify-center gap-1 text-gray-600">
                            <MinusCircle className="w-4 h-4" />
                            {sheet.blankAnswers}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {sheet.status === 'corrected' ? (
                          <div>
                            <span className="font-bold text-lg">{sheet.totalScore}</span>
                            <span className="text-gray-500 text-sm">/{assessment?.totalPoints}</span>
                            <p className={`text-xs ${sheet.percentageScore >= (assessment?.passingScore || 60) ? 'text-green-600' : 'text-red-600'}`}>
                              {sheet.percentageScore?.toFixed(1)}%
                            </p>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {sheet.status === 'submitted' && (
                          <Button
                            size="sm"
                            onClick={() => handleCorrect(sheet.id)}
                            disabled={correcting === sheet.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {correcting === sheet.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Corrigir
                              </>
                            )}
                          </Button>
                        )}
                        {sheet.status === 'corrected' && (
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Detalhes
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
