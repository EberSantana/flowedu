import { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, TrendingUp, Users, Award, Target, Zap } from "lucide-react";
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
        <div className="max-w-7xl mx-auto py-6 px-4">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/subjects">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Disciplinas
              </Button>
            </Link>
          </div>

          {/* Header Melhorado */}
          <div className="mb-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-1">
                  Estatísticas de Pensamento Computacional
                </h1>
                <p className="text-purple-100 text-lg">
                  {subject?.name || 'Carregando...'}
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Carregando estatísticas...</p>
            </div>
          ) : !stats || stats.students.length === 0 ? (
            <Card className="bg-white shadow-sm border-l-4 border-purple-500">
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
              {/* Cards de Métricas - Grid Melhorado */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Total de Alunos */}
                <Card className="bg-white shadow-md hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total de Alunos
                      </CardTitle>
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{stats.students.length}</div>
                    <p className="text-xs text-gray-500 mt-1">Matriculados na disciplina</p>
                  </CardContent>
                </Card>

                {/* Média - Decomposição */}
                <Card className="bg-white shadow-md hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Média - Decomposição
                      </CardTitle>
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Target className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{stats.classAverage.decomposition}</div>
                    <p className="text-xs text-gray-500 mt-1">Quebra de problemas</p>
                  </CardContent>
                </Card>

                {/* Média - Padrões */}
                <Card className="bg-white shadow-md hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Média - Padrões
                      </CardTitle>
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Award className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{stats.classAverage.pattern_recognition}</div>
                    <p className="text-xs text-gray-500 mt-1">Reconhecimento de padrões</p>
                  </CardContent>
                </Card>

                {/* Média - Algoritmos */}
                <Card className="bg-white shadow-md hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Média - Algoritmos
                      </CardTitle>
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{stats.classAverage.algorithms}</div>
                    <p className="text-xs text-gray-500 mt-1">Resolução de problemas</p>
                  </CardContent>
                </Card>
              </div>

              {/* Radar Chart - Média da Turma */}
              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
                <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-purple-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center shadow-md">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 text-lg">
                        Perfil Médio da Turma - 4 Dimensões
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Visualização das competências médias da turma em Pensamento Computacional
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e5e7eb" strokeWidth={1.5} />
                        <PolarAngleAxis 
                          dataKey="dimension" 
                          tick={{ fill: '#374151', fontSize: 14, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, 100]} 
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <Radar
                          name="Média da Turma"
                          dataKey="média"
                          stroke="#9333ea"
                          strokeWidth={2}
                          fill="#a855f7"
                          fillOpacity={0.5}
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
              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
                <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-purple-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center shadow-md">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 text-lg">
                        Desempenho Individual dos Alunos
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Pontuação de cada aluno nas 4 dimensões do Pensamento Computacional
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Aluno
                          </th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Matrícula
                          </th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Decomposição
                          </th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Padrões
                          </th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Abstração
                          </th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Algoritmos
                          </th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider bg-purple-50">
                            Média
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {stats.students.map((student) => (
                          <tr key={student.studentId} className="hover:bg-purple-50/30 transition-colors">
                            <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                              {student.fullName}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 font-mono">
                              {student.registrationNumber}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-sm font-bold shadow-sm ${
                                student.decomposition >= 70 ? 'bg-green-100 text-green-700 border border-green-200' :
                                student.decomposition >= 40 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {student.decomposition}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-sm font-bold shadow-sm ${
                                student.pattern_recognition >= 70 ? 'bg-green-100 text-green-700 border border-green-200' :
                                student.pattern_recognition >= 40 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {student.pattern_recognition}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-sm font-bold shadow-sm ${
                                student.abstraction >= 70 ? 'bg-green-100 text-green-700 border border-green-200' :
                                student.abstraction >= 40 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {student.abstraction}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-sm font-bold shadow-sm ${
                                student.algorithms >= 70 ? 'bg-green-100 text-green-700 border border-green-200' :
                                student.algorithms >= 40 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {student.algorithms}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center bg-purple-50/30">
                              <span className={`inline-flex items-center justify-center w-14 h-14 rounded-lg text-base font-bold shadow-md ${
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
            </div>
          )}
        </div>
      </PageWrapper>
    </div>
  );
}
