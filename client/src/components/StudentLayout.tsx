
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  MessageCircle,
  MessageSquare,
  BarChart3,
  PenLine,
  ClipboardList,
  ClipboardCheck,
  Smartphone,
  BookMarked,
  Activity,
  Layout,
  FolderOpen
} from "lucide-react";
import { Link } from "wouter";
import StudentNotifications from "@/components/StudentNotifications";
import { ThemeSelector } from "@/components/ThemeSelector";
import { Palette } from "lucide-react";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { trpc } from "@/lib/trpc";

type MenuSection = {
  label: string;
  items: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    path: string;
    badge?: number;
  }[];
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { student, loading, logout, isAuthenticated } = useStudentAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Buscar contagem de avisos não lidos - DEVE ficar antes dos early returns
  const { data: unreadAnnouncementsCount } = trpc.announcements.getUnreadCount.useQuery(
    undefined,
    { 
      refetchInterval: 30000, // Atualiza a cada 30 segundos
      enabled: isAuthenticated 
    }
  );

  // Buscar contagem de respostas não vistas pelo aluno
  const { data: unseenAnswersData } = trpc.studentDoubts.getUnseenAnswersCount.useQuery(
    undefined,
    {
      refetchInterval: 30000, // Atualiza a cada 30 segundos
      enabled: isAuthenticated,
    }
  );
  const unseenAnswersCount = unseenAnswersData?.count ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-6 text-foreground font-semibold text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card rounded-2xl shadow-2xl p-10 max-w-md w-full border border-border">
          <div className="text-center">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <GraduationCap className="w-12 h-12 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">Acesso Restrito</h1>
            <p className="text-muted-foreground mb-8 text-lg">Faça login para acessar o Portal do Aluno</p>
            <Link href="/student-login">
              <Button className="w-full h-12 text-base font-semibold shadow-lg">
                Fazer Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const menuSections: MenuSection[] = [
    {
      label: "Principal",
      items: [
        { icon: Home, label: "Início", path: "/student-dashboard" },
        { icon: BookOpen, label: "Minhas Disciplinas", path: "/student-subjects" },
        { icon: Bell, label: "Avisos", path: "/student-announcements", badge: unreadAnnouncementsCount || 0 },
      ],
    },
    {
      label: "Estudos",
      items: [
        { icon: Map, label: "Trilhas de Aprendizagem", path: "/student-learning-paths" },
        { icon: FileText, label: "Exercícios da Trilha", path: "/student-exercises" },
        { icon: ClipboardList, label: "Atividades de Sala", path: "/student/activities" },
      ],
    },
    {
      label: "Avaliações",
      items: [
        { icon: ClipboardCheck, label: "Provas", path: "/student/assessments" },
        { icon: BarChart3, label: "Estatísticas", path: "/student/statistics" },
        { icon: BookMarked, label: "Boletim", path: "/student/grade-book" },
      ],
    },
    {
      label: "Suporte",
      items: [
        { icon: MessageCircle, label: "Dúvidas", path: "/student/doubts", badge: unseenAnswersCount },
        { icon: MessageSquare, label: "Fórum de Discussão", path: "/student/forum" },
        { icon: Layout, label: "Mural Colaborativo", path: "/student/mural" },
        { icon: BookOpen, label: "Glossário", path: "/student/glossary" },
        { icon: FolderOpen, label: "Materiais de Estudo", path: "/student/materials" },
        { icon: PenLine, label: "Diário de Aprendizagem", path: "/student/learning-journal" },
      ],
    },
  ];

  const renderNavItems = (items: MenuSection["items"], closeSidebar?: boolean) => (
    items.map((item) => {
      const isActive = location === item.path;
      return (
        <Link key={item.path} href={item.path}>
          <button
            onClick={closeSidebar ? () => setSidebarOpen(false) : undefined}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm flex-1 text-left">{item.label}</span>
            {(item.badge ?? 0) > 0 && (
              <Badge 
                variant={isActive ? "secondary" : "destructive"}
                className="h-5 min-w-5 flex items-center justify-center text-xs"
              >
                {(item.badge ?? 0) > 99 ? "99+" : item.badge}
              </Badge>
            )}
          </button>
        </Link>
      );
    })
  );

  const renderSections = (closeSidebar?: boolean) => (
    menuSections.map((section, idx) => (
      <div key={section.label} className={idx > 0 ? "pt-3" : ""}>
        <p className="px-4 mb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {section.label}
        </p>
        <div className="space-y-0.5">
          {renderNavItems(section.items, closeSidebar)}
        </div>
      </div>
    ))
  );

  const renderBottomActions = (closeSidebar?: boolean) => (
    <div className="p-4 border-t border-border bg-muted/30 space-y-2">
      <ThemeSelector
        trigger={
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-11"
          >
            <Palette className="w-5 h-5" />
            <span className="text-sm font-medium">Personalizar Tema</span>
          </Button>
        }
      />
      <Link href="/student-profile">
        <Button
          onClick={closeSidebar ? () => setSidebarOpen(false) : undefined}
          variant="outline"
          className="w-full justify-start gap-3 h-11"
        >
          <User className="w-5 h-5" />
          <span className="text-sm font-medium">Meu Perfil</span>
        </Button>
      </Link>
      <Link href="/student/instalar-app">
        <Button
          onClick={closeSidebar ? () => setSidebarOpen(false) : undefined}
          variant="outline"
          className="w-full justify-start gap-3 h-11"
        >
          <Smartphone className="w-5 h-5" />
          <span className="text-sm font-medium">Instalar App</span>
        </Button>
      </Link>
      <a
        href="/api/logout"
        className="w-full flex items-center justify-start gap-3 h-11 px-4 border border-destructive/30 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">Sair</span>
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col z-50">
        <div className="flex flex-col flex-grow bg-card border-r border-border shadow-xl">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border bg-muted">
            <img src="/logo.png" alt="FlowEdu" className="h-14 w-14" />
            <div>
              <h1 className="font-bold text-foreground text-xl">Portal do Aluno</h1>
              <p className="text-xs text-muted-foreground">FlowEdu</p>
            </div>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-border bg-muted/50">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-border shadow-md">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                  {student?.fullName?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate text-base">
                  {student?.fullName || "Aluno"}
                </p>
                <p className="text-sm text-muted-foreground font-mono">
                  Mat: {student?.registrationNumber || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Sections */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {renderSections()}
          </nav>

          {/* Bottom Actions */}
          {renderBottomActions()}
          <div className="py-1.5 text-center border-t border-border">
            <p className="text-[10px] text-muted-foreground/40 select-none">FlowEdu v6.0.0</p>
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
        className={`fixed inset-y-0 left-0 w-72 bg-card shadow-2xl z-50 transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo + Close */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="FlowEdu" className="h-14 w-14" />
              <div>
                <h1 className="font-bold text-foreground text-xl">Portal do Aluno</h1>
                <p className="text-xs text-muted-foreground">FlowEdu</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-foreground hover:bg-accent p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-border bg-muted/50">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-border shadow-md">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                  {student?.fullName?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate text-base">
                  {student?.fullName || "Aluno"}
                </p>
                <p className="text-sm text-muted-foreground font-mono">
                  Mat: {student?.registrationNumber || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Sections */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {renderSections(true)}
          </nav>

          {/* Bottom Actions */}
          {renderBottomActions(true)}
          <div className="py-1.5 text-center border-t border-border">
            <p className="text-[10px] text-muted-foreground/40 select-none">FlowEdu v6.0.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Menu className="w-6 h-6 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="FlowEdu" className="h-10 w-10" />
              <span className="font-bold text-foreground">Portal do Aluno</span>
            </div>
            <StudentNotifications />
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
