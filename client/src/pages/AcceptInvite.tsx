import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Loader2, Mail, User, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import { getLoginUrl } from "@/const";

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);

  const { data: validation, isLoading: validating } = trpc.invitations.validateToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const acceptInviteMutation = trpc.invitations.acceptInvite.useMutation({
    onSuccess: () => {
      toast.success("Conta criada com sucesso!");
      setIsAccepting(true);
      setTimeout(() => {
        window.location.href = getLoginUrl();
      }, 2000);
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleAcceptInvite = () => {
    if (!name.trim()) {
      toast.error("Por favor, informe seu nome");
      return;
    }

    if (!token) {
      toast.error("Token inválido");
      return;
    }

    acceptInviteMutation.mutate({ token, name: name.trim() });
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
              <p className="text-slate-600">Validando convite...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!validation?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-8 h-8" />
              <CardTitle>Convite Inválido</CardTitle>
            </div>
            <CardDescription>{validation?.reason || "Este convite não é válido"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              Ir para a Página Inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAccepting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-8 h-8" />
              <CardTitle>Conta Criada!</CardTitle>
            </div>
            <CardDescription>Redirecionando para o login...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-6">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Bem-vindo ao Sistema!</CardTitle>
            <CardDescription className="mt-2">
              Você foi convidado para se juntar ao Sistema de Gestão de Tempo para Professores
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informações do Convite */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">E-mail</p>
                <p className="text-sm text-blue-700">{validation.invitation?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {validation.invitation?.role === "admin" ? (
                <Shield className="w-5 h-5 text-purple-600" />
              ) : (
                <User className="w-5 h-5 text-blue-600" />
              )}
              <div>
                <p className="text-sm font-medium text-blue-900">Papel no Sistema</p>
                <p className="text-sm text-blue-700">
                  {validation.invitation?.role === "admin" ? "Administrador" : "Professor"}
                </p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                placeholder="Digite seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAcceptInvite();
                  }
                }}
              />
            </div>

            <Button
              onClick={handleAcceptInvite}
              disabled={acceptInviteMutation.isPending}
              className="w-full"
              size="lg"
            >
              {acceptInviteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aceitar Convite e Criar Conta
                </>
              )}
            </Button>
          </div>

          {/* Informação Adicional */}
          <div className="text-center text-xs text-slate-500">
            Ao aceitar o convite, você concorda em fazer parte do sistema e poderá acessá-lo
            fazendo login com sua conta.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
