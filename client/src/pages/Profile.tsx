import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { User, Mail, Calendar, Shield, LogOut, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";
import { getLoginUrl } from "@/const";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";

export default function Profile() {
  const { user, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    },
  });

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      toast.error(`Erro ao alterar senha: ${error.message}`);
    },
  });

  const [googlePasswordData, setGooglePasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showGooglePasswords, setShowGooglePasswords] = useState({
    new: false,
    confirm: false,
  });

  const setGooglePasswordMutation = trpc.auth.setPasswordForGoogleAccount.useMutation({
    onSuccess: () => {
      toast.success("Senha definida com sucesso! Voc\u00ea agora pode fazer login com email e senha.");
      setGooglePasswordData({
        newPassword: "",
        confirmPassword: "",
      });
      // Recarregar p\u00e1gina para atualizar informa\u00e7\u00f5es do usu\u00e1rio
      setTimeout(() => window.location.reload(), 2000);
    },
    onError: (error) => {
      toast.error(`Erro ao definir senha: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword) {
      toast.error("Digite sua senha atual");
      return;
    }

    if (!passwordData.newPassword) {
      toast.error("Digite a nova senha");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas n\u00e3o coincidem");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error("A nova senha deve ser diferente da atual");
      return;
    }

    changePasswordMutation.mutate(passwordData);
  };

  const handleSetGooglePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!googlePasswordData.newPassword) {
      toast.error("Digite a nova senha");
      return;
    }

    if (googlePasswordData.newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (googlePasswordData.newPassword !== googlePasswordData.confirmPassword) {
      toast.error("As senhas n\u00e3o coincidem");
      return;
    }

    setGooglePasswordMutation.mutate(googlePasswordData);
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logout realizado com sucesso!");
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Você precisa estar logado para acessar esta página</CardDescription>
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

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="container max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Meu Perfil</h1>
            <p className="text-slate-600">Gerencie suas informações pessoais e configurações</p>
          </div>

        <div className="grid gap-6">
          {/* Informações do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>Atualize seus dados cadastrais</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  className="w-full"
                >
                  {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Informações da Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Informações da Conta
              </CardTitle>
              <CardDescription>Detalhes sobre sua conta no sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-sm">Método de Login</p>
                    <p className="text-sm text-slate-600">{user.loginMethod || "Não especificado"}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-sm">Papel no Sistema</p>
                    <p className="text-sm text-slate-600">
                      {user.role === "admin" ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Administrador
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Professor
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-sm">Membro desde</p>
                    <p className="text-sm text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segurança - Definir/Alterar Senha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Segurança
              </CardTitle>
              <CardDescription>
                {user.loginMethod === 'google' 
                  ? 'Defina uma senha para fazer login com email e senha' 
                  : 'Altere sua senha de acesso'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.loginMethod === 'google' ? (
                <form onSubmit={handleSetGooglePassword} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Atenção:</strong> Você está usando login com Google. 
                      Defina uma senha para poder fazer login com email e senha também.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="googleNewPassword">Nova Senha</Label>
                    <div className="relative">
                      <input
                        id="googleNewPassword"
                        type={showGooglePasswords.new ? "text" : "password"}
                        value={googlePasswordData.newPassword}
                        onChange={(e) => setGooglePasswordData({ ...googlePasswordData, newPassword: e.target.value })}
                        placeholder="Digite a nova senha (mínimo 6 caracteres)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                        disabled={setGooglePasswordMutation.isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowGooglePasswords({ ...showGooglePasswords, new: !showGooglePasswords.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showGooglePasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="googleConfirmPassword">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <input
                        id="googleConfirmPassword"
                        type={showGooglePasswords.confirm ? "text" : "password"}
                        value={googlePasswordData.confirmPassword}
                        onChange={(e) => setGooglePasswordData({ ...googlePasswordData, confirmPassword: e.target.value })}
                        placeholder="Confirme a nova senha"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                        disabled={setGooglePasswordMutation.isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowGooglePasswords({ ...showGooglePasswords, confirm: !showGooglePasswords.confirm })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showGooglePasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={setGooglePasswordMutation.isPending}
                    className="w-full"
                  >
                    {setGooglePasswordMutation.isPending ? "Definindo..." : "Definir Senha"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Digite sua senha atual"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      disabled={changePasswordMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Digite a nova senha (mínimo 6 caracteres)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      disabled={changePasswordMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirme a nova senha"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      disabled={changePasswordMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={changePasswordMutation.isPending}
                  className="w-full"
                >
                  {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
                </Button>
              </form>
              )}
            </CardContent>
          </Card>

          {/* Ações da Conta */}
          <Card>
            <CardHeader>
              <CardTitle>Ações da Conta</CardTitle>
              <CardDescription>Gerencie sua sessão e acesso ao sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair do Sistema
              </Button>
            </CardContent>
          </Card>
        </div>
        </div>
      </PageWrapper>
    </>
  );
}
