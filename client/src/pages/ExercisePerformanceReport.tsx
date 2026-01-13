import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
  Calendar,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function ExercisePerformanceReport() {
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>();
  const [selectedExercise, setSelectedExercise] = useState<number | undefined>();

  // Buscar disciplinas do professor
  const { data: subjects } = trpc.subjects.list.useQuery();

  // Buscar exercícios da disciplina selecionada
  const { data: exercises, refetch: refetchExercises } = (trpc.teacherExercises as any).listBySubject.useQuery(
    { subjectId: selectedSubject! },
    { enabled: !!selectedSubject }
  );

  // Mutation para deletar exercício
  const deleteExerciseMutation = (trpc.teacherExercises as any).delete.useMutation({
    onSuccess: () => {
      toast.success("Exercício deletado com sucesso!");
      refetchExercises();
    },
    onError: (error: any) => {
      toast.error("Erro ao deletar exercício: " + error.message);
    },
  });

  // Buscar estatísticas gerais
  const { data: stats, isLoading } = (trpc.teacherExercises as any).getStatistics.useQuery(
    {
      subjectId: selectedSubject!,
      exerciseId: selectedExercise,
    },
    { enabled: !!selectedSubject }
  );

  const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

  const handleExportPDF = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <>
        <Sidebar />
        <PageWrapper className="min-h-screen bg-gray-50">
          <div className="container mx-auto py-6 px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando relatório...</p>
              </div>
            </div>
          </div>
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-6 px-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Relatório de Desempenho</h1>
              <p className="text-gray-600 mt-1">
                Análise detalhada do desempenho dos alunos em exercícios
              </p>
            </div>
            <Button onClick={handleExportPDF} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Disciplina</label>
                  <Select
                    value={selectedSubject?.toString()}
                    onValueChange={(value) => {
                      setSelectedSubject(parseInt(value));
                      setSelectedExercise(undefined);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Exercício (opcional)
                  </label>
                  <Select
                    value={selectedExercise?.toString()}
                    onValueChange={(value) => setSelectedExercise(parseInt(value))}
                    disabled={!selectedSubject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os exercícios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os exercícios</SelectItem>
                      {exercises?.map((exercise: any) => (
                        <SelectItem key={exercise.id} value={exercise.id.toString()}>
                          {exercise.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gerenciar Exercícios Publicados */}
          {selectedSubject && exercises && exercises.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Exercícios Publicados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exercises.map((exercise: any) => (
                    <div key={exercise.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{exercise.title}</h4>
                        {exercise.description && (
                          <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {exercise.totalQuestions} questões
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {exercise.status === "published" ? "Publicado" : "Rascunho"}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja deletar o exercício "${exercise.title}"? Esta ação não pode ser desfeita.`)) {
                            deleteExerciseMutation.mutate({ exerciseId: exercise.id });
                          }
                        }}
                        disabled={deleteExerciseMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedSubject ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Selecione uma disciplina para visualizar o relatório</p>
                </div>
              </CardContent>
            </Card>
          ) : !stats ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                  <p className="text-lg font-medium">Nenhum dado disponível</p>
                  <p className="text-sm mt-2">
                    Ainda não há exercícios publicados ou tentativas registradas nesta disciplina.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Cards de Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total de Alunos</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
                      </div>
                      <Users className="w-10 h-10 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Taxa de Conclusão</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {stats.completionRate.toFixed(1)}%
                        </p>
                      </div>
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Média de Acertos</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {stats.averageScore.toFixed(1)}%
                        </p>
                      </div>
                      <Target className="w-10 h-10 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Com Dificuldades</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {stats.studentsWithDifficulties}
                        </p>
                      </div>
                      <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribuição de Notas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição de Notas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.scoreDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {stats.scoreDistribution.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Desempenho por Exercício */}
                <Card>
                  <CardHeader>
                    <CardTitle>Desempenho por Exercício</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.exercisePerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="exerciseTitle" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="averageScore" fill="#3B82F6" name="Média (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Evolução Temporal */}
                {stats.temporalEvolution && stats.temporalEvolution.length > 0 && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Evolução Temporal
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.temporalEvolution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="averageScore"
                            stroke="#3B82F6"
                            name="Média de Acertos (%)"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="completionRate"
                            stroke="#10B981"
                            name="Taxa de Conclusão (%)"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Tabela de Alunos com Dificuldades */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Alunos com Dificuldades (Média &lt; 60%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.studentsWithDifficultiesList &&
                  stats.studentsWithDifficultiesList.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">
                              Aluno
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">
                              Matrícula
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">
                              Tentativas
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">
                              Média
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.studentsWithDifficultiesList.map((student: any) => (
                            <tr key={student.studentId} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">{student.studentName}</td>
                              <td className="py-3 px-4 text-gray-600">
                                {student.registrationNumber}
                              </td>
                              <td className="py-3 px-4 text-center">{student.attempts}</td>
                              <td className="py-3 px-4 text-center">
                                <Badge
                                  className={`${
                                    student.averageScore < 40
                                      ? "bg-red-500"
                                      : student.averageScore < 60
                                      ? "bg-orange-500"
                                      : "bg-yellow-500"
                                  } text-white`}
                                >
                                  {student.averageScore.toFixed(1)}%
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {student.averageScore < 40 ? (
                                  <Badge variant="destructive" className="gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    Crítico
                                  </Badge>
                                ) : (
                                  <Badge className="bg-orange-500 text-white gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Atenção
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p className="font-medium">Nenhum aluno com dificuldades!</p>
                      <p className="text-sm mt-1">
                        Todos os alunos estão com desempenho satisfatório (&gt;= 60%)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tabela de Todos os Alunos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Desempenho Geral dos Alunos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.allStudentsPerformance && stats.allStudentsPerformance.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">
                              Aluno
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">
                              Matrícula
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">
                              Exercícios Concluídos
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">
                              Média Geral
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">
                              Tendência
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.allStudentsPerformance.map((student: any) => (
                            <tr key={student.studentId} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">{student.studentName}</td>
                              <td className="py-3 px-4 text-gray-600">
                                {student.registrationNumber}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {student.completedExercises} / {stats.totalExercises}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge
                                  className={`${
                                    student.averageScore >= 90
                                      ? "bg-green-500"
                                      : student.averageScore >= 70
                                      ? "bg-blue-500"
                                      : student.averageScore >= 60
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  } text-white`}
                                >
                                  {student.averageScore.toFixed(1)}%
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {student.averageScore >= 70 ? (
                                  <TrendingUp className="w-5 h-5 text-green-600 mx-auto" />
                                ) : (
                                  <TrendingDown className="w-5 h-5 text-red-600 mx-auto" />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="font-medium">Nenhum dado disponível</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* CSS para impressão */}
        <style>{`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>
      </PageWrapper>
    </>
  );
}
