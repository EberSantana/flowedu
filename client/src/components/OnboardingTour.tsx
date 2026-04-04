import { useEffect } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

const TOUR_COMPLETED_KEY = 'onboarding_tour_completed';

export function useOnboardingTour() {
  useEffect(() => {
    // Verificar se o tour já foi completado
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (tourCompleted === 'true') {
      return;
    }

    // Aguardar um pouco para garantir que a página carregou
    const timer = setTimeout(() => {
      startTour();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const startTour = () => {
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: {
          enabled: true,
        },
        classes: 'shepherd-theme-custom',
        scrollTo: { behavior: 'smooth', block: 'center' },
      },
    });

    // Marcar como completado quando o tour é cancelado (botão X ou clique fora)
    tour.on('cancel', () => {
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    });

    // Marcar como completado quando o tour é finalizado normalmente
    tour.on('complete', () => {
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    });

    // Passo 1: Dashboard
    tour.addStep({
      id: 'dashboard',
      text: `
        <div class="shepherd-content-custom">
          <h3 class="text-xl font-bold mb-2">👋 Bem-vindo ao FlowEdu!</h3>
          <p class="opacity-80 mb-2">
            <strong>Onde a educação flui.</strong>
          </p>
          <p class="opacity-80">
            Aqui você tem uma visão geral do sistema: disciplinas, turmas, aulas agendadas e estatísticas de aulas dadas.
          </p>
        </div>
      `,
      attachTo: {
        element: '[data-tour="stats"]',
        on: 'bottom',
      },
      buttons: [
        {
          text: 'Pular Tour',
          action: () => {
            tour.cancel();
          },
          secondary: true,
        },
        {
          text: 'Próximo',
          action: tour.next,
        },
      ],
    });

    // Passo 2: Criar Disciplina
    tour.addStep({
      id: 'create-subject',
      text: `
        <div class="shepherd-content-custom">
          <h3 class="text-xl font-bold mb-2">📚 Disciplinas</h3>
          <p class="opacity-80 mb-3">
            Comece criando suas disciplinas. Você pode adicionar nome, código, ementa e carga horária.
          </p>
          <p class="text-sm p-2 rounded shepherd-tip-box">
            💡 Dica: Acesse o menu lateral "Disciplinas" para gerenciar todas as suas matérias.
          </p>
        </div>
      `,
      attachTo: {
        element: '[data-tour="quick-actions"]',
        on: 'bottom',
      },
      buttons: [
        {
          text: 'Anterior',
          action: tour.back,
          secondary: true,
        },
        {
          text: 'Próximo',
          action: tour.next,
        },
      ],
    });

    // Passo 3: Trilhas de Aprendizagem
    tour.addStep({
      id: 'learning-paths',
      text: `
        <div class="shepherd-content-custom">
          <h3 class="text-xl font-bold mb-2">🚀 Trilhas de Aprendizagem com IA</h3>
          <p class="opacity-80 mb-3">
            A funcionalidade mais poderosa! Cole a ementa da disciplina e a IA cria automaticamente:
          </p>
          <ul class="list-disc list-inside opacity-80 space-y-1 mb-3">
            <li>Módulos organizados</li>
            <li>Tópicos detalhados</li>
            <li>Distribuição de atividades (teoria/prática)</li>
            <li>Sugestões de planos de aula</li>
          </ul>
          <p class="text-sm p-2 rounded shepherd-tip-box">
            ✨ Acesse "Trilhas de Aprendizagem" no menu lateral!
          </p>
        </div>
      `,
      buttons: [
        {
          text: 'Anterior',
          action: tour.back,
          secondary: true,
        },
        {
          text: 'Próximo',
          action: tour.next,
        },
      ],
    });

    // Passo 4: Grade Semanal
    tour.addStep({
      id: 'schedule',
      text: `
        <div class="shepherd-content-custom">
          <h3 class="text-xl font-bold mb-2">📅 Grade Semanal</h3>
          <p class="opacity-80 mb-3">
            Organize suas aulas semanalmente. Visualize horários, salas e marque o status de cada aula (dada, não dada ou cancelada).
          </p>
          <p class="text-sm p-2 rounded shepherd-tip-box">
            💡 Clique duas vezes em um status para desmarcá-lo!
          </p>
        </div>
      `,
      buttons: [
        {
          text: 'Anterior',
          action: tour.back,
          secondary: true,
        },
        {
          text: 'Próximo',
          action: tour.next,
        },
      ],
    });

    // Passo 5: Relatórios
    tour.addStep({
      id: 'reports',
      text: `
        <div class="shepherd-content-custom">
          <h3 class="text-xl font-bold mb-2">📈 Relatórios</h3>
          <p class="opacity-80 mb-3">
            Acompanhe seu desempenho com relatórios detalhados:
          </p>
          <ul class="list-disc list-inside opacity-80 space-y-1 mb-3">
            <li>Estatísticas por disciplina</li>
            <li>Gráficos visuais</li>
            <li>Filtros por período</li>
            <li>Exportação para PDF</li>
          </ul>
          <p class="text-sm p-2 rounded shepherd-tip-box">
            ✅ Pronto! Agora você conhece as principais funcionalidades. Boa aula!
          </p>
        </div>
      `,
      buttons: [
        {
          text: 'Anterior',
          action: tour.back,
          secondary: true,
        },
        {
          text: 'Concluir',
          action: () => {
            tour.complete();
          },
        },
      ],
    });

    tour.start();
  };

  return { startTour };
}

export function resetTour() {
  localStorage.removeItem(TOUR_COMPLETED_KEY);
}
