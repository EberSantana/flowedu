import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Users, Shield, Mail, Calendar, AlertCircle, ArrowLeft, Trash2, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";
import { getLoginUrl } from "@/const";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";

export default function AdminUsers() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  
  // Estado do formulário de cadastro
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "user">("user");
  
  const { data: activeUsers, isLoading: activeLoading, refetch: refetchActive } = trpc.admin.listActiveUsers.useQuery();
  const { data: inactiveUsers, isLoading: inactiveLoading, refetch: refetchInactive } = trpc.admin.listInactiveUsers.useQuery();
  
  let allUsers = showInactive ? inactiveUsers : activeUsers;
  const usersLoading = showInactive ? inactiveLoading : activeLoading;
  
  // Aplicar filtros
  if (allUsers) {
    // Filtro de busca
    if (searchTerm) {
      allUsers = allUsers.filter((u) => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtro de papel
    if (roleFilter !== "all") {
      allUsers = allUsers.filter((u) => u.role === roleFilter);
    }
  }
  
  const refetch = () => {
    refetchActive();
    refetchInactive();
  };

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("Papel do usuário atualizado com sucesso!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário desativado com sucesso!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const reactivateUserMutation = trpc.admin.reactivateUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário reativado com sucesso!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });



  const createUserMutation = trpc.admin.createUser.useMutation({
    onSuccess: (data) => {
      toast.success(`Usuário ${data.user.name} criado com sucesso!`);
      if (data.emailSent) {
        toast.success("E-mail de boas-vindas enviado!");
      } else if (data.emailError) {
        toast.warning(`E-mail não enviado: ${data.emailError}`);
      }
      // Limpar formulário
      setNewUserName("");
      setNewUserEmail("");
      setNewUserRole("user");
      setShowCreateForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const permanentDeleteMutation = trpc.admin.permanentDeleteUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário deletado permanentemente!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  if (loading || usersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Você precisa estar logado</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <CardTitle>Acesso Negado</CardTitle>
            </div>
            <CardDescription>Apenas administradores podem acessar esta página</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRoleChange = (userId: number, newRole: "admin" | "user") => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="container max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                  <Users className="w-10 h-10 text-purple-600" />
                  Gerenciamento de Usuários
                </h1>
                <p className="text-slate-600">Administre contas e permissões do sistema</p>
              </div>
              <Button
                variant="outline"
              onClick={() => setShowInactive(!showInactive)}
              className="flex items-center gap-2"
            >
              {showInactive ? (
                <>
                  <Eye className="w-4 h-4" />
                  Ver Usuários Ativos
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Ver Usuários Inativos
                </>
              )}
            </Button>
            

            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              {showCreateForm ? "Cancelar" : "Novo Usuário"}
            </Button>
          </div>
        </div>
        
        {/* Formulário de Cadastro */}
        {showCreateForm && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Cadastrar Novo Usuário</CardTitle>
              <CardDescription>Preencha os dados para criar um novo professor ou administrador</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newUserName || !newUserEmail) {
                    toast.error("Preencha todos os campos obrigatórios");
                    return;
                  }
                  createUserMutation.mutate({
                    name: newUserName,
                    email: newUserEmail,
                    role: newUserRole,
                  });
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Nome Completo *</label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">E-mail *</label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="Ex: joao@email.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Papel *</label>
                    <Select value={newUserRole} onValueChange={(value: "admin" | "user") => setNewUserRole(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Professor</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewUserName("");
                      setNewUserEmail("");
                      setNewUserRole("user");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Usuários Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeUsers?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Usuários Inativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{inactiveUsers?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {activeUsers?.filter((u) => u.role === "admin").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Professores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {activeUsers?.filter((u) => u.role === "user").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Usuários */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Todos os Usuários</CardTitle>
                <CardDescription>Visualize e gerencie todos os usuários cadastrados</CardDescription>
              </div>
              <div className="text-sm text-slate-600">
                {allUsers?.length || 0} usuário(s) encontrado(s)
              </div>
            </div>
            
            {/* Filtros */}
            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os papéis</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="user">Professores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Método de Login</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {u.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        {u.name || "Sem nome"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {u.email || "Não informado"}
                      </div>
                    </TableCell>
                    <TableCell>{u.loginMethod || "N/A"}</TableCell>
                    <TableCell>
                      {u.id === user.id ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {u.role === "admin" ? "Administrador" : "Professor"} (Você)
                        </span>
                      ) : (
                        <Select
                          value={u.role}
                          onValueChange={(value) => handleRoleChange(u.id, value as "admin" | "user")}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Professor</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">
                        {new Date(u.lastSignedIn).toLocaleDateString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.id !== user.id && (
                        <div className="flex gap-2">
                          {showInactive ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Tem certeza que deseja reativar o usuário ${u.name}?`)) {
                                    reactivateUserMutation.mutate({ userId: u.id });
                                  }
                                }}
                                disabled={reactivateUserMutation.isPending}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Reativar
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const confirmed = confirm(`⚠️ ATENÇÃO: Deletar Permanentemente\n\nTem certeza que deseja deletar PERMANENTEMENTE o usuário ${u.name}?\n\nEsta ação é IRREVERSÍVEL e irá:\n- Remover o usuário do sistema\n- Apagar todos os dados associados\n- Não poderá ser desfeita\n\nDigite SIM para confirmar.`);
                                  if (confirmed) {
                                    const doubleConfirm = prompt('Digite "DELETAR" em maiúsculas para confirmar a deleção permanente:');
                                    if (doubleConfirm === 'DELETAR') {
                                      permanentDeleteMutation.mutate({ userId: u.id });
                                    } else {
                                      toast.error('Deleção cancelada: confirmação incorreta');
                                    }
                                  }
                                }}
                                disabled={permanentDeleteMutation.isPending}
                                className="text-red-800 hover:text-red-900 hover:bg-red-100 border-red-300"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Deletar Permanentemente
                              </Button>
                            </>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja desativar o usuário ${u.name}? O usuário não poderá mais fazer login, mas seus dados serão preservados.`)) {
                                  deleteUserMutation.mutate({ userId: u.id });
                                }
                              }}
                              disabled={deleteUserMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Desativar
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </div>
      </PageWrapper>
    </>
  );
}
