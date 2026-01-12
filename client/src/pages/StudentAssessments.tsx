import { useState } from "react";
import { useLocation } from "wouter";
import StudentLayout from "@/components/StudentLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Clock, 
  Calendar, 
  Search,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  BookOpen,
  Award
} from "lucide-react";

export default function StudentAssessments() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // @ts-ignore
  const { data: assessments, isLoading } = trpc.answerSheet.listAvailableAssessments.useQuery();

  const filteredAssessments = assessments?.filter((a: any) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.subjectName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (assessment: any) => {
    if (!assessment.answerSheetId) {
      return <Badge className="bg-blue-600">Disponível</Badge>;
    }
    switch (assessment.answerSheetStatus) {
      case 'pending':
        return <Badge className="bg-amber-500">Não Iniciado</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-500">Em Andamento</Badge>;
      case 'submitted':
        return <Badge className="bg-purple-600">Enviado</Badge>;
      case 'corrected':
        return <Badge className="bg-green-600">Corrigido</Badge>;
      default:
        return <Badge className="bg-gray-500">Desconhecido</Badge>;
    }
  };

  const getActionButton = (assessment: any) => {
    if (!assessment.answerSheetId || assessment.answerSheetStatus === 'pending') {
      return (
        <Button 
          onClick={() => setLocation(`/student-answer-sheet/${assessment.id}`)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <PlayCircle className="w-4 h-4 mr-2" />
          Iniciar
        </Button>
      );
    }
    if (assessment.answerSheetStatus === 'in_progress') {
      return (
        <Button 
          onClick={() => setLocation(`/student-answer-sheet/${assessment.id}`)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <PlayCircle className="w-4 h-4 mr-2" />
          Continuar
        </Button>
      );
    }
    return (
      <Button 
        variant="outline"
        onClick={() => setLocation(`/student-answer-sheet/${assessment.id}`)}
      >
        <BookOpen className="w-4 h-4 mr-2" />
        Ver Resultado
      </Button>
    );
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando avaliações...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Minhas Avaliações
          </h1>
          <p className="text-gray-600 mt-2">
            Acesse suas provas, simulados e avaliações disponíveis
          </p>
        </div>

        {/* Barra de pesquisa */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar avaliação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de Avaliações */}
        {filteredAssessments?.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhuma avaliação disponível
                </h3>
                <p className="text-gray-500">
                  Quando seu professor publicar uma avaliação, ela aparecerá aqui.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAssessments?.map((assessment: any) => (
              <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {assessment.title}
                        </h3>
                        {getStatusBadge(assessment)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {assessment.subjectName}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {assessment.totalQuestions} questões
                        </span>
                        {assessment.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {assessment.duration} minutos
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          {assessment.totalPoints} pontos
                        </span>
                      </div>

                      {assessment.description && (
                        <p className="text-gray-600 text-sm mb-3">{assessment.description}</p>
                      )}

                      {/* Resultado se corrigido */}
                      {assessment.answerSheetStatus === 'corrected' && assessment.totalScore !== null && (
                        <div className="flex items-center gap-4 mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-semibold">
                              Nota: {assessment.totalScore} / {assessment.totalPoints}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      {getActionButton(assessment)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
