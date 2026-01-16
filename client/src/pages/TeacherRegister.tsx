import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, Mail, Lock, User, ArrowLeft, Loader2, CheckCircle, Eye, EyeOff, Ticket, Clock, AlertCircle } from "lucide-react";

type RegistrationStatus = 'form' | 'approved' | 'pending';

export default function TeacherRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('form');

  const registerMutation = trpc.auth.registerTeacher.useMutation({
    onSuccess: (data) => {
      if (data.pending) {
        // Cadastro pendente de aprovação
        toast.success("Solicitação enviada!");
        setRegistrationStatus('pending');
      } else {
        // Cadastro aprovado automaticamente (com código de convite válido)
        toast.success("Conta criada com sucesso!");
        setRegistrationStatus('approved');
        
        // Redirecionar após 1.5 segundos
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedInviteCode = inviteCode.trim().toUpperCase();

    if (!trimmedName) {
      toast.error("Digite seu nome");
      return;
    }

    if (trimmedName.length < 2) {
      toast.error("Nome deve ter pelo menos 2 caracteres");
      return;
    }

    if (!trimmedEmail) {
      toast.error("Digite seu e-mail");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("E-mail inválido");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    registerMutation.mutate({
      name: trimmedName,
      email: trimmedEmail,
      password: password,
      inviteCode: trimmedInviteCode || undefined,
    });
  };

  // Tela de cadastro aprovado (com código de convite)
  if (registrationStatus === 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Conta Criada!</h2>
            <p className="text-gray-600 mb-4">
              Sua conta foi criada com sucesso. Redirecionando para o sistema...
            </p>
            <div className="flex items-center justify-center gap-2 text-purple-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Aguarde...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de cadastro pendente (sem código de convite)
  if (registrationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação Enviada!</h2>
            <p className="text-gray-600 mb-4">
              Sua solicitação de cadastro foi enviada com sucesso e está aguardando aprovação do administrador.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-left text-sm text-amber-800">
                  <p className="font-medium mb-1">O que acontece agora?</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li>O administrador será notificado</li>
                    <li>Você receberá um e-mail quando sua conta for aprovada</li>
                    <li>Após a aprovação, poderá fazer login normalmente</li>
                  </ul>
                </div>
              </div>
            </div>
            <Link href="/login-professor">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Link voltar */}
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Cadastro de Professor</CardTitle>
            <CardDescription>
              Crie sua conta para acessar o sistema
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Código de Convite (opcional) */}
              <div className="space-y-2">
                <Label htmlFor="inviteCode" className="flex items-center gap-2">
                  Código de Convite
                  <span className="text-xs text-gray-400 font-normal">(opcional)</span>
                </Label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="Ex: ABC123"
                    className="pl-10 uppercase"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    disabled={registerMutation.isPending}
                    autoComplete="off"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Com código de convite válido, sua conta é aprovada automaticamente
                </p>
              </div>

              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    className="pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={registerMutation.isPending}
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={registerMutation.isPending}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={registerMutation.isPending}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 6 && (
                  <p className="text-xs text-red-500">Faltam {6 - password.length} caracteres</p>
                )}
                {password.length >= 6 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Senha válida
                  </p>
                )}
              </div>

              {/* Aviso sobre aprovação */}
              {!inviteCode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    <strong>Sem código de convite?</strong> Seu cadastro será enviado para aprovação do administrador.
                  </p>
                </div>
              )}

              {/* Botão de Cadastro */}
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {inviteCode ? "Criar Conta" : "Solicitar Cadastro"}
                  </>
                )}
              </Button>
            </form>

            {/* Link para login */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link href="/login-professor" className="text-purple-600 hover:underline font-medium">
                Fazer login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
