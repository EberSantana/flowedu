// Version: 2026-03-30-v6.0.0 - Atualização versão
import { Link, useLocation } from "wouter";
import { GraduationCap, Users, Mail, Shield, BookOpen, TrendingUp, CheckCircle, Brain, BarChart2, FileText, Zap } from "lucide-react";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

export default function PortalChoice() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const { data: studentSession } = trpc.auth.studentSession.useQuery();

  useEffect(() => {
    if (isLoading) return;
    if (studentSession) {
      localStorage.setItem("flowedu_last_portal", "aluno");
      setLocation("/student-dashboard");
    } else if (user) {
      localStorage.setItem("flowedu_last_portal", "professor");
      setLocation("/dashboard");
    }
  }, [user, studentSession, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080d1a" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white animate-pulse"
            style={{ background: "linear-gradient(135deg, #00e5c0, #1a6fff)", boxShadow: "0 0 40px rgba(0,229,192,0.5)" }}
          >
            F
          </div>
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#00e5c0", borderTopColor: "transparent" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#080d1a", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Radial glows ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 60% 50% at 15% 50%, rgba(0,229,192,0.07) 0%, transparent 70%),
          radial-gradient(ellipse 50% 60% at 85% 30%, rgba(26,111,255,0.06) 0%, transparent 70%),
          radial-gradient(ellipse 40% 40% at 50% 90%, rgba(124,58,237,0.05) 0%, transparent 70%)
        `
      }} />

      {/* ── Grid overlay ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        opacity: 0.025,
        backgroundImage: "linear-gradient(rgba(0,229,192,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,192,1) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      {/* ── Floating icons ── */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        {[
          { icon: <Brain className="w-6 h-6" />, style: { top: "12%", right: "8%", animationDelay: "0s" } },
          { icon: <BarChart2 className="w-6 h-6" />, style: { top: "28%", right: "5%", animationDelay: "1.5s" } },
          { icon: <BookOpen className="w-6 h-6" />, style: { top: "18%", right: "14%", animationDelay: "0.8s" } },
          { icon: <FileText className="w-6 h-6" />, style: { bottom: "20%", right: "7%", animationDelay: "2s" } },
          { icon: <Users className="w-6 h-6" />, style: { bottom: "35%", right: "12%", animationDelay: "1s" } },
          { icon: <Zap className="w-6 h-6" />, style: { top: "40%", left: "4%", animationDelay: "0.5s" } },
          { icon: <CheckCircle className="w-6 h-6" />, style: { bottom: "25%", left: "6%", animationDelay: "2.5s" } },
        ].map((item, i) => (
          <div
            key={i}
            className="absolute w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              ...item.style,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(0,229,192,0.6)",
              animation: "floatIcon 6s ease-in-out infinite",
            }}
          >
            {item.icon}
          </div>
        ))}
      </div>

      {/* ── Top bar ── */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,13,26,0.7)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black text-white"
            style={{ background: "linear-gradient(135deg, #00e5c0, #1a6fff)", boxShadow: "0 0 20px rgba(0,229,192,0.4)" }}
          >
            F
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">
            Flow<span style={{ color: "#00e5c0" }}>Edu</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <a
            href="https://flowedu.app"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #00e5c0, #1a6fff)", color: "#080d1a", boxShadow: "0 0 16px rgba(0,229,192,0.3)" }}
          >
            flowedu.app
          </a>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 py-12 md:py-16">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest mb-8"
          style={{ border: "1px solid rgba(0,229,192,0.3)", background: "rgba(0,229,192,0.08)", color: "#00e5c0" }}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Gestão Educacional Inteligente
        </div>

        {/* Logo + Title */}
        <div className="flex items-center gap-5 mb-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black text-white"
            style={{
              background: "linear-gradient(135deg, #00e5c0, #1a6fff)",
              boxShadow: "0 0 40px rgba(0,229,192,0.5), 0 0 80px rgba(0,229,192,0.2)"
            }}
          >
            F
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter leading-none">
            FlowEdu
          </h1>
        </div>

        {/* Divider */}
        <div className="w-16 h-1 rounded-full mb-6" style={{ background: "linear-gradient(90deg, #00e5c0, #1a6fff)" }} />

        <p className="text-2xl md:text-3xl font-semibold mb-3" style={{ color: "#00e5c0" }}>
          Onde a Educação Flui
        </p>
        <p className="text-base text-center max-w-lg mb-12 leading-relaxed" style={{ color: "#8899b4" }}>
          Sistema completo para professores organizarem disciplinas, turmas, exercícios e provas — com IA integrada para análise de desempenho.
        </p>

        {/* ── Portal cards ── */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">

          {/* Aluno */}
          <Link href="/student-login">
            <div
              className="group relative rounded-2xl p-8 flex flex-col items-center text-center gap-4 cursor-pointer transition-all duration-300 overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                minHeight: "380px"
              }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,229,192,0.10) 0%, transparent 70%)" }} />
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
                style={{ border: "1px solid rgba(0,229,192,0.35)" }} />

              {/* Icon */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 relative z-10"
                style={{
                  background: "linear-gradient(135deg, #00e5c0, #1a6fff)",
                  boxShadow: "0 0 30px rgba(0,229,192,0.35)"
                }}
              >
                <GraduationCap className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-white relative z-10">Portal do Aluno</h2>
              <p className="text-sm leading-relaxed relative z-10" style={{ color: "#8899b4", maxWidth: "260px" }}>
                Acesse suas disciplinas, trilhas de aprendizagem e acompanhe seu progresso acadêmico
              </p>

              {/* Tags */}
              <div className="flex flex-nowrap justify-center gap-2 relative z-10">
                {[
                  { icon: <BookOpen className="w-3 h-3" />, label: "Materiais" },
                  { icon: <TrendingUp className="w-3 h-3" />, label: "Progresso" },
                  { icon: <CheckCircle className="w-3 h-3" />, label: "Exercícios" },
                ].map((tag) => (
                  <span
                    key={tag.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#8899b4" }}
                  >
                    {tag.icon}{tag.label}
                  </span>
                ))}
              </div>

              <div className="flex-1" />

              {/* Button */}
              <button
                className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 relative z-10 transition-all duration-200 group-hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #00e5c0, #1a6fff)",
                  color: "#080d1a",
                  boxShadow: "0 8px 24px rgba(0,229,192,0.3)"
                }}
              >
                <Shield className="w-4 h-4" />
                Entrar como Aluno
              </button>
              <span className="text-xs relative z-10" style={{ color: "#8899b4" }}>Login com número de matrícula</span>
            </div>
          </Link>

          {/* Professor */}
          <div
            className="group relative rounded-2xl p-8 flex flex-col items-center text-center gap-4 overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              minHeight: "380px"
            }}
          >
            {/* Hover glow */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(224,64,251,0.10) 0%, transparent 70%)" }} />
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
              style={{ border: "1px solid rgba(224,64,251,0.35)" }} />

            {/* Icon */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 relative z-10"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #e040fb)",
                boxShadow: "0 0 30px rgba(224,64,251,0.35)"
              }}
            >
              <Users className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-white relative z-10">Portal do Professor</h2>
            <p className="text-sm leading-relaxed relative z-10" style={{ color: "#8899b4", maxWidth: "260px" }}>
              Gerencie disciplinas, turmas, horários e acompanhe o desempenho dos seus alunos com IA
            </p>

            {/* Tags */}
            <div className="flex flex-nowrap justify-center gap-2 relative z-10">
              {[
                { icon: <BookOpen className="w-3 h-3" />, label: "Disciplinas" },
                { icon: <Users className="w-3 h-3" />, label: "Turmas" },
                { icon: <TrendingUp className="w-3 h-3" />, label: "Relatórios" },
              ].map((tag) => (
                <span
                  key={tag.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#8899b4" }}
                >
                  {tag.icon}{tag.label}
                </span>
              ))}
            </div>

            <div className="flex-1" />

            {/* Button */}
            <Link href="/login-professor" className="w-full relative z-10">
              <button
                className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 group-hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #e040fb)",
                  color: "#fff",
                  boxShadow: "0 8px 24px rgba(224,64,251,0.3)"
                }}
              >
                <Mail className="w-4 h-4" />
                Entrar com E-mail
              </button>
            </Link>
            <span className="text-xs relative z-10" style={{ color: "#8899b4" }}>
              Não tem conta?{" "}
              <Link href="/cadastro-professor" className="font-semibold" style={{ color: "#e040fb" }}>
                Cadastre-se
              </Link>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-14 flex flex-col items-center gap-3">
          <div className="flex items-center gap-6 text-xs" style={{ color: "#4a5568" }}>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Acesso Seguro</span>
            <span className="w-1 h-1 rounded-full bg-current" />
            <span>Dados Protegidos</span>
            <span className="w-1 h-1 rounded-full bg-current" />
            <span>LGPD Compliant</span>
          </div>
          <p className="text-xs" style={{ color: "#4a5568" }}>
            v6.0.0 · Março 2026 · © 2026 FlowEdu — Onde a educação flui
          </p>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
