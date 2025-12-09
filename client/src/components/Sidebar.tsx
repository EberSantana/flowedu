import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Calendar, 
  Clock, 
  Sun, 
  CalendarDays,
  User,
  Shield,
  LogOut,
  Menu,
  X,
  Lightbulb,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { useSidebarContext } from "@/contexts/SidebarContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: "/",
  },
  {
    label: "Disciplinas",
    icon: <BookOpen className="h-5 w-5" />,
    href: "/subjects",
  },
  {
    label: "Turmas",
    icon: <Users className="h-5 w-5" />,
    href: "/classes",
  },
  {
    label: "Turnos",
    icon: <Clock className="h-5 w-5" />,
    href: "/shifts",
  },
  {
    label: "Grade Semanal",
    icon: <Calendar className="h-5 w-5" />,
    href: "/schedule",
  },
  {
    label: "Calendário",
    icon: <CalendarDays className="h-5 w-5" />,
    href: "/calendar",
  },
  {
    label: "Metodologias",
    icon: <Lightbulb className="h-5 w-5" />,
    href: "/active-methodologies",
  },
  {
    label: "Usuários",
    icon: <Shield className="h-5 w-5" />,
    href: "/admin/users",
    adminOnly: true,
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isCompact, setIsCompact } = useSidebarContext();
  
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error("Erro ao fazer logout: " + error.message);
    },
  });

  const handleLogout = () => {
    if (confirm("Deseja realmente sair do sistema?")) {
      logoutMutation.mutate();
    }
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-card border-r border-border z-40
          transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCompact ? 'w-16' : 'w-64'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`border-b border-border transition-all duration-300 ${
            isCompact ? 'p-3' : 'p-6'
          }`}>
            {isCompact ? (
              <div className="flex justify-center">
                <Sun className="h-6 w-6 text-primary" />
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Sun className="h-6 w-6 text-primary" />
                  Sistema de Gestão
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Gestão de Tempo para Professores
                </p>
              </>
            )}
          </div>
          
          {/* Toggle Button */}
          <div className={`border-b border-border ${
            isCompact ? 'p-2' : 'p-4'
          }`}>
            <button
              onClick={() => setIsCompact(!isCompact)}
              className={`hidden lg:flex items-center justify-center w-full py-2 rounded-lg hover:bg-accent transition-colors ${
                isCompact ? 'px-0' : 'px-4 gap-2'
              }`}
              title={isCompact ? 'Expandir menu' : 'Compactar menu'}
            >
              {isCompact ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5" />
                  <span className="text-sm font-medium">Compactar</span>
                </>
              )}
            </button>
          </div>

          {/* Navigation */}
          <TooltipProvider delayDuration={300}>
            <nav className={`flex-1 overflow-y-auto transition-all duration-300 ${
              isCompact ? 'p-2' : 'p-4'
            }`}>
              <ul className="space-y-1">
                {filteredNavItems.map((item) => {
                  const isActive = location === item.href;
                  const linkContent = (
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center rounded-lg
                        transition-all duration-200
                        ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground"
                        }
                        ${
                          isCompact 
                            ? 'justify-center p-3 group' 
                            : 'gap-3 px-4 py-3'
                        }
                      `}
                    >
                      <span className={isCompact ? 'transition-transform duration-200 group-hover:scale-110' : ''}>
                        {item.icon}
                      </span>
                      {!isCompact && <span className="font-medium">{item.label}</span>}
                    </Link>
                  );
                  
                  return (
                    <li key={item.href}>
                      {isCompact ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {linkContent}
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{item.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        linkContent
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          </TooltipProvider>

          {/* User Section */}
          <div className={`border-t border-border transition-all duration-300 ${
            isCompact ? 'p-2' : 'p-4'
          }`}>
            {isCompact ? (
              <TooltipProvider delayDuration={300}>
                <div className="flex flex-col items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold cursor-pointer">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-medium">{user?.name || "Usuário"}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.role === "admin" ? "Administrador" : "Professor"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors group"
                      >
                        <span className="inline-block transition-transform duration-200 group-hover:scale-110">
                          <User className="h-4 w-4" />
                        </span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Meu Perfil</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors group"
                      >
                        <span className="inline-block transition-transform duration-200 group-hover:scale-110">
                          <LogOut className="h-4 w-4" />
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Sair</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3 px-2">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.name || "Usuário"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.role === "admin" ? "Administrador" : "Professor"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm">Meu Perfil</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Sair</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
