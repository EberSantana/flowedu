import { Link } from "wouter";
import { GraduationCap, Users, BookOpen, Users2, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-600 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8">
        {/* Portal do Aluno */}
        <div className="bg-purple-800/40 backdrop-blur-sm rounded-3xl p-12 flex flex-col items-center text-center space-y-8 border border-purple-400/20">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-2xl">
            <GraduationCap className="w-16 h-16 text-white" />
          </div>
          
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">Portal do Aluno</h2>
            <p className="text-purple-200 text-lg">
              Acesse suas disciplinas, trilhas de aprendizagem e acompanhe seu progresso acadêmico
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <span className="px-4 py-2 bg-purple-700/50 text-purple-100 rounded-full text-sm flex items-center gap-2 border border-purple-400/30">
              <BookOpen className="w-4 h-4" />
              Materiais
            </span>
            <span className="px-4 py-2 bg-purple-700/50 text-purple-100 rounded-full text-sm flex items-center gap-2 border border-purple-400/30">
              <TrendingUp className="w-4 h-4" />
              Progresso
            </span>
            <span className="px-4 py-2 bg-purple-700/50 text-purple-100 rounded-full text-sm flex items-center gap-2 border border-purple-400/30">
              <Users2 className="w-4 h-4" />
              Exercícios
            </span>
          </div>

          <Link href="/student-login">
            <button className="w-full max-w-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3 text-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Entrar com E-mail
            </button>
          </Link>
        </div>

        {/* Portal do Professor */}
        <div className="bg-purple-800/40 backdrop-blur-sm rounded-3xl p-12 flex flex-col items-center text-center space-y-8 border border-purple-400/20">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center shadow-2xl">
            <Users className="w-16 h-16 text-white" />
          </div>
          
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">Portal do Professor</h2>
            <p className="text-purple-200 text-lg">
              Gerencie disciplinas, turmas, horários e acompanhe o desempenho dos seus alunos
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <span className="px-4 py-2 bg-purple-700/50 text-purple-100 rounded-full text-sm flex items-center gap-2 border border-purple-400/30">
              <BookOpen className="w-4 h-4" />
              Disciplinas
            </span>
            <span className="px-4 py-2 bg-purple-700/50 text-purple-100 rounded-full text-sm flex items-center gap-2 border border-purple-400/30">
              <Users2 className="w-4 h-4" />
              Turmas
            </span>
            <span className="px-4 py-2 bg-purple-700/50 text-purple-100 rounded-full text-sm flex items-center gap-2 border border-purple-400/30">
              <TrendingUp className="w-4 h-4" />
              Relatórios
            </span>
          </div>

          <Link href="/teacher-login">
            <button className="w-full max-w-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3 text-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Entrar com E-mail
            </button>
          </Link>

          <p className="text-purple-300 text-sm">
            Não tem conta?{" "}
            <Link href="/teacher-register" className="text-pink-300 hover:text-pink-200 font-semibold underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
