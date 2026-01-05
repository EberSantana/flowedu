import { useAuth } from "@/_core/hooks/useAuth";
import { useMemo } from "react";

/**
 * Hook para adaptar widgets do Dashboard baseado no perfil do professor
 * 
 * Perfis:
 * - traditional: Foco em carga horária, calendário, sem gamificação
 * - enthusiast: Todos os widgets (padrão atual)
 * - interactive: Destaque para metodologias ativas e projetos
 * - organizational: Destaque para relatórios e automações
 */

export interface DashboardConfig {
  // Widgets principais
  showStats: boolean;
  showQuickActions: boolean;
  showTodayClasses: boolean;
  showUpcomingEvents: boolean;
  showWeeklyChart: boolean;
  
  // Widgets específicos por perfil
  showGamification: boolean; // DEPRECATED: Gamificação removida da plataforma
  showMethodologies: boolean;
  showProjects: boolean;
  showReports: boolean;
  showWorkloadHighlight: boolean;
  
  // Configurações de layout
  statsOrder: string[]; // Ordem dos cards de estatísticas
  quickActionsOrder: string[]; // Ordem das ações rápidas
  
  // Mensagens personalizadas
  welcomeMessage: string;
  dashboardDescription: string;
}

export function useAdaptiveDashboard(): DashboardConfig {
  const { user } = useAuth();
  const profile = user?.profile || 'enthusiast';
  
  const config = useMemo<DashboardConfig>(() => {
    switch (profile) {
      case 'traditional':
        return {
          // Widgets principais
          showStats: true,
          showQuickActions: true,
          showTodayClasses: true,
          showUpcomingEvents: true,
          showWeeklyChart: true,
          
          // Específicos
          showGamification: false, // Gamificação removida
          showMethodologies: false,
          showProjects: false,
          showReports: true,
          showWorkloadHighlight: true, // Destacar carga horária
          
          // Layout
          statsOrder: ['workload', 'subjects', 'classes', 'schedule'], // Carga horária primeiro
          quickActionsOrder: ['schedule', 'subjects', 'classes', 'calendar'],
          
          // Mensagens
          welcomeMessage: 'Bem-vindo ao seu sistema de gestão',
          dashboardDescription: 'Visão geral da sua carga horária e calendário',
        };
        
      case 'interactive':
        return {
          // Widgets principais
          showStats: true,
          showQuickActions: true,
          showTodayClasses: true,
          showUpcomingEvents: true,
          showWeeklyChart: true,
          
          // Específicos
          showGamification: false, // Gamificação removida
          showMethodologies: true, // Destacar metodologias ativas
          showProjects: true, // Destacar projetos
          showReports: false,
          showWorkloadHighlight: false,
          
          // Layout
          statsOrder: ['projects', 'methodologies', 'subjects', 'classes'],
          quickActionsOrder: ['methodologies', 'projects', 'schedule', 'subjects'],
          
          // Mensagens
          welcomeMessage: 'Bem-vindo, professor inovador!',
          dashboardDescription: 'Explore metodologias ativas e projetos interdisciplinares',
        };
        
      case 'organizational':
        return {
          // Widgets principais
          showStats: true,
          showQuickActions: true,
          showTodayClasses: true,
          showUpcomingEvents: true,
          showWeeklyChart: true,
          
          // Específicos
          showGamification: false,
          showMethodologies: false,
          showProjects: false,
          showReports: true, // Destacar relatórios
          showWorkloadHighlight: true,
          
          // Layout
          statsOrder: ['schedule', 'workload', 'subjects', 'classes'],
          quickActionsOrder: ['reports', 'schedule', 'calendar', 'subjects'],
          
          // Mensagens
          welcomeMessage: 'Bem-vindo ao painel de gestão',
          dashboardDescription: 'Controle total sobre suas atividades e relatórios',
        };
        
      case 'enthusiast':
      default:
        return {
          // Widgets principais
          showStats: true,
          showQuickActions: true,
          showTodayClasses: true,
          showUpcomingEvents: true,
          showWeeklyChart: true,
          
          // Específicos (mostrar tudo)
          showGamification: false, // Gamificação removida
          showMethodologies: true,
          showProjects: true,
          showReports: true,
          showWorkloadHighlight: true,
          
          // Layout padrão
          statsOrder: ['subjects', 'classes', 'schedule', 'workload'],
          quickActionsOrder: ['schedule', 'subjects', 'classes', 'methodologies'],
          
          // Mensagens
          welcomeMessage: 'Bem-vindo, professor!',
          dashboardDescription: 'Visão geral do seu sistema de gestão de tempo',
        };
    }
  }, [profile]);
  
  return config;
}
