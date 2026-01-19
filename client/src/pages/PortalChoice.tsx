// Version: 2026-01-15-v3 - Cards com altura igual
import { Link } from "wouter";
import { GraduationCap, Users, Mail, Shield, BookOpen, Award, TrendingUp } from "lucide-react";

export default function PortalChoice() {
  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)'
      }}
    >
      {/* Elementos decorativos abstratos */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div 
          className="absolute rounded-full"
          style={{
            top: '-160px',
            left: '-160px',
            width: '320px',
            height: '320px',
            background: 'rgba(168, 85, 247, 0.2)',
            filter: 'blur(80px)',
            animation: 'pulse 4s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute rounded-full"
          style={{
            top: '25%',
            right: '-80px',
            width: '384px',
            height: '384px',
            background: 'rgba(59, 130, 246, 0.15)',
            filter: 'blur(80px)'
          }}
        />
        <div 
          className="absolute rounded-full"
          style={{
            bottom: '0',
            left: '33%',
            width: '288px',
            height: '288px',
            background: 'rgba(99, 102, 241, 0.2)',
            filter: 'blur(80px)',
            animation: 'pulse 4s ease-in-out infinite',
            animationDelay: '1s'
          }}
        />
        <div 
          className="absolute rounded-full"
          style={{
            top: '50%',
            left: '25%',
            width: '256px',
            height: '256px',
            background: 'rgba(139, 92, 246, 0.1)',
            filter: 'blur(80px)'
          }}
        />
      </div>
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0"
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Conteúdo principal */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-12">
        <div className="max-w-6xl w-full">
          {/* Header com branding impactante */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-4 mb-6">
              <div className="relative">
                <div 
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    filter: 'blur(20px)'
                  }}
                />
                <img src="/logo.png" alt="FlowEdu" className="relative h-20 w-20" style={{ filter: 'drop-shadow(0 25px 25px rgba(0, 0, 0, 0.5))' }} />
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">
                Flow<span 
                  style={{
                    background: 'linear-gradient(to right, #c084fc, #f472b6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >Edu</span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl font-light max-w-2xl mx-auto" style={{ color: 'rgba(233, 213, 255, 0.9)' }}>
              Onde a educação flui
            </p>
            <p className="text-base mt-3" style={{ color: '#94a3b8' }}>
              Escolha como deseja acessar a plataforma
            </p>
          </div>

          {/* Cards de Escolha com design premium - ALTURA IGUAL */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Portal do Aluno */}
            <Link href="/student-login">
              <div className="group relative h-full">
                {/* Glow effect no hover */}
                <div 
                  className="absolute rounded-3xl opacity-0 group-hover:opacity-40 transition-all duration-500"
                  style={{
                    inset: '-4px',
                    background: 'linear-gradient(to right, #06b6d4, #3b82f6, #a855f7)',
                    filter: 'blur(16px)'
                  }}
                />
                
                <div 
                  className="relative rounded-3xl p-8 lg:p-10 cursor-pointer transition-all duration-500 group-hover:translate-y-[-8px] overflow-hidden h-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    minHeight: '520px'
                  }}
                >
                  {/* Decoração interna */}
                  <div 
                    className="absolute rounded-full group-hover:scale-150 transition-transform duration-700"
                    style={{
                      top: '0',
                      right: '0',
                      width: '160px',
                      height: '160px',
                      background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), transparent)',
                      filter: 'blur(32px)',
                      transform: 'translate(40px, -40px)'
                    }}
                  />
                  
                  <div className="flex flex-col items-center text-center h-full relative z-10">
                    {/* Ícone com animação */}
                    <div className="relative mb-8">
                      <div 
                        className="absolute inset-0 rounded-full group-hover:opacity-80 group-hover:scale-110 transition-all duration-500"
                        style={{
                          background: 'linear-gradient(to bottom right, #22d3ee, #2563eb)',
                          filter: 'blur(20px)',
                          opacity: 0.5
                        }}
                      />
                      <div 
                        className="relative w-28 h-28 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500"
                        style={{
                          background: 'linear-gradient(to bottom right, #22d3ee, #3b82f6, #2563eb)',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                      >
                        <GraduationCap className="w-14 h-14 text-white" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }} />
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <h2 className="text-3xl font-bold text-white group-hover:text-cyan-100 transition-colors">
                        Portal do Aluno
                      </h2>
                      <p className="text-lg leading-relaxed max-w-sm" style={{ color: '#cbd5e1' }}>
                        Acesse suas disciplinas, trilhas de aprendizagem e acompanhe seu progresso acadêmico
                      </p>
                    </div>

                    {/* Features badges */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      <span 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#cbd5e1'
                        }}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Materiais
                      </span>
                      <span 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#cbd5e1'
                        }}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        Progresso
                      </span>
                      <span 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#cbd5e1'
                        }}
                      >
                        <Award className="w-3.5 h-3.5" />
                        Exercícios
                      </span>
                    </div>

                    {/* Área de botões - flex-grow para empurrar para baixo */}
                    <div className="flex-grow" />

                    {/* Botão principal */}
                    <div className="w-full max-w-xs mb-4">
                      <div className="relative">
                        <div 
                          className="absolute rounded-xl"
                          style={{
                            inset: '-4px',
                            background: 'linear-gradient(to right, #06b6d4, #3b82f6)',
                            filter: 'blur(8px)',
                            opacity: 0.6
                          }}
                        />
                        <div 
                          className="relative inline-flex items-center justify-center w-full px-8 py-4 rounded-xl font-semibold text-lg text-white transition-all"
                          style={{
                            background: 'linear-gradient(to right, #06b6d4, #2563eb)',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
                          }}
                        >
                          <Shield className="w-5 h-5 mr-2" />
                          Entrar como Aluno
                        </div>
                      </div>
                    </div>

                    <p className="text-sm" style={{ color: '#94a3b8' }}>
                      Login com número de matrícula
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Portal do Professor */}
            <div className="group relative h-full">
              {/* Glow effect no hover */}
              <div 
                className="absolute rounded-3xl opacity-0 group-hover:opacity-40 transition-all duration-500"
                style={{
                  inset: '-4px',
                  background: 'linear-gradient(to right, #a855f7, #ec4899, #f43f5e)',
                  filter: 'blur(16px)'
                }}
              />
              
              <div 
                className="relative rounded-3xl p-8 lg:p-10 transition-all duration-500 group-hover:translate-y-[-8px] overflow-hidden h-full"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  minHeight: '520px'
                }}
              >
                {/* Decoração interna */}
                <div 
                  className="absolute rounded-full group-hover:scale-150 transition-transform duration-700"
                  style={{
                    top: '0',
                    right: '0',
                    width: '160px',
                    height: '160px',
                    background: 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.2), transparent)',
                    filter: 'blur(32px)',
                    transform: 'translate(40px, -40px)'
                  }}
                />
                
                <div className="flex flex-col items-center text-center h-full relative z-10">
                  {/* Ícone com animação */}
                  <div className="relative mb-8">
                    <div 
                      className="absolute inset-0 rounded-full group-hover:opacity-80 group-hover:scale-110 transition-all duration-500"
                      style={{
                        background: 'linear-gradient(to bottom right, #c084fc, #db2777)',
                        filter: 'blur(20px)',
                        opacity: 0.5
                      }}
                    />
                    <div 
                      className="relative w-28 h-28 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500"
                      style={{
                        background: 'linear-gradient(to bottom right, #c084fc, #a855f7, #db2777)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      <Users className="w-14 h-14 text-white" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }} />
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <h2 className="text-3xl font-bold text-white group-hover:text-purple-100 transition-colors">
                      Portal do Professor
                    </h2>
                    <p className="text-lg leading-relaxed max-w-sm" style={{ color: '#cbd5e1' }}>
                      Gerencie disciplinas, turmas, horários e acompanhe o desempenho dos seus alunos
                    </p>
                  </div>

                  {/* Features badges */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    <span 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#cbd5e1'
                      }}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Disciplinas
                    </span>
                    <span 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#cbd5e1'
                      }}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Turmas
                    </span>
                    <span 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#cbd5e1'
                      }}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      Relatórios
                    </span>
                  </div>

                  {/* Área de botões - flex-grow para empurrar para baixo */}
                  <div className="flex-grow" />

                  {/* Botão de Login */}
                  <div className="w-full max-w-xs mb-4">
                    <Link href="/login-professor" className="block">
                      <div className="relative">
                        <div 
                          className="absolute rounded-xl"
                          style={{
                            inset: '-4px',
                            background: 'linear-gradient(to right, #a855f7, #ec4899)',
                            filter: 'blur(8px)',
                            opacity: 0.6
                          }}
                        />
                        <div 
                          className="relative inline-flex items-center justify-center w-full px-8 py-4 rounded-xl font-semibold text-lg text-white transition-all"
                          style={{
                            background: 'linear-gradient(to right, #a855f7, #db2777)',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
                          }}
                        >
                          <Mail className="w-5 h-5 mr-2" />
                          Entrar com E-mail
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div className="text-sm" style={{ color: '#94a3b8' }}>
                    <Link href="/cadastro-professor" className="hover:underline transition-colors" style={{ color: '#d8b4fe' }}>
                      Não tem conta? Cadastre-se
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer elegante */}
          <div className="text-center mt-16 space-y-4">
            <div className="flex items-center justify-center gap-6 text-sm" style={{ color: '#64748b' }}>
              <span className="inline-flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Acesso Seguro
              </span>
              <span className="w-1 h-1 rounded-full" style={{ background: '#475569' }} />
              <span>Dados Protegidos</span>
              <span className="w-1 h-1 rounded-full" style={{ background: '#475569' }} />
              <span>LGPD Compliant</span>
            </div>
            <p className="text-sm" style={{ color: '#64748b' }}>
              © 2026 FlowEdu - Onde a educação flui
            </p>
          </div>
        </div>
      </div>

      {/* CSS para animação de pulse */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
