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
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ExercisePerformanceReport() {
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>();
  const [selectedExercise, setSelectedExercise] = useState<number | undefined>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);

  // Buscar disciplinas do professor
  const { data: subjects } = trpc.subjects.list.useQuery();

  // Buscar exercícios da disciplina selecionada
  const { data: exercises, refetch: refetchExercises } = trpc.teacherExercises.listBySubject.useQuery(
    { subjectId: selectedSubject! },
    { enabled: !!selectedSubject }
  );

  // Mutation para deletar exercício
  const deleteExerciseMutation = trpc.teacherExercises.delete.useMutation({
    onSuccess: () => {
      toast.success("Exercício deletado com sucesso!");
      refetchExercises();
    },
    onError: (error: any) => {
      toast.error("Erro ao deletar exercício: " + error.message);
    },
  });

  // Mutation para atualizar exercício
  const updateExerciseMutation = trpc.teacherExercises.update.useMutation({
    onSuccess: () => {
      toast.success("Exercício atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setEditingExercise(null);
      refetchExercises();
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar exercício: " + error.message);
    },
  });

  const handleEditExercise = (exercise: any) => {
    setEditingExercise(exercise);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingExercise) return;
    updateExerciseMutation.mutate({
      exerciseId: editingExercise.id,
      title: editingExercise.title,
      description: editingExercise.description,
      passingScore: editingExercise.passingScore,
      maxAttempts: editingExercise.maxAttempts,
      timeLimit: editingExercise.timeLimit || null,
      showAnswersAfter: editingExercise.showAnswersAfter,
    });
  };

  // Buscar estatísticas gerais
  const { data: stats, isLoading } = trpc.teacherExercises.getStatistics.useQuery(
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
                    value={selectedExercise?.toString() || "all"}
                    onValueChange={(value) => setSelectedExercise(value === "all" ? undefined : parseInt(value))}
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditExercise(exercise)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
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
                          {(stats.averageScore / 10).toFixed(1)}
                          <span className="text-base font-normal text-gray-500 ml-1">/ 10</span>
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
                <Card className="shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-gray-800">Distribuição de Notas</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
                      <div className="w-full lg:w-1/2">
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={stats.scoreDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={3}
                              dataKey="count"
                            >
                              {stats.scoreDistribution.map((_: any, index: number) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={COLORS[index % COLORS.length]}
                                  stroke="#fff"
                                  strokeWidth={2}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#fff', 
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              formatter={(value: any, name: any) => [`${value} alunos`, name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full lg:w-1/2 space-y-3">
                        {stats.scoreDistribution.map((item: any, index: number) => (
                          <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="font-medium text-gray-700">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-gray-900">{item.count}</span>
                              <span className="text-gray-500 text-sm ml-1">alunos</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Desempenho por Exercício */}
                <Card className="shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-gray-800">Desempenho por Exercício</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart 
                        data={stats.exercisePerformance} 
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                        <XAxis 
                          type="number" 
                          domain={[0, 10]} 
                          tickFormatter={(value) => `${value}`}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="exerciseTitle" 
                          width={120}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#374151', fontSize: 12 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: any) => [`${(value / 10).toFixed(1)}`, 'Média (0–10)']}
                          labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                        />
                        <Bar 
                          dataKey="averageScore" 
                          fill="url(#colorGradient)" 
                          radius={[0, 6, 6, 0]}
                          barSize={24}
                        />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#8B5CF6" />
                          </linearGradient>
                        </defs>
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
                    Alunos com Dificuldades (Nota &lt; 6,0)
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
                                  {(student.averageScore / 10).toFixed(1)}
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
                      Todos os alunos estão com desempenho satisfatório (≥ 6,0)
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
                                <span className="text-xs text-gray-500 block">({student.totalAttempts || student.completedExercises} tentativa{(student.totalAttempts || student.completedExercises) !== 1 ? 's' : ''})</span>
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
                                  {(student.averageScore / 10).toFixed(1)}
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

        {/* Modal de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Exercício</DialogTitle>
            </DialogHeader>
            {editingExercise && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Título</Label>
                  <Input
                    id="edit-title"
                    value={editingExercise.title}
                    onChange={(e) =>
                      setEditingExercise({ ...editingExercise, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Descrição</Label>
                  <Textarea
                    id="edit-description"
                    value={editingExercise.description || ""}
                    onChange={(e) =>
                      setEditingExercise({ ...editingExercise, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-passing-score">Nota Mínima (escala 0–10)</Label>
                    <Input
                      id="edit-passing-score"
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={(editingExercise.passingScore / 10).toFixed(1)}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          passingScore: Math.round(parseFloat(e.target.value) * 10),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-max-attempts">Máx. Tentativas</Label>
                    <Input
                      id="edit-max-attempts"
                      type="number"
                      min="1"
                      value={editingExercise.maxAttempts}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          maxAttempts: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-time-limit">Tempo Limite (minutos, 0 = sem limite)</Label>
                  <Input
                    id="edit-time-limit"
                    type="number"
                    min="0"
                    value={editingExercise.timeLimit || 0}
                    onChange={(e) =>
                      setEditingExercise({
                        ...editingExercise,
                        timeLimit: parseInt(e.target.value) || null,
                      })
                    }
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateExerciseMutation.isPending}
              >
                {updateExerciseMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
