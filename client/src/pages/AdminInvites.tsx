import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Plus, 
  Copy, 
  Trash2, 
  RefreshCw, 
  KeyRound, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Ban,
  RotateCcw,
  Share2
} from "lucide-react";

export default function AdminInvites() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [newCode, setNewCode] = useState<string | null>(null);

  const utils = trpc.useUtils();
  
  // Queries
  const inviteCodesQuery = trpc.admin.listInviteCodes.useQuery();
  const pendingUsersQuery = trpc.admin.listPendingUsers.useQuery();

  // Mutations
  const createInviteCode = trpc.admin.createInviteCode.useMutation({
    onSuccess: (data) => {
      setNewCode(data.code);
      utils.admin.listInviteCodes.invalidate();
      toast.success("Código de convite criado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar código de convite");
    },
  });

  const deactivateInviteCode = trpc.admin.deactivateInviteCode.useMutation({
    onSuccess: () => {
      utils.admin.listInviteCodes.invalidate();
      toast.success("Código desativado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desativar código");
    },
  });

  const reactivateInviteCode = trpc.admin.reactivateInviteCode.useMutation({
    onSuccess: () => {
      utils.admin.listInviteCodes.invalidate();
      toast.success("Código reativado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao reativar código");
    },
  });

  const deleteInviteCode = trpc.admin.deleteInviteCode.useMutation({
    onSuccess: () => {
      utils.admin.listInviteCodes.invalidate();
      toast.success("Código excluído com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir código");
    },
  });

  const approveUser = trpc.admin.approveUser.useMutation({
    onSuccess: () => {
      utils.admin.listPendingUsers.invalidate();
      toast.success("Usuário aprovado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao aprovar usuário");
    },
  });

  const rejectUser = trpc.admin.rejectUser.useMutation({
    onSuccess: () => {
      utils.admin.listPendingUsers.invalidate();
      toast.success("Usuário rejeitado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao rejeitar usuário");
    },
  });

  const handleCreateCode = () => {
    createInviteCode.mutate({
      maxUses,
      expiresInDays: expiresInDays || undefined,
      description: description || undefined,
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado para a área de transferência!");
  };

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/register?code=${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link de convite copiado!");
  };

  const resetCreateDialog = () => {
    setMaxUses(1);
    setExpiresInDays(undefined);
    setDescription("");
    setNewCode(null);
    setIsCreateDialogOpen(false);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Sem expiração";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isExpired = (date: Date | string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Convites e Aprovações</h1>
            <p className="text-gray-500">Gerencie códigos de convite e aprove novos professores</p>
          </div>
        </div>

        <Tabs defaultValue="invites" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invites" className="gap-2">
              <KeyRound className="w-4 h-4" />
              Códigos de Convite
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Users className="w-4 h-4" />
              Pendentes de Aprovação
              {pendingUsersQuery.data && pendingUsersQuery.data.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingUsersQuery.data.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Aba: Códigos de Convite */}
          <TabsContent value="invites" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Códigos de Convite</CardTitle>
                  <CardDescription>
                    Crie e gerencie códigos para novos professores se cadastrarem
                  </CardDescription>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                  if (!open) resetCreateDialog();
                  else setIsCreateDialogOpen(true);
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Novo Código
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    {!newCode ? (
                      <>
                        <DialogHeader>
                          <DialogTitle>Criar Código de Convite</DialogTitle>
                          <DialogDescription>
                            Configure as opções do novo código de convite
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="maxUses">Número máximo de usos</Label>
                            <Input
                              id="maxUses"
                              type="number"
                              min={1}
                              value={maxUses}
                              onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                            />
                            <p className="text-xs text-gray-500">
                              Quantas vezes este código pode ser usado
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="expiresInDays">Expira em (dias)</Label>
                            <Input
                              id="expiresInDays"
                              type="number"
                              min={1}
                              placeholder="Deixe vazio para não expirar"
                              value={expiresInDays || ""}
                              onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Descrição (opcional)</Label>
                            <Input
                              id="description"
                              placeholder="Ex: Convite para professores de matemática"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleCreateCode} disabled={createInviteCode.isPending}>
                            {createInviteCode.isPending ? "Criando..." : "Criar Código"}
                          </Button>
                        </DialogFooter>
                      </>
                    ) : (
                      <>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            Código Criado!
                          </DialogTitle>
                          <DialogDescription>
                            Compartilhe este código com o professor
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-6">
                          <div className="bg-gray-100 p-4 rounded-lg text-center">
                            <p className="text-3xl font-mono font-bold tracking-wider text-gray-800">
                              {newCode}
                            </p>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              className="flex-1 gap-2"
                              onClick={() => handleCopyCode(newCode)}
                            >
                              <Copy className="w-4 h-4" />
                              Copiar Código
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 gap-2"
                              onClick={() => handleCopyLink(newCode)}
                            >
                              <Share2 className="w-4 h-4" />
                              Copiar Link
                            </Button>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={resetCreateDialog}>Fechar</Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {inviteCodesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : inviteCodesQuery.data && inviteCodesQuery.data.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Usos</TableHead>
                        <TableHead>Expira em</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inviteCodesQuery.data.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell className="font-mono font-medium">
                            {invite.code}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {invite.description || "-"}
                          </TableCell>
                          <TableCell>
                            {invite.currentUses} / {invite.maxUses}
                          </TableCell>
                          <TableCell>
                            <span className={isExpired(invite.expiresAt) ? "text-red-500" : ""}>
                              {formatDate(invite.expiresAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {!invite.isActive ? (
                              <Badge variant="secondary">Desativado</Badge>
                            ) : isExpired(invite.expiresAt) ? (
                              <Badge variant="destructive">Expirado</Badge>
                            ) : invite.currentUses >= invite.maxUses ? (
                              <Badge variant="outline">Esgotado</Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-500">Ativo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyCode(invite.code)}
                                title="Copiar código"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyLink(invite.code)}
                                title="Copiar link"
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                              {invite.isActive ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deactivateInviteCode.mutate({ codeId: invite.id })}
                                  title="Desativar"
                                >
                                  <Ban className="w-4 h-4 text-amber-500" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => reactivateInviteCode.mutate({ codeId: invite.id })}
                                  title="Reativar"
                                >
                                  <RotateCcw className="w-4 h-4 text-green-500" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja excluir este código?")) {
                                    deleteInviteCode.mutate({ codeId: invite.id });
                                  }
                                }}
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <KeyRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum código de convite criado</p>
                    <p className="text-sm">Clique em "Novo Código" para criar um</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Pendentes de Aprovação */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Pendentes de Aprovação</CardTitle>
                <CardDescription>
                  Professores que se cadastraram sem código de convite
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingUsersQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : pendingUsersQuery.data && pendingUsersQuery.data.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Método de Login</TableHead>
                        <TableHead>Data de Cadastro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsersQuery.data.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name || "Sem nome"}
                          </TableCell>
                          <TableCell>{user.email || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {user.loginMethod || "OAuth"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => approveUser.mutate({ userId: user.id })}
                                disabled={approveUser.isPending}
                              >
                                <CheckCircle className="w-4 h-4" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja rejeitar este usuário?")) {
                                    rejectUser.mutate({ userId: user.id });
                                  }
                                }}
                                disabled={rejectUser.isPending}
                              >
                                <XCircle className="w-4 h-4" />
                                Rejeitar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum usuário pendente de aprovação</p>
                    <p className="text-sm">Novos cadastros sem código aparecerão aqui</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
