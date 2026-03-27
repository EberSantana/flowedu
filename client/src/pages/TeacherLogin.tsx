import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, Users, BarChart2, X, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
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
} from "lucide-react";

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
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");

  const utils = trpc.useUtils();

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
    if (attempts) setLoginAttempts(parseInt(attempts));
  }, []);

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

  const { data: sessionData } = trpc.auth.me.useQuery(undefined, {
    enabled: isVerifyingSession,
    refetchInterval: isVerifyingSession ? 500 : false,
  });

  useEffect(() => {
    if (isVerifyingSession && sessionData) {
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("loginBlockUntil");
      window.location.href = "/dashboard";
    }
  }, [isVerifyingSession, sessionData]);

  const loginMutation = trpc.auth.loginTeacher.useMutation({
    onSuccess: async (data) => {
      setWelcomeName(data.user.name || "Professor");
      setShowWelcome(true);
      setIsLoggingIn(true);
      await utils.auth.me.invalidate();
      setIsVerifyingSession(true);
      setTimeout(() => { window.location.href = "/dashboard"; }, 3500);
    },
    onError: (error) => {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem("loginAttempts", newAttempts.toString());
      if (newAttempts >= 5) {
        const blockUntil = Date.now() + 5 * 60 * 1000;
        localStorage.setItem("loginBlockUntil", blockUntil.toString());
        setIsBlocked(true);
        setBlockTimeRemaining(300);
        toast.error("Conta temporariamente bloqueada", {
          description: "Muitas tentativas de login. Aguarde 5 minutos.",
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
        });
      } else {
        toast.error(error.message, { description: `Tentativa ${newAttempts} de 5` });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) {
      toast.error("Conta bloqueada", {
        description: `Aguarde ${Math.floor(blockTimeRemaining / 60)}:${(blockTimeRemaining % 60).toString().padStart(2, "0")} para tentar novamente.`,
      });
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) { toast.error("Digite seu e-mail"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("E-mail inválido", { description: "Digite um endereço de e-mail válido." });
      return;
    }
    if (!password) { toast.error("Digite sua senha"); return; }
    if (password.length < 6) {
      toast.error("Senha muito curta", { description: "A senha deve ter pelo menos 6 caracteres." });
      return;
    }
    loginMutation.mutate({ email: trimmedEmail, password });
  };

  // Tela de boas-vindas ao professor
  if (isLoggingIn) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #080d1a 0%, #0d1528 50%, #080d1a 100%)" }}
      >
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,180,140,0.12) 0%, transparent 70%)" }} />
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,230,180,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,230,180,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative z-10 text-center max-w-md w-full">
          {/* Ícone animado */}
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(0,230,180,0.12)", border: "2px solid rgba(0,230,180,0.4)", boxShadow: "0 0 40px rgba(0,230,180,0.2)" }}
          >
            <GraduationCap className="h-14 w-14" style={{ color: "#00e6b4" }} />
          </div>

          {/* Saudação */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" style={{ color: "#00e6b4" }} />
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#00e6b4" }}>Bem-vindo de volta</span>
            <Sparkles className="h-5 w-5" style={{ color: "#00e6b4" }} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-1">{welcomeName}</h2>
          <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>Portal do Professor · FlowEdu</p>

          {/* Cards de funcionalidades */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: BookOpen, label: "Disciplinas" },
              { icon: Users, label: "Turmas" },
              { icon: BarChart2, label: "Relatórios" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl p-3 flex flex-col items-center gap-2" style={{ background: "rgba(0,230,180,0.07)", border: "1px solid rgba(0,230,180,0.15)" }}>
                <Icon className="h-5 w-5" style={{ color: "#00e6b4" }} />
                <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Carregando */}
          <div className="flex items-center justify-center gap-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#00e6b4" }} />
            <span className="text-sm">Carregando seu painel...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #080d1a 0%, #0d1528 50%, #080d1a 100%)" }}
    >
      {/* Glow de fundo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,140,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Grid sutil */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,230,180,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,230,180,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Voltar */}
        <Link href="/">
          <button
            className="flex items-center gap-2 mb-8 text-sm font-medium transition-colors"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#00e6b4")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </button>
        </Link>

        {/* Card principal */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(13,21,40,0.9)",
            border: "1px solid rgba(0,230,180,0.15)",
            boxShadow: "0 0 40px rgba(0,0,0,0.5), 0 0 80px rgba(0,180,140,0.05)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                style={{
                  background: "linear-gradient(135deg, #00c896 0%, #0080ff 100%)",
                  boxShadow: "0 0 20px rgba(0,200,150,0.4)",
                }}
              >
                F
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-white">FlowEdu</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Portal do Professor</div>
              </div>
            </div>

            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(0,230,180,0.1)", border: "1px solid rgba(0,230,180,0.2)" }}
            >
              <Shield className="h-7 w-7" style={{ color: "#00e6b4" }} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Acesso Seguro</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
              Entre com suas credenciais de professor
            </p>
          </div>

          {/* Alerta de bloqueio */}
          {isBlocked && (
            <div
              className="rounded-xl p-4 mb-6 flex items-start gap-3"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-400 text-sm">Conta Temporariamente Bloqueada</p>
                <p className="text-red-400/70 text-xs mt-1">
                  Aguarde{" "}
                  <span className="font-mono font-bold">
                    {Math.floor(blockTimeRemaining / 60)}:{(blockTimeRemaining % 60).toString().padStart(2, "0")}
                  </span>{" "}
                  para tentar novamente.
                </p>
              </div>
            </div>
          )}

          {/* Aviso de tentativas */}
          {loginAttempts > 0 && loginAttempts < 5 && !isBlocked && (
            <div
              className="rounded-xl p-3 mb-6 flex items-center gap-2"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              <Info className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span className="text-amber-400 text-xs">
                Tentativa {loginAttempts} de 5. Após 5 tentativas, sua conta será bloqueada.
              </span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* E-mail */}
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                E-mail Institucional
              </Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-5 w-5 pointer-events-none z-10" style={{ color: "#00e6b4" }} />
                <input
                  type="email"
                  placeholder="professor@escola.edu.br"
                  className="w-full h-12 rounded-lg pl-11 pr-4 text-sm outline-none transition-colors"
                  style={{
                    background: "#0d1a2e",
                    border: "1px solid rgba(0,230,180,0.2)",
                    color: "white",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,180,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,230,180,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,180,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
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
                <Label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Senha
                </Label>
                <Link href="/esqueci-senha">
                  <span className="text-xs font-medium transition-colors cursor-pointer" style={{ color: "#00e6b4" }}>
                    Esqueceu a senha?
                  </span>
                </Link>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-5 w-5 pointer-events-none z-10" style={{ color: "#00e6b4" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full h-12 rounded-lg pl-11 pr-11 text-sm outline-none transition-colors"
                  style={{
                    background: "#0d1a2e",
                    border: "1px solid rgba(0,230,180,0.2)",
                    color: "white",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,180,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,230,180,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,180,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginMutation.isPending || isBlocked}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 transition-colors z-10"
                  style={{ color: "#00e6b4" }}
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
                className="border-white/20 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
              />
              <label
                htmlFor="remember"
                className="text-sm cursor-pointer select-none"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Manter-me conectado neste dispositivo
              </label>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={loginMutation.isPending || isBlocked}
              className="w-full h-12 rounded-xl font-semibold text-base text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loginMutation.isPending || isBlocked
                  ? "rgba(0,200,150,0.4)"
                  : "linear-gradient(135deg, #00c896 0%, #0080ff 100%)",
                boxShadow: loginMutation.isPending || isBlocked ? "none" : "0 0 20px rgba(0,200,150,0.3)",
              }}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Entrar no Sistema
                </>
              )}
            </button>
          </form>

          {/* Link cadastro */}
          <div className="text-center text-sm mt-6" style={{ color: "rgba(255,255,255,0.4)" }}>
            Não possui uma conta?{" "}
            <Link href="/cadastro-professor">
              <span className="font-semibold cursor-pointer transition-colors" style={{ color: "#00e6b4" }}>
                Solicitar Acesso
              </span>
            </Link>
          </div>

          {/* Segurança */}
          <div
            className="flex items-center justify-center gap-2 text-xs mt-6 pt-6"
            style={{ color: "rgba(255,255,255,0.25)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Conexão protegida por criptografia SSL/TLS</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.2)" }}>
          © 2026 FlowEdu · Onde a Educação Flui
        </p>
      </div>
    </div>
  );
}
