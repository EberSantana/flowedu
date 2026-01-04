import { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, TrendingUp, Users, Award } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend as ChartLegend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  ChartLegend,
  Filler
);

export default function SubjectCTStats() {
  const params = useParams();
  const subjectId = params.id ? parseInt(params.id) : 0;

  const { data: subject } = trpc.subjects.getById.useQuery({ id: subjectId });
  const { data: stats, isLoading } = trpc.computationalThinking.getSubjectStats.useQuery(
    { subjectId },
    { enabled: !!subjectId }
  );

  // Preparar dados para o radar chart
  const radarData = stats ? [
    {
      dimension: 'Decomposição',
      média: stats.classAverage.decomposition,
    },
    {
      dimension: 'Padrões',
      média: stats.classAverage.pattern_recognition,
    },
    {
      dimension: 'Abstração',
      média: stats.classAverage.abstraction,
    },
    {
      dimension: 'Algoritmos',
      média: stats.classAverage.algorithms,
    },
  ] : [];

  // Dimensões em português
  const dimensionNames: Record<string, string> = {
    decomposition: 'Decomposição',
    pattern_recognition: 'Reconhecimento de Padrões',
    abstraction: 'Abstração',
    algorithms: 'Algoritmos',
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <PageWrapper>
        <div className="mb-6">
          <Link href="/subjects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Disciplinas
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Pensamento Computacional
              </h1>
              <p className="text-gray-600">{subject?.name || 'Carregando...'}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Carregando estatísticas...</p>
          </div>
        ) : !stats || stats.students.length === 0 ? (
          <Card className="bg-white shadow-lg">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Nenhum aluno matriculado nesta disciplina ainda.</p>
              <p className="text-sm text-gray-500">
                Matricule alunos para visualizar estatísticas de Pensamento Computacional.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total de Alunos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.students.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Média - Decomposição
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.classAverage.decomposition}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Média - Padrões
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.classAverage.pattern_recognition}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Média - Algoritmos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.classAverage.algorithms}</div>
                </CardContent>
              </Card>
            </div>

            {/* Radar Chart - Média da Turma */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-indigo-600" />
                  Perfil Médio da Turma - 4 Dimensões
                </CardTitle>
                <CardDescription>
                  Visualização das competências médias da turma em Pensamento Computacional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis 
                        dataKey="dimension" 
                        tick={{ fill: '#374151', fontSize: 14, fontWeight: 500 }}
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]} 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <Radar
                        name="Média da Turma"
                        dataKey="média"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.6}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Desempenho Individual */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Desempenho Individual dos Alunos
                </CardTitle>
                <CardDescription>
                  Pontuação de cada aluno nas 4 dimensões do Pensamento Computacional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Aluno
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Matrícula
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Decomposição
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Padrões
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Abstração
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Algoritmos
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Média
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stats.students.map((student) => (
                        <tr key={student.studentId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {student.fullName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.registrationNumber}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-sm font-semibold ${
                              student.decomposition >= 70 ? 'bg-green-100 text-green-700' :
                              student.decomposition >= 40 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {student.decomposition}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-sm font-semibold ${
                              student.pattern_recognition >= 70 ? 'bg-green-100 text-green-700' :
                              student.pattern_recognition >= 40 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {student.pattern_recognition}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-sm font-semibold ${
                              student.abstraction >= 70 ? 'bg-green-100 text-green-700' :
                              student.abstraction >= 40 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {student.abstraction}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-sm font-semibold ${
                              student.algorithms >= 70 ? 'bg-green-100 text-green-700' :
                              student.algorithms >= 40 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {student.algorithms}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-14 h-14 rounded-full text-base font-bold ${
                              student.average >= 70 ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' :
                              student.average >= 40 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white' :
                              'bg-gradient-to-br from-red-500 to-red-600 text-white'
                            }`}>
                              {student.average}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Legenda de Cores */}
            <Card className="bg-white shadow-lg">
              <CardContent className="py-4">
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-gray-700">Excelente (≥ 70)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span className="text-gray-700">Bom (40-69)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-gray-700">Precisa Melhorar (&lt; 40)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </PageWrapper>
    </div>
  );
}
