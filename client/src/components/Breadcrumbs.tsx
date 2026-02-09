import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "wouter";

interface BreadcrumbItem {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  subjects: "Disciplinas",
  classes: "Turmas",
  schedule: "Grade de Horários",
  shifts: "Turnos",
  timeslots: "Horários",
  calendar: "Calendário Anual",
  reports: "Relatórios",
  "learning-analytics": "Análise de Aprendizagem",
  "exercise-performance": "Desempenho em Exercícios",
  "teacher-review-answers": "Revisão de Respostas",
  "learning-paths": "Trilhas de Aprendizagem",
  "active-methodologies": "Metodologias Ativas",
  tasks: "Tarefas",
  announcements: "Avisos",
  profile: "Perfil",
  admin: "Administração",
  users: "Usuários",
  "student-dashboard": "Dashboard do Aluno",
  "student-subjects": "Minhas Disciplinas",
  "student-learning-paths": "Minhas Trilhas",
  "student-announcements": "Avisos",
  "student-profile": "Meu Perfil",
  "student-exercises": "Exercícios",
  "smart-review": "Revisão Inteligente",
  "student-stats": "Estatísticas",
  students: "Alunos",
  enrollments: "Matrículas",
  materials: "Materiais",
  "ct-stats": "Estatísticas CT",
  attempt: "Tentativa",
  results: "Resultados",
  topic: "Tópico",
  subject: "Disciplina",
  "subject-details": "Detalhes da Disciplina",
};

export function Breadcrumbs() {
  const [location] = useLocation();

  // Don't show breadcrumbs on home page or login pages
  if (
    location === "/" ||
    location.includes("login") ||
    location.includes("register") ||
    location.includes("esqueci-senha") ||
    location.includes("redefinir-senha")
  ) {
    return null;
  }

  const pathSegments = location.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always add home
  breadcrumbs.push({
    label: "Início",
    path: "/dashboard",
  });

  // Build breadcrumb trail
  let currentPath = "";
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Skip IDs (numeric segments or UUIDs)
    if (/^[0-9a-f-]+$/i.test(segment)) {
      return;
    }

    const label = routeLabels[segment] || segment;
    breadcrumbs.push({
      label,
      path: currentPath,
    });
  });

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center">
          {index > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.path} className="hover:text-foreground transition-colors flex items-center gap-1">
              {index === 0 && <Home className="w-4 h-4" />}
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
