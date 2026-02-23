import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Download, Trash2, RefreshCw, Settings, Database, Calendar, AlertTriangle } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function BackupAdmin() {
  const { data: backups, isLoading, refetch } = trpc.backup.list.useQuery();
  const { data: schedule } = trpc.backup.getSchedule.useQuery();
  
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

  const handleCreateBackup = () => {
    if (confirm("Deseja criar um backup manual agora? O processo pode levar alguns minutos.")) {
      createMutation.mutate();
    }
  };

  const handleRestore = (backupId: number, filename: string) => {
    if (confirm(`⚠️ ATENÇÃO: Restaurar o backup "${filename}" irá SUBSTITUIR todos os dados atuais do sistema. Esta ação não pode ser desfeita. Deseja continuar?`)) {
      restoreMutation.mutate({ backupId });
    }
  };

  const handleDelete = (backupId: number, filename: string) => {
    if (confirm(`Deseja deletar o backup "${filename}"? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate({ backupId });
    }
  };

  const formatFileSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      restoring: "outline",
    };
    
    const labels: Record<string, string> = {
      completed: "Concluído",
      pending: "Pendente",
      failed: "Falhou",
      restoring: "Restaurando",
    };
    
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  const getBackupTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      manual: "Manual",
      scheduled: "Agendado",
      automatic: "Automático",
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Administração de Backups</h1>
            <p className="text-gray-600 mt-2">Gerencie backups do sistema FlowEdu</p>
          </div>

          {/* Aviso de Segurança */}
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">Importante: Funcionalidade em Desenvolvimento</h3>
                  <p className="text-sm text-orange-800">
                    O sistema de backup está em fase de testes. Recomenda-se fazer backups manuais adicionais antes de realizar restaurações. 
                    A funcionalidade de agendamento automático será implementada em breve.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Agendamento
                </CardTitle>
                <CardDescription>
                  {schedule?.isEnabled ? `Ativo (${schedule.frequency})` : "Desativado"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Settings className="h-4 w-4 mr-2" />
                  Em Breve
                </Button>
              </CardContent>
            </Card>

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
          </div>

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
                          <TableCell>{getBackupTypeBadge(backup.backupType)}</TableCell>
                          <TableCell>{getStatusBadge(backup.status)}</TableCell>
                          <TableCell>
                            {new Date(backup.createdAt).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore(backup.id, backup.filename)}
                                disabled={backup.status !== 'completed' || restoreMutation.isPending}
                                title="Restaurar backup"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(backup.id, backup.filename)}
                                disabled={deleteMutation.isPending}
                                title="Deletar backup"
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
                <div className="text-center py-12 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum backup encontrado</p>
                  <p className="text-sm mt-2">Crie seu primeiro backup clicando no botão acima</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
