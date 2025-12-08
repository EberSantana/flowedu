import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { User, Mail, Calendar, Shield, LogOut, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";
import { getLoginUrl } from "@/const";
import Sidebar from "@/components/Sidebar";

export default function Profile() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logout realizado com sucesso!");
    setLocation("/");
  };

  if (loading) {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 lg:ml-64">
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
      </div>
    </>
  );
}
