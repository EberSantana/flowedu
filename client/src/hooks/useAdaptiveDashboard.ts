import { useMemo } from "react";

/**
 * Hook para configuração do Dashboard
 * 
 * Perfil único: Traditional (profissional, focado em gestão de tempo e calendário)
 */

export interface DashboardConfig {
  // Widgets principais
  showStats: boolean;
  showQuickActions: boolean;
  showTodayClasses: boolean;
  showUpcomingEvents: boolean;
  showWeeklyChart: boolean;
  
  // Widgets específicos
  showGamification: boolean; // DEPRECATED: Sempre false
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
  const config = useMemo<DashboardConfig>(() => {
    return {
      // Widgets principais
      showStats: true,
      showQuickActions: true,
      showTodayClasses: true,
      showUpcomingEvents: true,
      showWeeklyChart: true,
      
      // Específicos - Perfil Tradicional Profissional
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
  }, []);
  
  return config;
}
