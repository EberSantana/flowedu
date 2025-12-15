// Version: 2025-12-15-v2 - OAuth redirect fix
import { Link } from "wouter";
import { GraduationCap, Users } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function PortalChoice() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Sistema de Gestão Educacional Professor & Aluno
          </h1>
          <p className="text-lg text-gray-600">
            Escolha como deseja acessar o sistema
          </p>
        </div>

        {/* Cards de Escolha */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Portal do Aluno */}
          <Link href="/student-login">
            <div className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border-2 border-transparent hover:border-blue-400 min-h-[480px] flex items-center">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
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
                  <div className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
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
          <a href={getLoginUrl()}>
            <div className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border-2 border-transparent hover:border-purple-400 min-h-[480px] flex items-center">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Users className="w-12 h-12 text-white" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Portal do Professor
                  </h2>
                  <p className="text-gray-600">
                    Gerencie disciplinas, turmas, horários e acompanhe seus
                    alunos
                  </p>
                </div>

                <div className="pt-4">
                  <div className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    Entrar como Professor
                  </div>
                </div>

                <div className="text-sm text-gray-500 pt-2">
                  Login com Google ou GitHub
                </div>
              </div>
            </div>
          </a>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>© 2025 Sistema de Gestão Educacional Professor & Aluno</p>
        </div>
      </div>
    </div>
  );
}
