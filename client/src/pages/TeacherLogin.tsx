import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  LogIn, 
  Mail, 
  Lock, 
  ArrowLeft, 
  Loader2, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Shield, 
  AlertTriangle,
  Info,
  GraduationCap
} from "lucide-react";
import { getLoginUrl } from "@/const";

export default function TeacherLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  const utils = trpc.useUtils();

  // Verificar se há bloqueio salvo no localStorage
  useEffect(() => {
    const blockUntil = localStorage.getItem("loginBlockUntil");
    if (blockUntil) {
      const blockTime = parseInt(blockUntil);
      const now = Date.now();
      if (blockTime > now) {
        setIsBlocked(true);
        setBlockTimeRemaining(Math.ceil((blockTime - now) / 1000));
      } else {
        localStorage.removeItem("loginBlockUntil");
        localStorage.removeItem("loginAttempts");
      }
    }
    
    const attempts = localStorage.getItem("loginAttempts");
    if (attempts) {
      setLoginAttempts(parseInt(attempts));
    }
  }, []);

  // Contador regressivo para desbloqueio
  useEffect(() => {
    if (isBlocked && blockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setBlockTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            localStorage.removeItem("loginBlockUntil");
            localStorage.removeItem("loginAttempts");
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isBlocked, blockTimeRemaining]);

  // Query para verificar sessão após login
  const { data: sessionData } = trpc.auth.me.useQuery(undefined, {
    enabled: isVerifyingSession,
    refetchInterval: isVerifyingSession ? 500 : false,
  });

  // Redirecionar quando sessão for confirmada
  useEffect(() => {
    if (isVerifyingSession && sessionData) {
      // Limpar tentativas após login bem-sucedido
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("loginBlockUntil");
      window.location.href = "/dashboard";
    }
  }, [isVerifyingSession, sessionData]);

  const loginMutation = trpc.auth.loginTeacher.useMutation({
    onSuccess: async (data) => {
      toast.success(`Bem-vindo, ${data.user.name}!`, {
        description: "Login realizado com sucesso.",
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      });
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
      // Incrementar tentativas de login
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem("loginAttempts", newAttempts.toString());
      
      // Bloquear após 5 tentativas
      if (newAttempts >= 5) {
        const blockDuration = 5 * 60 * 1000; // 5 minutos
        const blockUntil = Date.now() + blockDuration;
        localStorage.setItem("loginBlockUntil", blockUntil.toString());
        setIsBlocked(true);
        setBlockTimeRemaining(300);
        toast.error("Conta temporariamente bloqueada", {
          description: "Muitas tentativas de login. Aguarde 5 minutos.",
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
        });
      } else {
        toast.error(error.message, {
          description: `Tentativa ${newAttempts} de 5`,
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isBlocked) {
      toast.error("Conta bloqueada", {
        description: `Aguarde ${Math.floor(blockTimeRemaining / 60)}:${(blockTimeRemaining % 60).toString().padStart(2, '0')} para tentar novamente.`,
      });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error("Digite seu e-mail");
      return;
    }

    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("E-mail inválido", {
        description: "Digite um endereço de e-mail válido.",
      });
      return;
    }

    if (!password) {
      toast.error("Digite sua senha");
      return;
    }

    if (password.length < 6) {
      toast.error("Senha muito curta", {
        description: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    loginMutation.mutate({
      email: trimmedEmail,
      password: password,
    });
  };

  // Tela de sucesso após login
  if (isLoggingIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center border-0 shadow-2xl">
          <CardContent className="pt-10 pb-10">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Autenticação Confirmada</h2>
            <p className="text-muted-foreground mb-6">
              Sua sessão foi iniciada com segurança.
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-medium">Redirecionando para o sistema...</span>
            </div>
            <div className="mt-6 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Conexão segura estabelecida</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Lado esquerdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">FlowEdu</h1>
              <p className="text-white/70 text-sm">Onde a educação flui</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Bem-vindo de volta!
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Acesse sua conta para gerenciar suas turmas, disciplinas e acompanhar o progresso dos seus alunos.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-white mb-1">100%</div>
              <div className="text-white/70 text-sm">Seguro e Criptografado</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-white mb-1">24/7</div>
              <div className="text-white/70 text-sm">Disponível Online</div>
            </div>
          </div>
        </div>
        
        <div className="text-white/60 text-sm">
          © 2026 FlowEdu. Todos os direitos reservados.
        </div>
      </div>

      {/* Lado direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Link voltar - Mobile */}
          <Link href="/">
            <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao início
            </Button>
          </Link>

          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Acesso Seguro</CardTitle>
              <CardDescription className="text-muted-foreground">
                Entre com suas credenciais de professor
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Alerta de bloqueio */}
              {isBlocked && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-destructive">Conta Temporariamente Bloqueada</h4>
                      <p className="text-sm text-destructive/80 mt-1">
                        Muitas tentativas de login incorretas. Aguarde{" "}
                        <span className="font-mono font-bold">
                          {Math.floor(blockTimeRemaining / 60)}:{(blockTimeRemaining % 60).toString().padStart(2, '0')}
                        </span>{" "}
                        para tentar novamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso de tentativas */}
              {loginAttempts > 0 && loginAttempts < 5 && !isBlocked && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
                    <Info className="h-4 w-4" />
                    <span>Tentativa {loginAttempts} de 5. Após 5 tentativas, sua conta será bloqueada temporariamente.</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* E-mail */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">E-mail Institucional</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="professor@escola.edu.br"
                      className="pl-11 h-12 bg-muted/50 border-muted-foreground/20 focus:border-primary"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loginMutation.isPending || isBlocked}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground font-medium">Senha</Label>
                    <Link href="/esqueci-senha" className="text-sm text-primary hover:underline font-medium">
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-11 pr-11 h-12 bg-muted/50 border-muted-foreground/20 focus:border-primary"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loginMutation.isPending || isBlocked}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Lembrar-me */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isBlocked}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground cursor-pointer select-none"
                  >
                    Manter-me conectado neste dispositivo
                  </label>
                </div>

                {/* Botão de Login */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25"
                  disabled={loginMutation.isPending || isBlocked}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-2" />
                      Entrar no Sistema
                    </>
                  )}
                </Button>
              </form>

              {/* Divisor */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted-foreground/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-card text-muted-foreground">ou continue com</span>
                </div>
              </div>

              {/* Login Social */}
              <Button
                variant="outline"
                className="w-full h-12 border-muted-foreground/20 hover:bg-muted/50"
                onClick={() => window.location.href = getLoginUrl()}
                disabled={isBlocked}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Entrar com Google
              </Button>

              {/* Link para cadastro */}
              <div className="text-center text-sm text-muted-foreground pt-2">
                Não possui uma conta?{" "}
                <Link href="/cadastro-professor" className="text-primary hover:underline font-semibold">
                  Solicitar Acesso
                </Link>
              </div>

              {/* Indicador de segurança */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t border-muted-foreground/10">
                <Shield className="h-3.5 w-3.5" />
                <span>Conexão protegida por criptografia SSL/TLS</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
