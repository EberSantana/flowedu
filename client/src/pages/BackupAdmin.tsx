import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Download, Trash2, RefreshCw, Settings, Database, Calendar, AlertTriangle, Clock, Save } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function BackupAdmin() {
  const { data: backups, isLoading, refetch } = trpc.backup.list.useQuery();
  const { data: schedule, refetch: refetchSchedule } = trpc.backup.getSchedule.useQuery();
  
  // Estado do formulário de agendamento
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

  const handleRestore = (backupId: number, filename: string) => {
    if (confirm(`ATENÇÃO: Restaurar o backup "${filename}" irá substituir todos os dados atuais. Esta ação não pode ser desfeita. Deseja continuar?`)) {
      restoreMutation.mutate({ backupId });
    }
  };

  const handleDelete = (backupId: number, filename: string) => {
    if (confirm(`Deseja deletar o backup "${filename}"? Esta ação não pode ser desfeita.`)) {
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      restoring: 'outline',
    };
    
    const labels: Record<string, string> = {
      completed: 'Concluído',
      pending: 'Pendente',
      failed: 'Falhou',
      restoring: 'Restaurando',
    };

    return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
  };
  
  const getNextExecutionPreview = () => {
    const [hours, minutes] = scheduleTime.split(':');
    const now = new Date();
    const next = new Date(now);
    next.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    if (frequency === 'weekly') {
      while (next.getDay() !== dayOfWeek) {
        next.setDate(next.getDate() + 1);
      }
    } else if (frequency === 'monthly') {
      next.setDate(dayOfMonth);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
    }
    
    return next.toLocaleString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Administração de Backups</h1>
            <p className="text-gray-600 mt-2">Gerencie backups automáticos e manuais do sistema FlowEdu</p>
          </div>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Backup Manual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Backup Manual
                </CardTitle>
                <CardDescription>Criar backup agora</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleCreateBackup}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? "Criando..." : "Criar Backup"}
                </Button>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
                <CardDescription>Total de backups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{backups?.length || 0}</div>
                <p className="text-sm text-gray-500 mt-1">
                  {backups?.filter(b => b.status === 'completed').length || 0} concluídos
                </p>
              </CardContent>
            </Card>
            
            {/* Preview da Próxima Execução */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Próxima Execução
                </CardTitle>
                <CardDescription>
                  {isEnabled ? "Agendado" : "Desativado"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEnabled ? (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {getNextExecutionPreview()}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Ative o agendamento abaixo
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Configuração de Agendamento */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Agendamento Automático
              </CardTitle>
              <CardDescription>
                Configure backups automáticos diários, semanais ou mensais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ativar/Desativar */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enabled" className="text-base font-medium">Ativar Agendamento</Label>
                  <p className="text-sm text-gray-500 mt-1">Backups serão criados automaticamente</p>
                </div>
                <Switch
                  id="enabled"
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
              </div>

              {isEnabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Frequência */}
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequência</Label>
                      <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                        <SelectTrigger id="frequency">
                          <SelectValue placeholder="Selecione a frequência" />
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
                      <Label htmlFor="time">Horário</Label>
                      <Input
                        id="time"
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>

                    {/* Dia da Semana (apenas para semanal) */}
                    {frequency === 'weekly' && (
                      <div className="space-y-2">
                        <Label htmlFor="dayOfWeek">Dia da Semana</Label>
                        <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                          <SelectTrigger id="dayOfWeek">
                            <SelectValue placeholder="Selecione o dia" />
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

                    {/* Dia do Mês (apenas para mensal) */}
                    {frequency === 'monthly' && (
                      <div className="space-y-2">
                        <Label htmlFor="dayOfMonth">Dia do Mês</Label>
                        <Input
                          id="dayOfMonth"
                          type="number"
                          min="1"
                          max="31"
                          value={dayOfMonth}
                          onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                        />
                      </div>
                    )}

                    {/* Retenção */}
                    <div className="space-y-2">
                      <Label htmlFor="retention">Retenção (dias)</Label>
                      <Input
                        id="retention"
                        type="number"
                        min="1"
                        max="365"
                        value={retentionDays}
                        onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                      />
                      <p className="text-xs text-gray-500">
                        Backups mais antigos serão deletados automaticamente
                      </p>
                    </div>
                  </div>

                  {/* Botão Salvar */}
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleSaveSchedule}
                      disabled={updateScheduleMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateScheduleMutation.isPending ? "Salvando..." : "Salvar Configuração"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Lista de Backups */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Backups Disponíveis</CardTitle>
                  <CardDescription>Histórico de backups do sistema</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Carregando backups...</p>
                </div>
              ) : backups && backups.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Arquivo</TableHead>
                        <TableHead>Tamanho</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backups.map((backup) => (
                        <TableRow key={backup.id}>
                          <TableCell className="font-medium">{backup.filename}</TableCell>
                          <TableCell>{formatFileSize(backup.filesize)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {backup.backupType === 'manual' ? 'Manual' : 'Agendado'}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(backup.status)}</TableCell>
                          <TableCell>{formatDate(backup.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore(backup.id, backup.filename)}
                                disabled={restoreMutation.isPending || backup.status !== 'completed'}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(backup.id, backup.filename)}
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
                </div>
              ) : (
                <div className="text-center py-12">
                  <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">Nenhum backup encontrado</p>
                  <p className="text-gray-400 text-sm mt-2">Crie seu primeiro backup usando o botão acima</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
