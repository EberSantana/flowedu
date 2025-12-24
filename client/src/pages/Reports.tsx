import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { FileDown, Calendar, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Reports() {
  const [period, setPeriod] = useState<'month' | 'semester' | 'year'>('month');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);
  
  const { data: subjects } = trpc.subjects.list.useQuery();
  
  // Calcular datas baseadas no período selecionado
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    
    if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === 'semester') {
      const currentMonth = now.getMonth();
      if (currentMonth < 6) {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 5, 30);
      } else {
        start = new Date(now.getFullYear(), 6, 1);
        end = new Date(now.getFullYear(), 11, 31);
      }
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [period]);
  
  const { data: stats, isLoading } = trpc.reports.getStats.useQuery({
    startDate,
    endDate,
    subjectId: selectedSubjectId,
  });
  
  // Preparar dados para gráfico de barras (por disciplina)
  const barChartData = useMemo(() => {
    if (!stats?.bySubject) return null;
    
    return {
      labels: stats.bySubject.map(s => s.subjectName),
      datasets: [
        {
          label: 'Aulas Dadas',
          data: stats.bySubject.map(s => s.given),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: 'Não Dadas',
          data: stats.bySubject.map(s => s.notGiven),
          backgroundColor: 'rgba(251, 191, 36, 0.8)',
          borderColor: 'rgba(251, 191, 36, 1)',
          borderWidth: 1,
        },
        {
          label: 'Canceladas',
          data: stats.bySubject.map(s => s.cancelled),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [stats]);
  
  // Preparar dados para gráfico de pizza (totais)
  const pieChartData = useMemo(() => {
    if (!stats) return null;
    
    return {
      labels: ['Aulas Dadas', 'Não Dadas', 'Canceladas', 'Pendentes'],
      datasets: [
        {
          data: [stats.given, stats.notGiven, stats.cancelled, stats.pending],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(156, 163, 175, 0.8)',
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(251, 191, 36, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(156, 163, 175, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [stats]);
  
  // Preparar dados para gráfico de linha (progressão mensal)
  const lineChartData = useMemo(() => {
    if (!stats?.byMonth) return null;
    
    return {
      labels: stats.byMonth.map(m => {
        const [year, month] = m.month.split('-');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${monthNames[parseInt(month) - 1]}/${year}`;
      }),
      datasets: [
        {
          label: 'Aulas Dadas',
          data: stats.byMonth.map(m => m.given),
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          tension: 0.4,
        },
        {
          label: 'Não Dadas',
          data: stats.byMonth.map(m => m.notGiven),
          borderColor: 'rgba(251, 191, 36, 1)',
          backgroundColor: 'rgba(251, 191, 36, 0.2)',
          tension: 0.4,
        },
        {
          label: 'Canceladas',
          data: stats.byMonth.map(m => m.cancelled),
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          tension: 0.4,
        },
      ],
    };
  }, [stats]);
  
  const exportToPDF = () => {
    if (!stats) {
      toast.error("Nenhum dado disponível para exportar");
      return;
    }
    
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Relatório de Aulas', 14, 20);
    
    // Período
    doc.setFontSize(12);
    const periodText = period === 'month' ? 'Mês Atual' : period === 'semester' ? 'Semestre Atual' : 'Ano Atual';
    doc.text(`Período: ${periodText}`, 14, 30);
    doc.text(`De ${startDate} até ${endDate}`, 14, 37);
    
    // Resumo Geral
    doc.setFontSize(14);
    doc.text('Resumo Geral', 14, 50);
    
    autoTable(doc, {
      startY: 55,
      head: [['Categoria', 'Quantidade', 'Percentual']],
      body: [
        ['Total de Aulas', stats.total.toString(), '100%'],
        ['Aulas Dadas', stats.given.toString(), `${((stats.given / stats.total) * 100).toFixed(1)}%`],
        ['Não Dadas', stats.notGiven.toString(), `${((stats.notGiven / stats.total) * 100).toFixed(1)}%`],
        ['Canceladas', stats.cancelled.toString(), `${((stats.cancelled / stats.total) * 100).toFixed(1)}%`],
        ['Pendentes', stats.pending.toString(), `${((stats.pending / stats.total) * 100).toFixed(1)}%`],
      ],
    });
    
    // Por Disciplina
    if (stats.bySubject && stats.bySubject.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Detalhamento por Disciplina', 14, 20);
      
      autoTable(doc, {
        startY: 25,
        head: [['Disciplina', 'Total', 'Dadas', 'Não Dadas', 'Canceladas', 'Pendentes']],
        body: stats.bySubject.map(s => [
          s.subjectName,
          s.total.toString(),
          s.given.toString(),
          s.notGiven.toString(),
          s.cancelled.toString(),
          s.pending.toString(),
        ]),
      });
    }
    
    // Por Mês
    if (stats.byMonth && stats.byMonth.length > 0 && period !== 'month') {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Progressão Mensal', 14, 20);
      
      autoTable(doc, {
        startY: 25,
        head: [['Mês', 'Total', 'Dadas', 'Não Dadas', 'Canceladas', 'Pendentes']],
        body: stats.byMonth.map(m => {
          const [year, month] = m.month.split('-');
          const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          return [
            `${monthNames[parseInt(month) - 1]}/${year}`,
            m.total.toString(),
            m.given.toString(),
            m.notGiven.toString(),
            m.cancelled.toString(),
            m.pending.toString(),
          ];
        }),
      });
    }
    
    // Salvar PDF
    const fileName = `relatorio-aulas-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    toast.success("PDF exportado com sucesso!");
  };
  
  return (
    <PageWrapper>
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Relatórios de Aulas
            </h1>
            <p className="text-gray-600 mt-2">
              Visualize estatísticas detalhadas de aulas dadas, não dadas e canceladas
            </p>
          </div>
          
          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Filtros
              </CardTitle>
              <CardDescription>Selecione o período e disciplina para visualizar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período
                  </label>
                  <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Mês Atual</SelectItem>
                      <SelectItem value="semester">Semestre Atual</SelectItem>
                      <SelectItem value="year">Ano Atual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disciplina
                  </label>
                  <Select 
                    value={selectedSubjectId?.toString() || "all"} 
                    onValueChange={(v) => setSelectedSubjectId(v === "all" ? undefined : parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Disciplinas</SelectItem>
                      {subjects?.map(subject => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={exportToPDF}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading || !stats}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Cards de Estatísticas */}
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total de Aulas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500 mt-1">no período</p>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Aulas Dadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">{stats.given}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.total > 0 ? `${((stats.given / stats.total) * 100).toFixed(1)}%` : '0%'}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Não Dadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-yellow-600">{stats.notGiven}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.total > 0 ? `${((stats.notGiven / stats.total) * 100).toFixed(1)}%` : '0%'}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Canceladas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.total > 0 ? `${((stats.cancelled / stats.total) * 100).toFixed(1)}%` : '0%'}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-gray-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-gray-600">{stats.pending}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.total > 0 ? `${((stats.pending / stats.total) * 100).toFixed(1)}%` : '0%'}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Gráfico de Pizza */}
                {pieChartData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Distribuição Geral
                      </CardTitle>
                      <CardDescription>Proporção de aulas por status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] flex items-center justify-center">
                        <Pie data={pieChartData} options={{ maintainAspectRatio: false }} />
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Gráfico de Barras */}
                {barChartData && stats.bySubject.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Por Disciplina
                      </CardTitle>
                      <CardDescription>Comparação entre disciplinas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <Bar 
                          data={barChartData} 
                          options={{ 
                            maintainAspectRatio: false,
                            scales: {
                              x: { stacked: false },
                              y: { stacked: false, beginAtZero: true },
                            },
                          }} 
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Tabela Detalhada por Disciplina */}
              {stats.bySubject && stats.bySubject.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhamento por Disciplina</CardTitle>
                    <CardDescription>Estatísticas completas de cada disciplina</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Disciplina</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Total</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Dadas</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Não Dadas</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Canceladas</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Pendentes</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Taxa de Conclusão</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.bySubject.map((subject) => (
                            <tr key={subject.subjectId} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: subject.subjectColor }}
                                  />
                                  <span className="font-medium">{subject.subjectName}</span>
                                </div>
                              </td>
                              <td className="text-center py-3 px-4">{subject.total}</td>
                              <td className="text-center py-3 px-4 text-green-600 font-semibold">{subject.given}</td>
                              <td className="text-center py-3 px-4 text-yellow-600 font-semibold">{subject.notGiven}</td>
                              <td className="text-center py-3 px-4 text-red-600 font-semibold">{subject.cancelled}</td>
                              <td className="text-center py-3 px-4 text-gray-600">{subject.pending}</td>
                              <td className="text-center py-3 px-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {subject.total > 0 ? `${((subject.given / subject.total) * 100).toFixed(1)}%` : '0%'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Mensagem quando não há dados */}
              {stats.total === 0 && (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nenhuma aula encontrada
                      </h3>
                      <p className="text-gray-600">
                        Não há aulas agendadas para o período selecionado.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando relatórios...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
