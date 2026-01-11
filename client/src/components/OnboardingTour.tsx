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

    // Passo 1: Dashboard
    tour.addStep({
      id: 'dashboard',
      text: `
        <div class="shepherd-content-custom">
          <h3 class="text-xl font-bold mb-2">📊 Dashboard</h3>
          <p class="text-gray-700">
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
            localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
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
          <p class="text-gray-700 mb-3">
            Comece criando suas disciplinas. Você pode adicionar nome, código, ementa e carga horária.
          </p>
          <p class="text-sm text-purple-700 bg-purple-50 p-2 rounded">
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
          <p class="text-gray-700 mb-3">
            A funcionalidade mais poderosa! Cole a ementa da disciplina e a IA cria automaticamente:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-1 mb-3">
            <li>Módulos organizados</li>
            <li>Tópicos detalhados</li>
            <li>Distribuição de atividades (teoria/prática)</li>
            <li>Sugestões de planos de aula</li>
          </ul>
          <p class="text-sm text-purple-700 bg-purple-50 p-2 rounded">
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
          <p class="text-gray-700 mb-3">
            Organize suas aulas semanalmente. Visualize horários, salas e marque o status de cada aula (dada, não dada ou cancelada).
          </p>
          <p class="text-sm text-cyan-700 bg-cyan-50 p-2 rounded">
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
          <p class="text-gray-700 mb-3">
            Acompanhe seu desempenho com relatórios detalhados:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-1 mb-3">
            <li>Estatísticas por disciplina</li>
            <li>Gráficos visuais</li>
            <li>Filtros por período</li>
            <li>Exportação para PDF</li>
          </ul>
          <p class="text-sm text-green-700 bg-green-50 p-2 rounded">
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
            localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
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
