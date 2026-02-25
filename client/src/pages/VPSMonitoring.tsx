import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Server, Cpu, HardDrive, Network, Activity, Plus, Trash2, Bell, Copy, RefreshCw } from 'lucide-react';
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
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerIP, setNewServerIP] = useState('');

  // Queries
  const { data: servers, refetch: refetchServers } = trpc.vps.listServers.useQuery();
  const { data: latestMetric, refetch: refetchMetric } = trpc.vps.getLatestMetric.useQuery(
    { serverId: selectedServerId! },
    { enabled: !!selectedServerId, refetchInterval: 60000 } // Atualizar a cada 60s
  );
  const { data: historicalMetrics } = trpc.vps.getMetrics.useQuery(
    { serverId: selectedServerId!, limit: 60 },
    { enabled: !!selectedServerId, refetchInterval: 60000 }
  );
  const { data: alerts } = trpc.vps.getAlerts.useQuery(
    { serverId: selectedServerId! },
    { enabled: !!selectedServerId }
  );

  // Mutations
  const createServerMutation = trpc.vps.createServer.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Servidor adicionado',
        description: 'Token gerado com sucesso. Copie e configure no agente VPS.',
      });
      refetchServers();
      setIsAddDialogOpen(false);
      setNewServerName('');
      setNewServerIP('');
      // Copiar token para clipboard
      navigator.clipboard.writeText(data.token);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar servidor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteServerMutation = trpc.vps.deleteServer.useMutation({
    onSuccess: () => {
      toast({
        title: 'Servidor removido',
        description: 'O servidor foi removido com sucesso.',
      });
      refetchServers();
      setSelectedServerId(null);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover servidor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createAlertMutation = trpc.vps.createAlert.useMutation({
    onSuccess: () => {
      toast({
        title: 'Alerta criado',
        description: 'O alerta foi configurado com sucesso.',
      });
      setIsAlertDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar alerta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Selecionar primeiro servidor automaticamente
  useEffect(() => {
    if (servers && servers.length > 0 && !selectedServerId) {
      setSelectedServerId(servers[0].id);
    }
  }, [servers, selectedServerId]);

  // Preparar dados para gráficos
  const prepareChartData = (type: 'cpu' | 'memory' | 'disk') => {
    if (!historicalMetrics || historicalMetrics.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: type.toUpperCase(),
          data: [],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
        }]
      };
    }

    const sortedMetrics = [...historicalMetrics].reverse();
    const labels = sortedMetrics.map(m => 
      new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );

    let data: number[] = [];
    let label = '';
    let color = '';

    switch (type) {
      case 'cpu':
        data = sortedMetrics.map(m => Number(m.cpuPercent));
        label = 'CPU (%)';
        color = 'rgb(59, 130, 246)'; // blue
        break;
      case 'memory':
        data = sortedMetrics.map(m => Number(m.memoryPercent));
        label = 'Memória (%)';
        color = 'rgb(16, 185, 129)'; // green
        break;
      case 'disk':
        data = sortedMetrics.map(m => Number(m.diskPercent));
        label = 'Disco (%)';
        color = 'rgb(245, 158, 11)'; // amber
        break;
    }

    return {
      labels,
      datasets: [{
        label,
        data,
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
        fill: true,
        tension: 0.4,
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: number | string) => `${value}%`,
        },
      },
    },
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const selectedServer = servers?.find(s => s.id === selectedServerId);
  const isOnline = latestMetric && (Date.now() - new Date(latestMetric.timestamp).getTime()) < 120000; // 2 minutos

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento de VPS</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho dos seus servidores em tempo real</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Servidor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Servidor</DialogTitle>
              <DialogDescription>
                Adicione um servidor VPS para monitoramento. Um token será gerado para configurar o agente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Servidor</Label>
                <Input
                  id="name"
                  placeholder="Ex: FlowEdu Production"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ip">Endereço IP</Label>
                <Input
                  id="ip"
                  placeholder="Ex: 76.13.67.5"
                  value={newServerIP}
                  onChange={(e) => setNewServerIP(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => createServerMutation.mutate({ name: newServerName, ipAddress: newServerIP })}
                disabled={!newServerName || !newServerIP || createServerMutation.isPending}
              >
                {createServerMutation.isPending ? 'Criando...' : 'Criar Servidor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seletor de Servidor */}
      {servers && servers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Servidor Selecionado</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Select
              value={selectedServerId?.toString()}
              onValueChange={(value) => setSelectedServerId(Number(value))}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Selecione um servidor" />
              </SelectTrigger>
              <SelectContent>
                {servers.map((server) => (
                  <SelectItem key={server.id} value={server.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      {server.name} ({server.ipAddress})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedServer && (
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-muted-foreground">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchMetric()}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>

            {selectedServer && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm(`Tem certeza que deseja remover o servidor "${selectedServer.name}"?`)) {
                    deleteServerMutation.mutate({ serverId: selectedServer.id });
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Métricas em Tempo Real */}
      {latestMetric && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Number(latestMetric.cpuPercent).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Load: {latestMetric.loadAverage1 ? Number(latestMetric.loadAverage1).toFixed(2) : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memória</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Number(latestMetric.memoryPercent).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(Number(latestMetric.memoryUsed))} / {formatBytes(Number(latestMetric.memoryTotal))}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disco</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Number(latestMetric.diskPercent).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(Number(latestMetric.diskUsed))} / {formatBytes(Number(latestMetric.diskTotal))}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rede</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">↑ {formatBytes(Number(latestMetric.networkSent))}</div>
              <div className="text-sm font-bold">↓ {formatBytes(Number(latestMetric.networkRecv))}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      {historicalMetrics && historicalMetrics.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">CPU</CardTitle>
              <CardDescription>Últimos 60 minutos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <Line data={prepareChartData('cpu')} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Memória</CardTitle>
              <CardDescription>Últimos 60 minutos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <Line data={prepareChartData('memory')} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disco</CardTitle>
              <CardDescription>Últimos 60 minutos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <Line data={prepareChartData('disk')} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estado vazio */}
      {!servers || servers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum servidor configurado</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Adicione um servidor VPS para começar a monitorar suas métricas
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Servidor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
