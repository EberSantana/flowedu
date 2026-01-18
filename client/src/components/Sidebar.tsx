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
  ChevronRight,
  ChevronDown,
  CheckSquare,
  CheckCircle2,
  BarChart3,
  Route,
  Target,
  HelpCircle,
  Megaphone,
  KeyRound,
  Brain,
  GraduationCap,
  MessageSquare,
  Settings,
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useSidebarContext } from "@/contexts/SidebarContext";
import NotificationBell from "@/components/NotificationBell";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Search, Command as CommandIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeSelector, ThemeSelectorCompact } from "@/components/ThemeSelector";
import { Palette } from "lucide-react";
import { HoverSubmenu } from "@/components/HoverSubmenu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  adminOnly?: boolean;
}

interface NavCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  adminOnly?: boolean;
}

// Menu para professores organizado por categorias
const teacherNavCategories: NavCategory[] = [
  {
    id: "main",
    label: "Principal",
    icon: <LayoutDashboard className="h-5 w-5" />,
    items: [
      {
        label: "Dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
        href: "/dashboard",
      },
    ],
  },
  {
    id: "academic",
    label: "Gestão Acadêmica",
    icon: <GraduationCap className="h-5 w-5" />,
    items: [
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
    ],
  },
  {
    id: "planning",
    label: "Planejamento",
    icon: <Calendar className="h-5 w-5" />,
    items: [
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
    ],
  },
  {
    id: "analytics",
    label: "Análise e Relatórios",
    icon: <BarChart3 className="h-5 w-5" />,
    items: [
      {
        label: "Relatórios",
        icon: <BarChart3 className="h-5 w-5" />,
        href: "/reports",
      },
      {
        label: "Análise de Aprendizado",
        icon: <Brain className="h-5 w-5" />,
        href: "/learning-analytics",
      },
      {
        label: "Desempenho em Exercícios",
        icon: <Target className="h-5 w-5" />,
        href: "/exercise-performance",
      },
    ],
  },
  {
    id: "resources",
    label: "Recursos Pedagógicos",
    icon: <FolderOpen className="h-5 w-5" />,
    items: [
      {
        label: "Trilhas de Aprendizagem",
        icon: <Route className="h-5 w-5" />,
        href: "/learning-paths",
      },
      {
        label: "Metodologias",
        icon: <Lightbulb className="h-5 w-5" />,
        href: "/active-methodologies",
      },
    ],
  },
  {
    id: "communication",
    label: "Comunicação",
    icon: <MessageSquare className="h-5 w-5" />,
    items: [
      {
        label: "Tarefas",
        icon: <CheckSquare className="h-5 w-5" />,
        href: "/tasks",
      },
      {
        label: "Avisos",
        icon: <Megaphone className="h-5 w-5" />,
        href: "/announcements",
      },
    ],
  },
  {
    id: "admin",
    label: "Administração",
    icon: <Settings className="h-5 w-5" />,
    adminOnly: true,
    items: [
      {
        label: "Usuários",
        icon: <Shield className="h-5 w-5" />,
        href: "/admin/users",
        adminOnly: true,
      },
    ],
  },
];

