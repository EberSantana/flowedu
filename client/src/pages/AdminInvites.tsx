import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
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
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Convites e Aprovações</h1>
            <p className="text-gray-600">Gerencie códigos de convite e aprove novos professores</p>
          </div>

          <Tabs defaultValue="invites" className="space-y-6">
            <TabsList className="bg-white border shadow-sm">
              <TabsTrigger value="invites" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <KeyRound className="w-4 h-4" />
                Códigos de Convite
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
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
              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-accent/10 to-primary/10 rounded-t-lg">
                  <div>
                    <CardTitle className="text-xl text-gray-800">Códigos de Convite</CardTitle>
                    <CardDescription className="text-gray-600">
                      Crie e gerencie códigos para novos professores se cadastrarem
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                    if (!open) resetCreateDialog();
                    else setIsCreateDialogOpen(true);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
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
                            <Button onClick={handleCreateCode} disabled={createInviteCode.isPending} className="bg-blue-600 hover:bg-blue-700">
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
                            <Button onClick={resetCreateDialog} className="bg-blue-600 hover:bg-blue-700">Fechar</Button>
                          </DialogFooter>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-0">
                  {inviteCodesQuery.isLoading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : inviteCodesQuery.data && inviteCodesQuery.data.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Código</TableHead>
                          <TableHead className="font-semibold">Descrição</TableHead>
                          <TableHead className="font-semibold">Usos</TableHead>
                          <TableHead className="font-semibold">Expira em</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="text-right font-semibold">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inviteCodesQuery.data.map((invite) => (
                          <TableRow key={invite.id} className="hover:bg-gray-50">
                            <TableCell className="font-mono font-medium text-blue-600">
                              {invite.code}
                            </TableCell>
                            <TableCell className="text-gray-500">
                              {invite.description || "-"}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{invite.currentUses}</span>
                              <span className="text-gray-400"> / {invite.maxUses}</span>
                            </TableCell>
                            <TableCell>
                              <span className={isExpired(invite.expiresAt) ? "text-red-500" : "text-gray-600"}>
                                {formatDate(invite.expiresAt)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {!invite.isActive ? (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">Desativado</Badge>
                              ) : isExpired(invite.expiresAt) ? (
                                <Badge variant="destructive">Expirado</Badge>
                              ) : invite.currentUses >= invite.maxUses ? (
                                <Badge variant="outline" className="border-orange-300 text-orange-600">Esgotado</Badge>
                              ) : (
                                <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopyCode(invite.code)}
                                  title="Copiar código"
                                  className="hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopyLink(invite.code)}
                                  title="Copiar link"
                                  className="hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Share2 className="w-4 h-4" />
                                </Button>
                                {invite.isActive ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deactivateInviteCode.mutate({ codeId: invite.id })}
                                    title="Desativar"
                                    className="hover:bg-amber-50"
                                  >
                                    <Ban className="w-4 h-4 text-amber-500" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => reactivateInviteCode.mutate({ codeId: invite.id })}
                                    title="Reativar"
                                    className="hover:bg-green-50"
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
                                  className="hover:bg-red-50"
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
                    <div className="text-center py-12 text-gray-500">
                      <KeyRound className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">Nenhum código de convite criado</p>
                      <p className="text-sm mt-1">Clique em "Novo Código" para criar um</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba: Pendentes de Aprovação */}
            <TabsContent value="pending" className="space-y-4">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg">
                  <CardTitle className="text-xl text-gray-800">Usuários Pendentes de Aprovação</CardTitle>
                  <CardDescription className="text-gray-600">
                    Professores que se cadastraram sem código de convite
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {pendingUsersQuery.isLoading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : pendingUsersQuery.data && pendingUsersQuery.data.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Nome</TableHead>
                          <TableHead className="font-semibold">E-mail</TableHead>
                          <TableHead className="font-semibold">Método de Login</TableHead>
                          <TableHead className="font-semibold">Data de Cadastro</TableHead>
                          <TableHead className="text-right font-semibold">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingUsersQuery.data.map((user) => (
                          <TableRow key={user.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-800">
                              {user.name || "Sem nome"}
                            </TableCell>
                            <TableCell className="text-gray-600">{user.email || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                {user.loginMethod || "OAuth"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => approveUser.mutate({ userId: user.id })}
                                  disabled={approveUser.isPending}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
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
                    <div className="text-center py-12 text-gray-500">
                      <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">Nenhum usuário pendente de aprovação</p>
                      <p className="text-sm mt-1">Novos cadastros sem código aparecerão aqui</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageWrapper>
    </>
  );
}
