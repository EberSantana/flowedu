import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  Clock,
  AlertCircle,
  Shield,
} from "lucide-react";

type RegistrationStatus = "form" | "pending";

export default function TeacherRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>("form");

  const registerMutation = trpc.auth.registerTeacher.useMutation({
    onSuccess: () => {
      toast.success("Solicitação enviada!");
      setRegistrationStatus("pending");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) { toast.error("Digite seu nome"); return; }
    if (trimmedName.length < 2) { toast.error("Nome deve ter pelo menos 2 caracteres"); return; }
    if (!trimmedEmail) { toast.error("Digite seu e-mail"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) { toast.error("E-mail inválido"); return; }
    if (password.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }

    registerMutation.mutate({ name: trimmedName, email: trimmedEmail, password });
  };

  // ─── Tela de pendente ───────────────────────────────────────────────────────
  if (registrationStatus === "pending") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #080d1a 0%, #0d1528 50%, #080d1a 100%)" }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,140,0.08) 0%, transparent 70%)" }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(0,230,180,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,230,180,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="w-full max-w-md relative z-10">
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: "rgba(13,21,40,0.9)",
              border: "1px solid rgba(0,230,180,0.15)",
              boxShadow: "0 0 40px rgba(0,0,0,0.5), 0 0 80px rgba(0,180,140,0.05)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(245,158,11,0.15)", border: "2px solid rgba(245,158,11,0.3)" }}
            >
              <Clock className="h-10 w-10 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Solicitação Enviada!</h2>
            <p className="mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
              Sua solicitação de cadastro foi enviada e está aguardando aprovação do administrador.
            </p>

            <div
              className="rounded-xl p-4 mb-6 text-left"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-400 text-sm mb-1">O que acontece agora?</p>
                  <ul className="space-y-1 text-amber-400/70 text-xs">
                    <li>• O administrador será notificado</li>
                    <li>• Você receberá um e-mail quando sua conta for aprovada</li>
                    <li>• Após a aprovação, poderá fazer login normalmente</li>
                  </ul>
                </div>
              </div>
            </div>

            <Link href="/login-professor">
              <button
                className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: "rgba(0,230,180,0.1)",
                  border: "1px solid rgba(0,230,180,0.2)",
                  color: "#00e6b4",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,230,180,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,230,180,0.1)"; }}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Login
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Formulário de cadastro ─────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #080d1a 0%, #0d1528 50%, #080d1a 100%)" }}
    >
      {/* Glow de fundo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,140,0.08) 0%, transparent 70%)" }}
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
        <Link href="/login-professor">
          <button
            className="flex items-center gap-2 mb-8 text-sm font-medium transition-colors"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#00e6b4")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
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
              <UserPlus className="h-7 w-7" style={{ color: "#00e6b4" }} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Solicitar Cadastro</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
              Crie sua conta de professor no sistema
            </p>
          </div>

          {/* Aviso de aprovação */}
          <div
            className="rounded-xl p-3 mb-6 flex items-start gap-2"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
          >
            <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <span className="text-blue-400 text-xs">
              Seu cadastro será enviado para aprovação do administrador antes de liberar o acesso.
            </span>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome */}
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                Nome Completo
              </Label>
              <div className="relative flex items-center">
                <User className="absolute left-3 h-5 w-5 pointer-events-none z-10" style={{ color: "rgba(255,255,255,0.3)" }} />
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  className="w-full h-12 rounded-lg pl-11 pr-4 text-sm outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,180,0.4)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={registerMutation.isPending}
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>

            {/* E-mail */}
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                E-mail
              </Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-5 w-5 pointer-events-none z-10" style={{ color: "rgba(255,255,255,0.3)" }} />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full h-12 rounded-lg pl-11 pr-4 text-sm outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,180,0.4)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={registerMutation.isPending}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                Senha
              </Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-5 w-5 pointer-events-none z-10" style={{ color: "rgba(255,255,255,0.3)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-12 rounded-lg pl-11 pr-11 text-sm outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,180,0.4)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={registerMutation.isPending}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 transition-colors z-10"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {/* Indicador de força */}
              {password.length > 0 && password.length < 6 && (
                <p className="text-xs" style={{ color: "rgba(239,68,68,0.8)" }}>
                  Faltam {6 - password.length} caractere{6 - password.length !== 1 ? "s" : ""}
                </p>
              )}
              {password.length >= 6 && (
                <p className="text-xs flex items-center gap-1" style={{ color: "#00e6b4" }}>
                  <CheckCircle className="h-3 w-3" /> Senha válida
                </p>
              )}
            </div>

            {/* Botão de Cadastro */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full h-12 rounded-xl font-semibold text-base text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: registerMutation.isPending
                  ? "rgba(0,200,150,0.4)"
                  : "linear-gradient(135deg, #00c896 0%, #0080ff 100%)",
                boxShadow: registerMutation.isPending ? "none" : "0 0 20px rgba(0,200,150,0.3)",
              }}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Enviando solicitação...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Solicitar Cadastro
                </>
              )}
            </button>
          </form>

          {/* Link para login */}
          <div className="text-center text-sm mt-6" style={{ color: "rgba(255,255,255,0.4)" }}>
            Já tem uma conta?{" "}
            <Link href="/login-professor">
              <span className="font-semibold cursor-pointer transition-colors" style={{ color: "#00e6b4" }}>
                Fazer login
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
