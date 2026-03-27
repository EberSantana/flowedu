import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2, CheckCircle, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const requestReset = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("E-mail enviado! Verifique sua caixa de entrada.");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao solicitar recuperação de senha");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Por favor, digite seu e-mail");
      return;
    }
    requestReset.mutate({ email: email.trim() });
  };

  const bgStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #080d1a 0%, #0a1628 40%, #0d1f38 70%, #080d1a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    position: "relative",
    overflow: "hidden",
  };

  const gridStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(0,230,180,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,230,180,0.04) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(10,22,45,0.85)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(0,230,180,0.15)",
    borderRadius: "1.5rem",
    padding: "2.5rem",
    width: "100%",
    maxWidth: "440px",
    position: "relative",
    zIndex: 1,
    boxShadow: "0 0 60px rgba(0,230,180,0.08), 0 25px 50px rgba(0,0,0,0.5)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#0d1a2e",
    border: "1px solid rgba(0,230,180,0.2)",
    borderRadius: "0.75rem",
    padding: "0.875rem 1rem 0.875rem 3rem",
    color: "#e2e8f0",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  };

  if (submitted) {
    return (
      <div style={bgStyle}>
        <div style={gridStyle} />
        {/* Glow effects */}
        <div style={{ position: "absolute", top: "20%", left: "15%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(0,230,180,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "15%", width: "250px", height: "250px", background: "radial-gradient(circle, rgba(0,120,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={cardStyle}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem", justifyContent: "center" }}>
            <div style={{ width: "44px", height: "44px", background: "linear-gradient(135deg, #00e6b4, #0078ff)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.2rem", color: "#fff" }}>F</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#fff" }}>FlowEdu</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Recuperação de Senha</div>
            </div>
          </div>

          {/* Success icon */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ width: "72px", height: "72px", background: "linear-gradient(135deg, rgba(0,230,180,0.2), rgba(0,230,180,0.05))", borderRadius: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", border: "1px solid rgba(0,230,180,0.3)" }}>
              <CheckCircle style={{ width: "36px", height: "36px", color: "#00e6b4" }} />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>E-mail Enviado!</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Se o e-mail <strong style={{ color: "#00e6b4" }}>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
            </p>
          </div>

          {/* Tips */}
          <div style={{ background: "rgba(0,230,180,0.05)", border: "1px solid rgba(0,230,180,0.1)", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.5rem" }}>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.8 }}>
              • Verifique sua caixa de entrada e também a pasta de spam<br />
              • O link é válido por 1 hora<br />
              • Se não receber o e-mail em alguns minutos, tente novamente
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/login-professor" style={{ flex: 1 }}>
              <button style={{ width: "100%", padding: "0.875rem", background: "transparent", border: "1px solid rgba(0,230,180,0.3)", borderRadius: "0.75rem", color: "#00e6b4", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>
                Voltar ao Login
              </button>
            </Link>
            <button
              onClick={() => { setSubmitted(false); setEmail(""); }}
              style={{ flex: 1, padding: "0.875rem", background: "linear-gradient(135deg, #00e6b4, #0078ff)", border: "none", borderRadius: "0.75rem", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={bgStyle}>
      <div style={gridStyle} />
      {/* Glow effects */}
      <div style={{ position: "absolute", top: "20%", left: "15%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(0,230,180,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "15%", width: "250px", height: "250px", background: "radial-gradient(circle, rgba(0,120,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem", justifyContent: "center" }}>
          <div style={{ width: "44px", height: "44px", background: "linear-gradient(135deg, #00e6b4, #0078ff)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.2rem", color: "#fff" }}>F</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#fff" }}>FlowEdu</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Recuperação de Senha</div>
          </div>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: "72px", height: "72px", background: "linear-gradient(135deg, rgba(0,230,180,0.2), rgba(0,120,255,0.1))", borderRadius: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", border: "1px solid rgba(0,230,180,0.25)" }}>
            <Shield style={{ width: "36px", height: "36px", color: "#00e6b4" }} />
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>Esqueci minha Senha</h1>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Digite seu e-mail para receber um link de recuperação</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* E-mail */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              E-mail Institucional
            </label>
            <div style={{ position: "relative" }}>
              <Mail style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "#00e6b4", pointerEvents: "none" }} />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={requestReset.isPending}
                required
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(0,230,180,0.6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(0,230,180,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(0,230,180,0.2)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={requestReset.isPending}
            style={{
              width: "100%",
              padding: "1rem",
              background: requestReset.isPending ? "rgba(0,230,180,0.3)" : "linear-gradient(135deg, #00e6b4, #0078ff)",
              border: "none",
              borderRadius: "0.875rem",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: requestReset.isPending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "1.5rem",
              boxShadow: "0 4px 20px rgba(0,230,180,0.25)",
            }}
          >
            {requestReset.isPending ? (
              <>
                <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
                Enviando...
              </>
            ) : (
              <>
                <Mail style={{ width: "18px", height: "18px" }} />
                Enviar Link de Recuperação
              </>
            )}
          </button>

          {/* Back link */}
          <div style={{ textAlign: "center" }}>
            <Link href="/login-professor">
              <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <ArrowLeft style={{ width: "16px", height: "16px" }} />
                Voltar ao login
              </button>
            </Link>
          </div>
        </form>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
