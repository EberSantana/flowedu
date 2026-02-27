import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Download, Trash2, RefreshCw, Settings, Database, Calendar, Clock, Save, ArrowLeft, HardDrive, FileArchive } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useLocation } from "wouter";

export default function BackupAdmin() {
  const [, setLocation] = useLocation();
  const { data: backups, isLoading, refetch } = trpc.backup.list.useQuery();
  const { data: schedule, refetch: refetchSchedule } = trpc.backup.getSchedule.useQuery();
  
  // Estado do formulário de agendamento
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(schedule?.isEnabled ?? false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(schedule?.frequency ?? 'daily');
  const [scheduleTime, setScheduleTime] = useState(schedule?.scheduleTime ?? '03:00');
  const [dayOfWeek, setDayOfWeek] = useState(schedule?.dayOfWeek ?? 0);
  const [dayOfMonth, setDayOfMonth] = useState(schedule?.dayOfMonth ?? 1);
  const [retentionDays, setRetentionDays] = useState(schedule?.retentionDays ?? 7);
  
  // Atualizar estado quando schedule carregar
  useState(() => {
    if (schedule) {
      setIsEnabled(schedule.isEnabled);
      setFrequency(schedule.frequency);
      setScheduleTime(schedule.scheduleTime);
      setDayOfWeek(schedule.dayOfWeek ?? 0);
      setDayOfMonth(schedule.dayOfMonth ?? 1);
      setRetentionDays(schedule.retentionDays);
    }
  });
  
  const createMutation = trpc.backup.create.useMutation({
    onSuccess: () => {
      toast.success("Backup iniciado! Aguarde alguns minutos para conclusão.");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar backup: " + error.message);
    },
  });

  const restoreMutation = trpc.backup.restore.useMutation({
    onSuccess: () => {
      toast.success("Restauração iniciada! O sistema será reiniciado.");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao restaurar: " + error.message);
    },
  });

  const deleteMutation = trpc.backup.delete.useMutation({
    onSuccess: () => {
      toast.success("Backup deletado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao deletar: " + error.message);
    },
  });
  
  const updateScheduleMutation = trpc.backup.updateSchedule.useMutation({
    onSuccess: () => {
      toast.success("Configuração de agendamento atualizada!");
      refetchSchedule();
      setIsScheduleDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar agendamento: " + error.message);
    },
  });

  const handleCreateBackup = () => {
    if (confirm("Deseja criar um backup manual agora? O processo pode levar alguns minutos.")) {
      createMutation.mutate();
    }
  };

  const handleRestore = (backupId: number) => {
    if (confirm("ATENÇÃO: Restaurar este backup irá substituir todos os dados atuais. Deseja continuar?")) {
      restoreMutation.mutate({ backupId });
    }
  };

  const handleDelete = (backupId: number) => {
    if (confirm("Tem certeza que deseja deletar este backup?")) {
      deleteMutation.mutate({ backupId });
    }
  };
  
  const handleSaveSchedule = () => {
    updateScheduleMutation.mutate({
      isEnabled,
      frequency,
      scheduleTime,
      dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      retentionDays,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Calcular estatísticas
  const totalBackups = backups?.length ?? 0;
  const totalSize = backups?.reduce((acc, b) => acc + (b.filesize || 0), 0) ?? 0;
  const lastBackup = backups && backups.length > 0 ? backups[0] : null;

  // Calcular próxima execução
  const getNextExecution = () => {
    if (!schedule || !schedule.isEnabled) return null;
    
    const now = new Date();
    const [hours, minutes] = schedule.scheduleTime.split(':').map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    
    if (schedule.frequency === 'daily') {
      if (next <= now) next.setDate(next.getDate() + 1);
    } else if (schedule.frequency === 'weekly') {
      const targetDay = schedule.dayOfWeek ?? 0;
      const currentDay = next.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0 || (daysToAdd === 0 && next <= now)) daysToAdd += 7;
      next.setDate(next.getDate() + daysToAdd);
    } else if (schedule.frequency === 'monthly') {
      next.setDate(schedule.dayOfMonth ?? 1);
      if (next <= now) next.setMonth(next.getMonth() + 1);
    }
    
    return next;
  };

  const nextExecution = getNextExecution();

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
          
          <Breadcrumb items={[{ label: "Administração" }, { label: "Backups" }]} />
          
          <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Database className="w-8 h-8 text-primary" />
                Administração de Backups
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie backups do banco de dados e configure agendamentos automáticos
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar Agendamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Configurar Agendamento Automático</DialogTitle>
                    <DialogDescription>
                      Configure backups automáticos do banco de dados
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* Ativar/Desativar */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-semibold">Agendamento Automático</Label>
                        <p className="text-sm text-muted-foreground">Ativar backups automáticos programados</p>
                      </div>
                      <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
                    </div>

                    {/* Frequência */}
                    <div className="space-y-2">
                      <Label>Frequência</Label>
                      <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Horário */}
                    <div className="space-y-2">
                      <Label>Horário</Label>
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>

                    {/* Dia da Semana (apenas semanal) */}
                    {frequency === 'weekly' && (
                      <div className="space-y-2">
                        <Label>Dia da Semana</Label>
                        <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Domingo</SelectItem>
                            <SelectItem value="1">Segunda-feira</SelectItem>
                            <SelectItem value="2">Terça-feira</SelectItem>
                            <SelectItem value="3">Quarta-feira</SelectItem>
                            <SelectItem value="4">Quinta-feira</SelectItem>
                            <SelectItem value="5">Sexta-feira</SelectItem>
                            <SelectItem value="6">Sábado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Dia do Mês (apenas mensal) */}
                    {frequency === 'monthly' && (
                      <div className="space-y-2">
                        <Label>Dia do Mês</Label>
                        <Input
                          type="number"
                          min="1"
                          max="28"
                          value={dayOfMonth}
                          onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">Escolha entre 1 e 28 para evitar problemas com meses curtos</p>
                      </div>
                    )}

                    {/* Retenção */}
                    <div className="space-y-2">
                      <Label>Retenção (dias)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={retentionDays}
                        onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">Backups mais antigos serão deletados automaticamente</p>
                    </div>

                    {/* Preview da próxima execução */}
                    {isEnabled && nextExecution && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-900">
                          <Clock className="h-4 w-4" />
                          <span className="font-semibold">Próxima execução:</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          {nextExecution.toLocaleString('pt-BR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <LoadingButton
                      onClick={handleSaveSchedule}
                      loading={updateScheduleMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Configuração
                    </LoadingButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <LoadingButton
                size="lg"
                onClick={handleCreateBackup}
                loading={createMutation.isPending}
              >
                <FileArchive className="mr-2 h-4 w-4" />
                Criar Backup Manual
              </LoadingButton>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileArchive className="h-4 w-4 text-blue-500" />
                  Total de Backups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalBackups}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Backups disponíveis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-green-500" />
                  Espaço Utilizado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatFileSize(totalSize)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Armazenamento total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Último Backup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {lastBackup ? formatDate(lastBackup.createdAt) : 'Nenhum'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {schedule?.isEnabled ? 'Agendamento ativo' : 'Agendamento inativo'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Backups */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Backups Disponíveis</CardTitle>
                  <CardDescription>Lista de todos os backups do banco de dados</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando backups...</div>
              ) : backups && backups.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup: any) => (
                      <TableRow key={backup.id}>
                        <TableCell className="font-medium">
                          {formatDate(backup.createdAt)}
                        </TableCell>
                        <TableCell>{backup.description || 'Backup automático'}</TableCell>
                        <TableCell>{formatFileSize(backup.fileSize || 0)}</TableCell>
                        <TableCell>
                          <Badge variant={backup.status === 'completed' ? 'default' : backup.status === 'failed' ? 'destructive' : 'secondary'}>
                            {backup.status === 'completed' ? 'Concluído' : backup.status === 'failed' ? 'Falhou' : 'Em andamento'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(backup.id)}
                              disabled={backup.status !== 'completed' || restoreMutation.isPending}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(backup.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">Nenhum backup encontrado</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie seu primeiro backup ou configure agendamentos automáticos
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}
