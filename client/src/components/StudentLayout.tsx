import { useStudentAuth } from "@/hooks/useStudentAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GraduationCap, LogOut, BookOpen, Bell, Home, User, Trophy, Brain, FileText } from "lucide-react";
import { Link } from "wouter";
import StudentNotifications from "@/components/StudentNotifications";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { student, loading, logout, isAuthenticated } = useStudentAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
            <p className="text-gray-600 mb-6">Faça login para acessar o Portal do Aluno</p>
            <Link href="/student-login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Fazer Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: Home, label: "Início", path: "/student-dashboard" },
    { icon: BookOpen, label: "Minhas Disciplinas", path: "/student-subjects" },
    { icon: FileText, label: "Exercícios", path: "/student-exercises" },
    { icon: Trophy, label: "Rankings", path: "/student-leaderboard" },
    { icon: Brain, label: "Pensamento Computacional", path: "/student-computational-thinking" },
    { icon: Bell, label: "Avisos", path: "/student-announcements" },
    { icon: User, label: "Meu Perfil", path: "/student-profile" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Portal do Aluno</h1>
                <p className="text-xs text-gray-500">{student?.fullName}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {menuItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={isActive ? "bg-blue-600" : ""}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {/* Notificações */}
              <StudentNotifications />
              
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{student?.fullName}</p>
                <p className="text-xs text-gray-500">Mat: {student?.registrationNumber}</p>
              </div>
              <Avatar className="h-9 w-9 border">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {student?.fullName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t bg-gray-50 px-4 py-2 flex gap-1 overflow-x-auto">
          {menuItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`flex-shrink-0 ${isActive ? "bg-blue-600" : ""}`}
                >
                  <item.icon className="w-4 h-4 mr-1" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
