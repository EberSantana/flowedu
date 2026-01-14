// Version: 2025-12-18-v4 - Login direto com e-mail/senha para professores
import { Link, useLocation } from "wouter";
import { GraduationCap, Users, Loader2, UserPlus, Mail, LogIn } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function PortalChoice() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirecionar automaticamente se o usuário já está autenticado
  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/10 via-primary/10 to-accent/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se usuário está autenticado, não mostrar nada (vai redirecionar)
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/10 via-primary/10 to-accent/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
          <p className="text-gray-600">Redirecionando para o Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-primary/10 to-accent/20 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            FlowEdu
          </h1>
          <p className="text-lg text-gray-600">
            Onde a educação flui - Escolha como deseja acessar
          </p>
        </div>

        {/* Cards de Escolha */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Portal do Aluno */}
          <Link href="/student-login">
            <div className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border-2 border-transparent hover:border-primary min-h-[420px] flex items-center">
              <div className="flex flex-col items-center text-center space-y-6 w-full">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-12 h-12 text-white" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Portal do Aluno
                  </h2>
                  <p className="text-gray-600">
                    Acesse suas disciplinas, frequência e materiais de estudo
                  </p>
                </div>

                <div className="pt-4">
                  <div className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                    Entrar como Aluno
                  </div>
                </div>

                <div className="text-sm text-gray-500 pt-2">
                  Login com número de matrícula
                </div>
              </div>
            </div>
          </Link>

          {/* Portal do Professor */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-transparent min-h-[420px] flex items-center">
            <div className="flex flex-col items-center text-center space-y-6 w-full">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Users className="w-12 h-12 text-white" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Portal do Professor
                </h2>
                <p className="text-gray-600">
                  Gerencie disciplinas, turmas, horários e acompanhe seus alunos
                </p>
              </div>

              {/* Botões de Login */}
              <div className="pt-4 space-y-3 w-full max-w-xs">
                <Link href="/login-professor" className="block">
                  <div className="inline-flex items-center justify-center w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    <Mail className="w-4 h-4 mr-2" />
                    Entrar com E-mail
                  </div>
                </Link>
                
                <a href={getLoginUrl()} className="block">
                  <div className="inline-flex items-center justify-center w-full px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar com Google/GitHub
                  </div>
                </a>
              </div>

              <div className="text-sm text-gray-500 pt-2">
                <Link href="/cadastro-professor" className="text-purple-600 hover:underline">
                  Não tem conta? Cadastre-se
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>© 2026 FlowEdu - Onde a educação flui</p>
        </div>
      </div>
    </div>
  );
}
