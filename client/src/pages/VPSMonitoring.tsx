import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Server, Cpu, HardDrive, Network, Activity, Plus, Trash2, Copy, RefreshCw, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import PageWrapper from '@/components/PageWrapper';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useLocation } from 'wouter';
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
  Filler
} from 'chart.js';

// Registrar componentes do Chart.js
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

export default function VPSMonitoring() {
  const [, setLocation] = useLocation();
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerIP, setNewServerIP] = useState('');

  // Queries
  const { data: servers, refetch: refetchServers } = trpc.vps.listServers.useQuery();
  const { data: latestMetric, refetch: refetchMetric } = trpc.vps.getLatestMetric.useQuery(
    { serverId: selectedServerId ?? 0 },
    { enabled: !!selectedServerId, refetchInterval: 60000 } // Atualizar a cada 60s
  );
  const { data: historicalMetrics } = trpc.vps.getMetrics.useQuery(
    { serverId: selectedServerId ?? 0, period: '1h' },
    { enabled: !!selectedServerId }
  );

  // Mutations
  const createServerMutation = trpc.vps.createServer.useMutation({
    onSuccess: (data) => {
      toast.success('Servidor adicionado com sucesso!');
      setIsAddDialogOpen(false);
      setNewServerName('');
      setNewServerIP('');
      refetchServers();
      
      // Copiar token para clipboard
      navigator.clipboard.writeText(data.authToken);
      toast.info('Token copiado para a área de transferência!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar servidor: ' + error.message);
    },
  });

  const deleteServerMutation = trpc.vps.deleteServer.useMutation({
    onSuccess: () => {
      toast.success('Servidor removido com sucesso!');
      if (selectedServerId) {
        setSelectedServerId(null);
      }
      refetchServers();
    },
    onError: (error) => {
      toast.error('Erro ao remover servidor: ' + error.message);
    },
  });

  // Selecionar primeiro servidor automaticamente
  useEffect(() => {
    if (servers && servers.length > 0 && !selectedServerId) {
      setSelectedServerId(servers[0].id);
    }
  }, [servers, selectedServerId]);

  const handleAddServer = () => {
    if (!newServerName.trim() || !newServerIP.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    createServerMutation.mutate({ name: newServerName, ipAddress: newServerIP });
  };

  const handleDeleteServer = (serverId: number) => {
    if (confirm('Tem certeza que deseja remover este servidor?')) {
      deleteServerMutation.mutate({ serverId });
    }
  };

  const selectedServer = servers?.find(s => s.id === selectedServerId);
  const isOnline = latestMetric && (new Date().getTime() - new Date(latestMetric.timestamp).getTime()) < 5 * 60 * 1000; // Online se última métrica < 5min

  // Preparar dados para gráficos
  const chartData = (key: 'cpuPercent' | 'memoryPercent' | 'diskPercent') => {
    if (!historicalMetrics || historicalMetrics.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: key === 'cpuPercent' ? 'CPU (%)' : key === 'memoryPercent' ? 'Memória (%)' : 'Disco (%)',
          data: [],
          borderColor: key === 'cpuPercent' ? 'rgb(59, 130, 246)' : key === 'memoryPercent' ? 'rgb(16, 185, 129)' : 'rgb(245, 158, 11)',
          backgroundColor: key === 'cpuPercent' ? 'rgba(59, 130, 246, 0.1)' : key === 'memoryPercent' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          fill: true,
          tension: 0.4,
        }],
      };
    }

    const sortedMetrics = [...historicalMetrics].reverse();
    return {
      labels: sortedMetrics.map(m => new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })),
      datasets: [{
        label: key === 'cpuPercent' ? 'CPU (%)' : key === 'memoryPercent' ? 'Memória (%)' : 'Disco (%)',
        data: sortedMetrics.map(m => parseFloat(m[key] as string)),
        borderColor: key === 'cpuPercent' ? 'rgb(59, 130, 246)' : key === 'memoryPercent' ? 'rgb(16, 185, 129)' : 'rgb(245, 158, 11)',
        backgroundColor: key === 'cpuPercent' ? 'rgba(59, 130, 246, 0.1)' : key === 'memoryPercent' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
      }],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4">
          {/* Botão Voltar ao Dashboard */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4"
            onClick={() => setLocation('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          
          <Breadcrumb items={[{ label: "Administração" }, { label: "Monitoramento VPS" }]} />
          
          <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Server className="w-8 h-8 text-primary" />
                Monitoramento de Servidores VPS
              </h1>
              <p className="text-gray-600 mt-1">
                Monitore em tempo real o desempenho dos seus servidores
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Servidor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Servidor</DialogTitle>
                  <DialogDescription>
                    Configure um novo servidor VPS para monitoramento
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="server-name">Nome do Servidor</Label>
                    <Input
                      id="server-name"
                      placeholder="Ex: Servidor de Produção"
                      value={newServerName}
                      onChange={(e) => setNewServerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="server-ip">Endereço IP</Label>
                    <Input
                      id="server-ip"
                      placeholder="Ex: 192.168.1.100"
                      value={newServerIP}
                      onChange={(e) => setNewServerIP(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <LoadingButton
                    onClick={handleAddServer}
                    loading={createServerMutation.isPending}
                  >
                    Adicionar
                  </LoadingButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Seletor de Servidor */}
          {servers && servers.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Servidor Selecionado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1 w-full sm:w-auto">
                    <Select
                      value={selectedServerId?.toString()}
                      onValueChange={(value) => setSelectedServerId(parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {servers.map((server: any) => (
                          <SelectItem key={server.id} value={server.id.toString()}>
                            {server.name} ({server.ipAddress})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedServer) {
                          navigator.clipboard.writeText(selectedServer.authToken);
                          toast.success('Token copiado!');
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Token
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchMetric()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectedServerId && handleDeleteServer(selectedServerId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedServerId && latestMetric ? (
            <>
              {/* Cards de Métricas Atuais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* CPU */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-blue-500" />
                        CPU
                      </span>
                      <Badge variant={isOnline ? "default" : "secondary"}>
                        {isOnline ? "Online" : "Offline"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{parseFloat(latestMetric.cpuPercent).toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Load: {latestMetric.loadAverage1 ? parseFloat(latestMetric.loadAverage1).toFixed(2) : 'N/A'}
                    </p>
                  </CardContent>
                </Card>

                {/* Memória */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      Memória
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{parseFloat(latestMetric.memoryPercent).toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatBytes(Number(latestMetric.memoryUsed))} / {formatBytes(Number(latestMetric.memoryTotal))}
                    </p>
                  </CardContent>
                </Card>

                {/* Disco */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-amber-500" />
                      Disco
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{parseFloat(latestMetric.diskPercent).toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatBytes(Number(latestMetric.diskUsed))} / {formatBytes(Number(latestMetric.diskTotal))}
                    </p>
                  </CardContent>
                </Card>

                {/* Rede */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Network className="h-4 w-4 text-purple-500" />
                      Rede
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{formatBytes(Number(latestMetric.networkSent))}/s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{formatBytes(Number(latestMetric.networkRecv))}/s</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico CPU */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-blue-500" />
                      Histórico de CPU
                    </CardTitle>
                    <CardDescription>Últimos 60 minutos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <Line data={chartData('cpuPercent')} options={chartOptions} />
                    </div>
                  </CardContent>
                </Card>

                {/* Gráfico Memória */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      Histórico de Memória
                    </CardTitle>
                    <CardDescription>Últimos 60 minutos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <Line data={chartData('memoryPercent')} options={chartOptions} />
                    </div>
                  </CardContent>
                </Card>

                {/* Gráfico Disco */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-amber-500" />
                      Histórico de Disco
                    </CardTitle>
                    <CardDescription>Últimos 60 minutos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <Line data={chartData('diskPercent')} options={chartOptions} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : servers && servers.length > 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
                <p className="text-lg font-semibold mb-2">Carregando métricas...</p>
                <p className="text-sm text-muted-foreground">
                  Aguardando dados do servidor selecionado
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-semibold mb-2">Nenhum servidor configurado</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione seu primeiro servidor VPS para começar o monitoramento
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeiro Servidor
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </PageWrapper>
    </>
  );
}
