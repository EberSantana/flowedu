import { useStudentAuth } from "@/hooks/useStudentAuth";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  GraduationCap, 
  LogOut, 
  BookOpen, 
  Bell, 
  Home, 
  User, 
  FileText, 
  Map,
  Menu,
  X,
  ClipboardList
} from "lucide-react";
import { Link } from "wouter";
import StudentNotifications from "@/components/StudentNotifications";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { student, loading, logout, isAuthenticated } = useStudentAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-gray-700 font-semibold text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full border border-gray-100">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Acesso Restrito</h1>
            <p className="text-gray-600 mb-8 text-lg">Faça login para acessar o Portal do Aluno</p>
            <Link href="/student-login">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-base font-semibold shadow-lg">
                Fazer Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: Home, label: "Início", path: "/student-dashboard", color: "text-blue-600" },
    { icon: BookOpen, label: "Minhas Disciplinas", path: "/student-subjects", color: "text-green-600" },
    { icon: Map, label: "Trilhas de Aprendizagem", path: "/student-learning-paths", color: "text-purple-600" },
    { icon: FileText, label: "Exercícios", path: "/student-exercises", color: "text-orange-600" },
    { icon: ClipboardList, label: "Caderno de Respostas", path: "/student-assessments", color: "text-teal-600" },
    { icon: Bell, label: "Avisos", path: "/student-announcements", color: "text-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col z-50">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-xl">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="font-bold text-white text-xl">Portal do Aluno</h1>
              <p className="text-xs text-blue-100">Gestão Educacional</p>
            </div>
          </div>

          {/* User Info */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border-2 border-blue-200 shadow-md">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-lg">
                  {student?.fullName?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate text-base">
                  {student?.fullName || "Aluno"}
                </p>
                <p className="text-sm text-gray-600 font-mono">
                  Mat: {student?.registrationNumber || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                        : "text-gray-700 hover:bg-gray-100 hover:scale-102"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "text-white" : item.color}`} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
            <Link href="/student-profile">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-11 border-gray-300 hover:bg-gray-100"
              >
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium">Meu Perfil</span>
              </Button>
            </Link>
            <Button
              onClick={logout}
              variant="outline"
              className="w-full justify-start gap-3 h-11 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo + Close */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="font-bold text-white text-xl">Portal do Aluno</h1>
                <p className="text-xs text-blue-100">Gestão Educacional</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border-2 border-blue-200 shadow-md">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-lg">
                  {student?.fullName?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate text-base">
                  {student?.fullName || "Aluno"}
                </p>
                <p className="text-sm text-gray-600 font-mono">
                  Mat: {student?.registrationNumber || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "text-white" : item.color}`} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
            <Link href="/student-profile">
              <Button
                onClick={() => setSidebarOpen(false)}
                variant="outline"
                className="w-full justify-start gap-3 h-11 border-gray-300 hover:bg-gray-100"
              >
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium">Meu Perfil</span>
              </Button>
            </Link>
            <Button
              onClick={logout}
              variant="outline"
              className="w-full justify-start gap-3 h-11 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">Portal do Aluno</span>
            </div>
            <StudentNotifications />
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
