import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useLocation } from "wouter";
import {
  Search,
  Home,
  Calendar,
  BookOpen,
  Users,
  Clock,
  Settings,
  BarChart3,
  FileText,
  ClipboardList,
  UserCircle,
  Shield,
  X,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

// Rotas públicas onde o CommandPalette não deve ser renderizado
const PUBLIC_ROUTES = [
  '/',
  '/cadastro-professor',
  '/login-professor',
  '/esqueci-senha',
  '/redefinir-senha',
  '/student-login',
  '/register',
];

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
  category: string;
}

// Componente interno que usa useAuth
function CommandPaletteInner() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Close on escape
  useEffect(() => {
    if (!open) return;

    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  const navigate = (path: string) => {
    setLocation(path);
    setOpen(false);
    setSearch("");
  };

  // Define all available commands
  const commands: CommandItem[] = [
    // Dashboard
    {
      id: "home",
      label: "Dashboard",
      description: "Página inicial",
      icon: <Home className="w-4 h-4" />,
      action: () => navigate("/dashboard"),
      keywords: ["dashboard", "início", "home", "principal"],
      category: "Navegação",
    },
    // Disciplinas
    {
      id: "subjects",
      label: "Disciplinas",
      description: "Gerenciar disciplinas",
      icon: <BookOpen className="w-4 h-4" />,
      action: () => navigate("/subjects"),
      keywords: ["disciplinas", "matérias", "subjects", "cursos"],
      category: "Acadêmico",
    },
    // Turmas
    {
      id: "classes",
      label: "Turmas",
      description: "Gerenciar turmas",
      icon: <Users className="w-4 h-4" />,
      action: () => navigate("/classes"),
      keywords: ["turmas", "classes", "alunos", "grupos"],
      category: "Acadêmico",
    },
    // Grade de Horários
    {
      id: "schedule",
      label: "Grade de Horários",
      description: "Visualizar grade completa",
      icon: <Calendar className="w-4 h-4" />,
      action: () => navigate("/schedule"),
      keywords: ["grade", "horários", "schedule", "aulas", "calendário"],
      category: "Horários",
    },
    // Agendar Aula
    {
      id: "schedule-class",
      label: "Agendar Aula",
      description: "Criar novo agendamento",
      icon: <Clock className="w-4 h-4" />,
      action: () => navigate("/schedule"),
      keywords: ["agendar", "nova aula", "schedule", "criar"],
      category: "Horários",
    },
    // Calendário Anual
    {
      id: "annual-calendar",
      label: "Calendário Anual",
      description: "Eventos e datas importantes",
      icon: <Calendar className="w-4 h-4" />,
      action: () => navigate("/calendar"),
      keywords: ["calendário", "anual", "eventos", "feriados", "datas"],
      category: "Planejamento",
    },
    // Configurações de Turnos
    {
      id: "shifts-config",
      label: "Configurar Turnos",
      description: "Gerenciar turnos e horários",
      icon: <Settings className="w-4 h-4" />,
      action: () => navigate("/shifts"),
      keywords: ["turnos", "configurar", "horários", "períodos"],
      category: "Configurações",
    },
    // Relatório de Desempenho
    {
      id: "performance-report",
      label: "Relatório de Desempenho",
      description: "Estatísticas e análises",
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => navigate("/reports"),
      keywords: ["relatório", "desempenho", "estatísticas", "análise"],
      category: "Relatórios",
    },
    // Banco de Exercícios
    {
      id: "exercises",
      label: "Banco de Exercícios",
      description: "Gerenciar exercícios",
      icon: <ClipboardList className="w-4 h-4" />,
      action: () => navigate("/questions"),
      keywords: ["exercícios", "questões", "provas", "atividades"],
      category: "Conteúdo",
    },
    // Revisão de Respostas
    {
      id: "review-answers",
      label: "Revisão de Respostas",
      description: "Revisar respostas abertas",
      icon: <FileText className="w-4 h-4" />,
      action: () => navigate("/questions"),
      keywords: ["revisão", "respostas", "correção", "avaliar"],
      category: "Avaliação",
    },
    // Perfil
    {
      id: "profile",
      label: "Meu Perfil",
      description: "Editar informações pessoais",
      icon: <UserCircle className="w-4 h-4" />,
      action: () => navigate("/profile"),
      keywords: ["perfil", "conta", "usuário", "dados"],
      category: "Conta",
    },
  ];

  // Add admin commands if user is admin
  if (user?.role === "admin") {
    commands.push(
      {
        id: "admin-users",
        label: "Gerenciar Usuários",
        description: "Administração de usuários",
        icon: <Shield className="w-4 h-4" />,
        action: () => navigate("/admin/users"),
        keywords: ["admin", "usuários", "gerenciar", "administração"],
        category: "Administração",
      }
    );
  }

  // Filter commands based on search
  const filteredCommands = commands.filter((cmd) => {
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords.some((kw) => kw.toLowerCase().includes(searchLower))
    );
  });

  // Group commands by category
  const groupedCommands = filteredCommands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = [];
      }
      acc[cmd.category].push(cmd);
      return acc;
    },
    {} as Record<string, CommandItem[]>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
        <Command className="rounded-lg border border-border bg-background shadow-2xl">
          <div className="flex items-center border-b border-border px-4">
            <Search className="w-5 h-5 text-muted-foreground mr-2" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Digite para buscar... (Cmd+K)"
              className="flex h-14 w-full bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              onClick={() => setOpen(false)}
              className="ml-2 p-2 hover:bg-accent rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            {filteredCommands.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhum resultado encontrado.
              </div>
            )}

            {Object.entries(groupedCommands).map(([category, items]) => (
              <Command.Group
                key={category}
                heading={category}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {items.map((cmd) => (
                  <Command.Item
                    key={cmd.id}
                    onSelect={() => cmd.action()}
                    className="flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer hover:bg-accent data-[selected=true]:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
                      {cmd.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{cmd.label}</div>
                      {cmd.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {cmd.description}
                        </div>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-muted rounded text-xs">↑</kbd>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">↓</kbd>
                <span className="ml-1">navegar</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-muted rounded text-xs">↵</kbd>
                <span className="ml-1">selecionar</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-muted rounded text-xs">esc</kbd>
                <span className="ml-1">fechar</span>
              </div>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}

// Componente wrapper que verifica a rota ANTES de renderizar o componente interno
export function CommandPalette() {
  const [location] = useLocation();
  
  // Verificar se estamos em uma rota pública ANTES de renderizar o componente interno
  const isPublicRoute = PUBLIC_ROUTES.some(route => location === route || location.startsWith(route + '/'));
  
  // Se estamos em uma rota pública, não renderizar nada (e não chamar useAuth)
  if (isPublicRoute) {
    return null;
  }
  
  // Só renderizar o componente interno (que usa useAuth) em rotas protegidas
  return <CommandPaletteInner />;
}