// Menu para alunos (simplificado - sem categorias)
const studentNavItems: NavItem[] = [
  {
    label: "Minhas Disciplinas",
    icon: <BookOpen className="h-5 w-5" />,
    href: "/student-dashboard",
  },
  {
    label: "Caderno de Exercícios",
    icon: <CheckCircle2 className="h-5 w-5" />,
    href: "/student/notebook",
  },
  {
    label: "Caderno Inteligente IA",
    icon: <Brain className="h-5 w-5" />,
    href: "/student/mistake-notebook",
  },
  {
    label: "Avisos",
    icon: <Megaphone className="h-5 w-5" />,
    href: "/student/announcements",
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isCompact, setIsCompact } = useSidebarContext();
  
  // Estado para categorias expandidas
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => {
    // Inicializar com categorias que contêm a página atual
    const saved = localStorage.getItem('sidebar_expanded_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return ['main'];
      }
    }
    return ['main'];
  });
  
  // Salvar estado das categorias no localStorage
  useEffect(() => {
    localStorage.setItem('sidebar_expanded_categories', JSON.stringify(expandedCategories));
  }, [expandedCategories]);
  
  // Expandir automaticamente a categoria que contém a página atual
  useEffect(() => {
    const currentCategory = teacherNavCategories.find(cat => 
      cat.items.some(item => item.href === location)
    );
    if (currentCategory && !expandedCategories.includes(currentCategory.id)) {
      setExpandedCategories(prev => [...prev, currentCategory.id]);
    }
  }, [location]);
  
  // Detectar tipo de usuário baseado na sessão real (não apenas na URL)
  const { data: studentSession } = trpc.auth.studentSession.useQuery();
  const isStudent = !!studentSession;
  
  // Query para eventos próximos (badge de notificação) - apenas para professores autenticados
  const { data: upcomingEvents } = trpc.calendar.getUpcomingEvents.useQuery(undefined, {
    refetchInterval: 60000,
    enabled: !isStudent && !!user, // Só executa se for professor autenticado
  });
  
  // Query para avisos não lidos (badge de notificação) - apenas para alunos autenticados
  const { data: unreadAnnouncementsCount } = trpc.announcements.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000,
    enabled: isStudent && !!studentSession, // Só executa se for aluno autenticado
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error("Erro ao fazer logout: " + error.message);
    },
  });
  
  const exitStudentModeMutation = trpc.auth.exitStudentMode.useMutation({
    onSuccess: () => {
      toast.success("✅ Voltando ao modo Professor...");
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast.error("Erro ao sair do modo aluno: " + error.message);
    },
  });

  const handleLogout = async () => {
    if (confirm("Deseja realmente sair do sistema?")) {
      try {
        await fetch('/api/trpc/auth.logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        window.location.href = '/';
      } catch (error) {
        toast.error("Erro ao sair do sistema");
      }
    }
  };
  
  const handleExitStudentMode = () => {
    if (confirm("👨‍🏫 Deseja voltar ao modo Professor?")) {
      exitStudentModeMutation.mutate();
    }
  };
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };
  
  // Filtrar categorias baseado em permissões
  console.log('[Sidebar Debug] User data:', { user, role: user?.role });
  const filteredCategories = teacherNavCategories.filter(cat => {
    if (cat.adminOnly && user?.role !== "admin") {
      console.log('[Sidebar Debug] Filtering out admin category:', cat.label, 'user role:', user?.role);
      return false;
    }
    return true;
  });
  console.log('[Sidebar Debug] Filtered categories:', filteredCategories.map(c => c.label));

  // Renderizar item de navegação
  const renderNavItem = (item: NavItem, inCategory: boolean = false) => {
    const isActive = location === item.href;
    const isCalendar = item.href === '/calendar';
    const isAnnouncementsMenu = item.label === 'Avisos';
    
    let notificationCount = 0;
    if (isCalendar && upcomingEvents) {
      notificationCount = upcomingEvents.length;
    } else if (isAnnouncementsMenu && unreadAnnouncementsCount !== undefined) {
      notificationCount = unreadAnnouncementsCount;
    }
    
    const linkContent = (
      <Link
        href={item.href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`
          flex items-center rounded-xl relative
          transition-all duration-200
          ${
            isActive
              ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              : "text-foreground hover:bg-gradient-to-r hover:from-accent hover:to-accent/50 hover:text-accent-foreground hover:shadow-md"
          }
          ${
            isCompact 
              ? 'justify-center p-3 group' 
              : inCategory ? 'gap-3 px-4 py-2.5 ml-4' : 'gap-3 px-4 py-3'
          }
        `}
      >
        <span className={isCompact ? 'transition-transform duration-200 group-hover:scale-110' : ''}>
          {item.icon}
        </span>
        {!isCompact && <span className={inCategory ? "text-sm font-medium" : "font-medium"}>{item.label}</span>}
        {(isCalendar || isAnnouncementsMenu) && notificationCount > 0 && (
          <span className={`
            flex items-center justify-center
            bg-red-500 text-white text-[10px] font-bold rounded-full
            ${isCompact ? 'absolute w-4 h-4 -top-1 -right-1' : 'w-5 h-5 ml-auto'}
          `}>
            {notificationCount}
          </span>
        )}
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
  };

  // Renderizar categoria
  const renderCategory = (category: NavCategory) => {
    const isExpanded = expandedCategories.includes(category.id);
    const hasActiveItem = category.items.some(item => location === item.href);
    
    // Para categoria "Principal" com apenas Dashboard, renderizar direto
    if (category.id === 'main') {
      return (
        <div key={category.id} className="mb-1">
          {category.items.map(item => renderNavItem(item, false))}
        </div>
      );
    }
    
    if (isCompact) {
      // No modo compacto, usar HoverSubmenu com delay
      return (
        <div key={category.id} className="mb-1">
          <HoverSubmenu 
            category={category} 
            onNavigate={() => setIsMobileMenuOpen(false)}
          />
        </div>
      );
    }
    
    return (
      <Collapsible
        key={category.id}
        open={isExpanded}
        onOpenChange={() => toggleCategory(category.id)}
        className="mb-1"
      >
        <CollapsibleTrigger asChild>
          <button
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              transition-all duration-200
              ${
                hasActiveItem
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-accent/50"
              }
            `}
          >
            {category.icon}
            <span className="font-medium flex-1 text-left">{category.label}</span>
            <ChevronDown 
              className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1 space-y-1">
          {category.items.map(item => renderNavItem(item, true))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

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
          fixed top-0 left-0 h-screen bg-gradient-to-b from-card via-card to-card/95 border-r border-border/50 shadow-xl z-40
          transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCompact ? 'w-16' : 'w-64'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent transition-all duration-300 ${
            isCompact ? 'p-3' : 'p-6'
          }`}>
            {isCompact ? (
              <div className="flex flex-col items-center gap-3">
                <img src="/logo.png" alt="FlowEdu" className="h-10 w-10" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-3 mb-4 w-full">
                  <img src="/logo.png" alt="FlowEdu" className="h-14 w-14" />
                  <h1 className="text-2xl font-bold text-foreground">FlowEdu</h1>
                </div>
                <button
                  onClick={() => {
                    const event = new KeyboardEvent('keydown', {
                      key: 'k',
                      metaKey: true,
                      bubbles: true
                    });
                    document.dispatchEvent(event);
                  }}
                  className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <Search className="h-4 w-4" />
                  <span className="flex-1 text-left">Buscar...</span>
                  <kbd className="px-2 py-0.5 text-xs bg-background rounded border border-border">
                    ⌘K
                  </kbd>
                </button>
              </>
            )}
          </div>
          
          {/* Separador - botão compactar removido para desktop */}
          <div className="border-b border-border/50 p-2" />

          {/* Navigation */}
          <TooltipProvider delayDuration={300}>
            <nav className={`flex-1 overflow-y-auto transition-all duration-300 ${
              isCompact ? 'p-2' : 'p-4'
            }`}>
              {isStudent ? (
                // Menu simples para alunos
                <ul className="space-y-1">
                  {studentNavItems.map(item => renderNavItem(item, false))}
                </ul>
              ) : (
                // Menu com categorias para professores
                <div className="space-y-1">
                  {filteredCategories.map(category => renderCategory(category))}
                </div>
              )}
            </nav>
          </TooltipProvider>

          {/* User Section */}
          <div className={`border-t border-border/50 bg-gradient-to-r from-primary/5 to-transparent transition-all duration-300 ${
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
                        className="p-2 rounded-xl text-foreground hover:bg-gradient-to-r hover:from-accent hover:to-accent/50 hover:text-accent-foreground hover:shadow-md transition-all duration-200 group"
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
                        onClick={() => {
                          localStorage.removeItem('onboarding_completed_traditional');
                          window.location.reload();
                        }}
                        className="p-2 rounded-xl text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:shadow-md transition-all duration-200 group"
                      >
                        <span className="inline-block transition-transform duration-200 group-hover:scale-110">
                          <HelpCircle className="h-4 w-4" />
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Refazer Tour</p>
                    </TooltipContent>
                  </Tooltip>
              
                  <div className="flex items-center justify-center">
                    <ThemeSelectorCompact />
                  </div>
              
                  <a
                    href="/api/logout"
                    className="p-2 rounded-xl text-destructive hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/5 hover:shadow-md transition-all duration-200 group inline-block"
                    title="Sair"
                  >
                    <span className="inline-block transition-transform duration-200 group-hover:scale-110">
                      <LogOut className="h-4 w-4" />
                    </span>
                  </a>
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
                    className="flex items-center gap-3 px-4 py-2 rounded-xl text-foreground hover:bg-gradient-to-r hover:from-accent hover:to-accent/50 hover:text-accent-foreground hover:shadow-md transition-all duration-200"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm">Meu Perfil</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      localStorage.removeItem('onboarding_completed_traditional');
                      window.location.reload();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:shadow-md transition-all duration-200"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span className="text-sm">Refazer Tour</span>
                  </button>
                  
                  <ThemeSelector
                    trigger={
                      <button className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-foreground hover:bg-gradient-to-r hover:from-accent hover:to-accent/50 hover:text-accent-foreground hover:shadow-md transition-all duration-200">
                        <Palette className="h-4 w-4" />
                        <span className="text-sm">Tema</span>
                      </button>
                    }
                  />
                  
                  <a
                    href="/api/logout"
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-destructive hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/5 hover:shadow-md transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Sair</span>
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
