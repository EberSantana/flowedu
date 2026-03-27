import { useState } from "react";
import { useLocation } from "wouter";
import { GraduationCap, ArrowLeft, LogIn, Hash, Lock, Eye, EyeOff, Shield, Loader2, BookOpen, BarChart2, ClipboardList, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function StudentLogin() {
  const [, setLocation] = useLocation();
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");

  const loginMutation = trpc.auth.loginStudent.useMutation({
    onSuccess: (data) => {
      if (data?.success) {
        setWelcomeName(data.student?.fullName || "Aluno");
        setShowWelcome(true);
        setTimeout(() => setLocation("/student-dashboard"), 3500);
      } else {
        toast.error("Erro inesperado no login. Tente novamente.");
        setIsLoading(false);
      }
    },
    onError: (error) => {
      let errorMessage = "Erro ao fazer login. Tente novamente.";
      if (error.message) {
        if (error.message.includes("Unexpected token") || error.message.includes("<!DOCTYPE")) {
          errorMessage = "Erro de conexão com o servidor. Recarregue a página e tente novamente.";
        } else if (error.message.includes("fetch") || error.message.includes("network")) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedRegistration = registrationNumber.trim();
    const trimmedPassword = password.trim();
    if (!trimmedRegistration) { toast.error("Digite seu número de matrícula"); return; }
    if (!trimmedPassword) { toast.error("Digite sua senha"); return; }
    setIsLoading(true);
    loginMutation.mutate({ registrationNumber: trimmedRegistration, password: trimmedPassword });
  };

  // Tela de boas-vindas ao aluno
  if (showWelcome) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #080d1a 0%, #0d1528 50%, #080d1a 100%)" }}
      >
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,180,220,0.12) 0%, transparent 70%)" }} />
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative z-10 text-center max-w-md w-full">
          {/* Ícone */}
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(0,229,192,0.12)", border: "2px solid rgba(0,229,192,0.4)", boxShadow: "0 0 40px rgba(0,229,192,0.2)" }}
          >
            <GraduationCap className="h-14 w-14" style={{ color: "#00e5c0" }} />
          </div>

          {/* Saudação */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" style={{ color: "#00e5c0" }} />
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#00e5c0" }}>Bem-vindo</span>
            <Sparkles className="h-5 w-5" style={{ color: "#00e5c0" }} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-1">{welcomeName}</h2>
          <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>Portal do Aluno · FlowEdu</p>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: BookOpen, label: "Materiais" },
              { icon: ClipboardList, label: "Exercícios" },
              { icon: BarChart2, label: "Progresso" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl p-3 flex flex-col items-center gap-2" style={{ background: "rgba(0,229,192,0.07)", border: "1px solid rgba(0,229,192,0.15)" }}>
                <Icon className="h-5 w-5" style={{ color: "#00e5c0" }} />
                <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Carregando */}
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#00e5c0" }} />
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Carregando seu painel...</span>
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
      {/* Glow teal (aluno) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,220,0.08) 0%, transparent 70%)" }}
      />
      {/* Grid sutil */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Voltar */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 mb-8 text-sm font-medium transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#00e5c0")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </button>

        {/* Card principal */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(13,21,40,0.9)",
            border: "1px solid rgba(0,200,255,0.15)",
            boxShadow: "0 0 40px rgba(0,0,0,0.5), 0 0 80px rgba(0,180,220,0.05)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo FlowEdu */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                style={{
                  background: "linear-gradient(135deg, #00e5c0 0%, #1a6fff 100%)",
                  boxShadow: "0 0 20px rgba(0,229,192,0.4)",
                }}
              >
                F
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-white">FlowEdu</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Portal do Aluno</div>
              </div>
            </div>

            {/* Ícone central */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(0,229,192,0.1)", border: "1px solid rgba(0,229,192,0.2)" }}
            >
              <GraduationCap className="h-8 w-8" style={{ color: "#00e5c0" }} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Portal do Aluno</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
              Entre com sua matrícula e senha
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Matrícula */}
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                Número de Matrícula
              </Label>
              <div className="relative flex items-center">
                <Hash className="absolute left-3 h-5 w-5 pointer-events-none z-10" style={{ color: "#00e5c0" }} />
                <input
                  type="text"
                  placeholder="Ex: 2024001"
                  className="w-full h-12 rounded-lg pl-11 pr-4 text-sm outline-none transition-colors"
                  style={{
                    background: "#0d1a2e",
                    border: "1px solid rgba(0,229,192,0.2)",
                    color: "white",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,229,192,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,229,192,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,229,192,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                Senha
              </Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-5 w-5 pointer-events-none z-10" style={{ color: "#00e5c0" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full h-12 rounded-lg pl-11 pr-11 text-sm outline-none transition-colors"
                  style={{
                    background: "#0d1a2e",
                    border: "1px solid rgba(0,229,192,0.2)",
                    color: "white",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,229,192,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,229,192,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,229,192,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 transition-colors z-10"
                  style={{ color: "#00e5c0" }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                Sua senha padrão é o mesmo número da sua matrícula
              </p>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isLoading
                  ? "rgba(0,200,150,0.4)"
                  : "linear-gradient(135deg, #00e5c0 0%, #1a6fff 100%)",
                color: isLoading ? "white" : "#080d1a",
                boxShadow: isLoading ? "none" : "0 0 20px rgba(0,229,192,0.3)",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Entrar
                </>
              )}
            </button>
          </form>

          {/* Dica de primeiro acesso */}
          <div
            className="rounded-xl p-4 mt-6"
            style={{ background: "rgba(0,229,192,0.06)", border: "1px solid rgba(0,229,192,0.12)" }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: "#00e5c0" }}>
              Primeira vez acessando?
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Use sua matrícula como usuário e senha. Exemplo: se sua matrícula é <strong style={{ color: "rgba(255,255,255,0.6)" }}>2024001</strong>, use ela como senha também.
            </p>
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
