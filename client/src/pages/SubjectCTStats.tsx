import { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, TrendingUp, Users, Award } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <PageWrapper>
        <div className="container mx-auto py-8 px-4">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/subjects">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Disciplinas
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
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
            <Card className="bg-white shadow-md border-l-4 border-indigo-500">
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      Total de Alunos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{stats.students.length}</div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      Média - Decomposição
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{stats.classAverage.decomposition}</div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Award className="h-4 w-4 text-purple-600" />
                      </div>
                      Média - Padrões
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{stats.classAverage.pattern_recognition}</div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-l-4 border-orange-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Brain className="h-4 w-4 text-orange-600" />
                      </div>
                      Média - Algoritmos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{stats.classAverage.algorithms}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Radar Chart - Média da Turma */}
              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-l-4 border-indigo-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Brain className="h-5 w-5 text-indigo-600" />
                    </div>
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
              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-l-4 border-indigo-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
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
                        <tr className="border-b-2 border-gray-200 bg-gray-50">
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
                              <span className={`inline-flex items-center justify-center w-16 h-12 rounded-lg text-sm font-bold ${
                                student.average >= 70 ? 'bg-green-100 text-green-700 border-2 border-green-300' :
                                student.average >= 40 ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' :
                                'bg-red-100 text-red-700 border-2 border-red-300'
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
            </div>
          )}
        </div>
      </PageWrapper>
    </div>
  );
}
