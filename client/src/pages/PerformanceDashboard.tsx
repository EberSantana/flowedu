import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function PerformanceDashboard() {
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  
  const { data: summary, isLoading: loadingSummary } = trpc.learningPath.getPerformanceSummary.useQuery();
  const { data: studentsProgress, isLoading: loadingStudents } = trpc.learningPath.getStudentsProgressBySubject.useQuery(
    { subjectId: selectedSubject! },
    { enabled: !!selectedSubject }
  );

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage === 100) return <Badge className="bg-green-600">Concluído</Badge>;
    if (percentage >= 50) return <Badge className="bg-blue-600">Em Progresso</Badge>;
    if (percentage > 0) return <Badge className="bg-yellow-600">Iniciado</Badge>;
    return <Badge variant="secondary">Não Iniciado</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard de Desempenho</h1>
        <p className="text-muted-foreground">Acompanhe o progresso dos alunos por disciplina</p>
      </div>

      {/* Cards de Resumo */}
      {loadingSummary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Resumo Geral */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Disciplinas</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.length || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary?.reduce((sum, s) => sum + s.totalStudents, 0) || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Média de Progresso</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary && summary.length > 0
                    ? Math.round(summary.reduce((sum, s) => sum + s.avgProgress, 0) / summary.length)
                    : 0}%
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alunos Concluídos</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary?.reduce((sum, s) => sum + s.studentsCompleted, 0) || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Disciplinas */}
          <Card>
            <CardHeader>
              <CardTitle>Progresso por Disciplina</CardTitle>
              <CardDescription>Visão geral do desempenho em cada disciplina</CardDescription>
            </CardHeader>
            <CardContent>
              {summary && summary.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Disciplina</TableHead>
                      <TableHead className="text-center">Alunos</TableHead>
                      <TableHead className="text-center">Concluídos</TableHead>
                      <TableHead className="text-center">Em Progresso</TableHead>
                      <TableHead className="text-center">Não Iniciados</TableHead>
                      <TableHead>Progresso Médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.map((subject) => (
                      <TableRow 
                        key={subject.subjectId} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedSubject(subject.subjectId)}
                      >
                        <TableCell className="font-medium">{subject.subjectName}</TableCell>
                        <TableCell className="text-center">{subject.totalStudents}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-600 font-medium">{subject.studentsCompleted}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-blue-600 font-medium">{subject.studentsInProgress}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-muted-foreground">{subject.studentsNotStarted}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={subject.avgProgress} className="w-24" />
                            <span className="text-sm font-medium">{subject.avgProgress}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma disciplina encontrada.</p>
                  <p className="text-sm">Crie disciplinas e inscreva alunos para ver o progresso.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Detalhes da Disciplina Selecionada */}
      {selectedSubject && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Progresso dos Alunos - {summary?.find(s => s.subjectId === selectedSubject)?.subjectName}
                </CardTitle>
                <CardDescription>Detalhamento do progresso individual de cada aluno</CardDescription>
              </div>
              <Select value={selectedSubject.toString()} onValueChange={(v) => setSelectedSubject(Number(v))}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {summary?.map((subject) => (
                    <SelectItem key={subject.subjectId} value={subject.subjectId.toString()}>
                      {subject.subjectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4">
                    <div className="h-10 w-10 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : studentsProgress && studentsProgress.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead className="text-center">Tópicos</TableHead>
                    <TableHead className="text-center">Concluídos</TableHead>
                    <TableHead className="text-center">Em Progresso</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsProgress.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-medium">{student.studentName}</TableCell>
                      <TableCell className="text-muted-foreground">{student.studentRegistration}</TableCell>
                      <TableCell className="text-center">{student.totalTopics}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-green-600 font-medium">{student.completedTopics}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-blue-600 font-medium">{student.inProgressTopics}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getProgressColor(student.percentage)} transition-all`}
                              style={{ width: `${student.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12">{student.percentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(student.percentage)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum aluno inscrito nesta disciplina.</p>
                <p className="text-sm">Inscreva alunos para acompanhar o progresso.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
