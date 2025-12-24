import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, Mail, Lock, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function TeacherLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);

  const utils = trpc.useUtils();

  // Query para verificar sessão após login
  const { data: sessionData } = trpc.auth.me.useQuery(undefined, {
    enabled: isVerifyingSession,
    refetchInterval: isVerifyingSession ? 500 : false,
  });

  // Redirecionar quando sessão for confirmada
  useEffect(() => {
    if (isVerifyingSession && sessionData) {
      window.location.href = "/dashboard";
    }
  }, [isVerifyingSession, sessionData]);

  const loginMutation = trpc.auth.loginTeacher.useMutation({
    onSuccess: async (data) => {
      toast.success(`Bem-vindo, ${data.user.name}!`);
      setIsLoggingIn(true);
      
      // Invalidar cache e começar verificação de sessão
      await utils.auth.me.invalidate();
      setIsVerifyingSession(true);
      
      // Fallback: redirecionar após 3 segundos se verificação não funcionar
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 3000);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error("Digite seu e-mail");
      return;
    }

    if (!password) {
      toast.error("Digite sua senha");
      return;
    }

    loginMutation.mutate({
      email: trimmedEmail,
      password: password,
    });
  };

  if (isLoggingIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Realizado!</h2>
            <p className="text-gray-600 mb-4">
              Redirecionando para o sistema...
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
              <LogIn className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Login do Professor</CardTitle>
            <CardDescription>
              Entre com seu e-mail e senha
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    disabled={loginMutation.isPending}
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
                    placeholder="Sua senha"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Link Esqueci Senha */}
              <div className="text-right">
                <Link href="/esqueci-senha" className="text-sm text-purple-600 hover:underline">
                  Esqueci minha senha
                </Link>
              </div>

              {/* Botão de Login */}
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            {/* Divisor */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>

            {/* Login com Google/GitHub */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Entrar com Google ou GitHub
            </Button>

            {/* Link para cadastro */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Não tem uma conta?{" "}
              <Link href="/cadastro-professor" className="text-purple-600 hover:underline font-medium">
                Cadastre-se
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
