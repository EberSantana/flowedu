import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, TrendingUp, BookOpen, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function StudentProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const studentId = parseInt(id || "0");

  const { data: profile, isLoading: profileLoading } = trpc.students.getProfile.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  const { data: attendance, isLoading: attendanceLoading } = trpc.students.getAttendanceHistory.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  const { data: statistics, isLoading: statsLoading } = trpc.students.getStatistics.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  if (profileLoading || attendanceLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando perfil do aluno...</p>
        </div>
      </div>
    );
  }

  if (!profile || !profile.student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Aluno não encontrado</CardTitle>
            <CardDescription>O aluno solicitado não existe ou você não tem permissão para visualizá-lo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/students")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Gerenciar Matrículas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { student, enrollments } = profile;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'justified':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'Presente';
      case 'absent':
        return 'Falta';
      case 'justified':
        return 'Falta Justificada';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-green-600 bg-green-50';
      case 'absent':
        return 'text-red-600 bg-red-50';
      case 'justified':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto py-8 px-4 lg:ml-64">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/students")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Perfil do Aluno</h1>
              <p className="text-gray-600 mt-1">Visualize informações detalhadas e histórico de frequência</p>
            </div>
          </div>
        </div>

        {/* Dados do Aluno */}
        <Card className="mb-6 border-blue-200 bg-white shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-full">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">{student.fullName}</CardTitle>
                <CardDescription className="text-base">
                  Matrícula: <span className="font-semibold text-blue-600">{student.registrationNumber}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Data de Cadastro</p>
                  <p className="font-semibold">{new Date(student.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Taxa de Frequência</p>
                  <p className="font-semibold text-green-600">{statistics?.attendanceRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Turmas Matriculadas</p>
                  <p className="font-semibold text-blue-600">{enrollments.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Estatísticas */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <CardTitle>Estatísticas de Frequência</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {statistics && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Total de Aulas</span>
                    <span className="font-bold text-lg">{statistics.totalClasses}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-700">Presenças</span>
                    <span className="font-bold text-lg text-green-600">{statistics.present}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-gray-700">Faltas</span>
                    <span className="font-bold text-lg text-red-600">{statistics.absent}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-gray-700">Faltas Justificadas</span>
                    <span className="font-bold text-lg text-yellow-600">{statistics.justified}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Turmas Matriculadas */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-green-600" />
                <CardTitle>Turmas Matriculadas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {enrollments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aluno não está matriculado em nenhuma turma</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((enrollment) => (
                    <div
                      key={enrollment.enrollmentId}
                      className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{enrollment.className}</h4>
                          <p className="text-sm text-gray-600">Código: {enrollment.classCode}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Evolução */}
        {attendance && attendance.length > 0 && (
          <Card className="mb-6 border-indigo-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <CardTitle>Evolução de Frequência</CardTitle>
              </div>
              <CardDescription>Visualização da taxa de presença ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div style={{ height: '300px' }}>
                <Line
                  data={{
                    labels: attendance.slice().reverse().map(a => new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
                    datasets: [
                      {
                        label: 'Taxa de Frequência (%)',
                        data: attendance.slice().reverse().map((_, index, arr) => {
                          const upToNow = arr.slice(0, index + 1);
                          const presents = upToNow.filter(a => a.status === 'present').length;
                          return upToNow.length > 0 ? (presents / upToNow.length) * 100 : 0;
                        }),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top' as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.parsed.y.toFixed(1)}%`,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: (value) => `${value}%`,
                        },
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico de Frequência */}
        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-orange-600" />
              <CardTitle>Histórico de Frequência</CardTitle>
            </div>
            <CardDescription>Registro completo de presenças e faltas</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {!attendance || attendance.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nenhum registro de frequência encontrado</p>
                <p className="text-sm mt-2">O histórico aparecerá aqui quando houver registros de presença</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Turma</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendance.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div>
                            <p className="font-medium">{record.className}</p>
                            <p className="text-xs text-gray-500">{record.classCode}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                            {getStatusIcon(record.status)}
                            {getStatusLabel(record.status)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {record.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
