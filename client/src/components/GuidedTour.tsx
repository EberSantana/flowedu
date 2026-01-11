import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useLocation } from "wouter";

interface GuidedTourProps {
  run?: boolean;
  onComplete?: () => void;
}

export function GuidedTour({ run = false, onComplete }: GuidedTourProps) {
  const [location] = useLocation();
  const [tourRun, setTourRun] = useState(run);

  useEffect(() => {
    setTourRun(run);
  }, [run]);

  // Define steps based on current page
  const getDashboardSteps = (): Step[] => [
    {
      target: "body",
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Bem-vindo ao Sistema de Gestão Educacional!</h3>
          <p>Vamos fazer um tour rápido pelas principais funcionalidades do sistema.</p>
        </div>
      ),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '[href="/subjects"]',
      content: (
        <div>
          <h4 className="font-semibold mb-1">Disciplinas</h4>
          <p>Aqui você gerencia todas as suas disciplinas, incluindo planos de curso, materiais e integrações com Google Drive e Classroom.</p>
        </div>
      ),
      placement: "right",
    },
    {
      target: '[href="/classes"]',
      content: (
        <div>
          <h4 className="font-semibold mb-1">Turmas</h4>
          <p>Gerencie suas turmas, matrículas de alunos e organize seus grupos de estudo.</p>
        </div>
      ),
      placement: "right",
    },
    {
      target: '[href="/schedule"]',
      content: (
        <div>
          <h4 className="font-semibold mb-1">Grade de Horários</h4>
          <p>Visualize e organize sua grade semanal de aulas com filtros por disciplina e turma.</p>
        </div>
      ),
      placement: "right",
    },
    {
      target: '[href="/calendar"]',
      content: (
        <div>
          <h4 className="font-semibold mb-1">Calendário Anual</h4>
          <p>Acompanhe eventos importantes, feriados e datas comemorativas ao longo do ano.</p>
        </div>
      ),
      placement: "right",
    },
    {
      target: "button[title='Buscar...']",
      content: (
        <div>
          <h4 className="font-semibold mb-1">Busca Rápida</h4>
          <p>Use <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘K</kbd> ou <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+K</kbd> para abrir a busca global e navegar rapidamente entre as páginas.</p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: ".theme-toggle",
      content: (
        <div>
          <h4 className="font-semibold mb-1">Tema</h4>
          <p>Alterne entre modo claro, escuro ou automático (segue o sistema) para melhor conforto visual.</p>
        </div>
      ),
      placement: "left",
    },
    {
      target: "body",
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Tour Concluído!</h3>
          <p>Você pode refazer este tour a qualquer momento clicando no ícone de ajuda no menu lateral.</p>
          <p className="mt-2 text-sm text-muted-foreground">Dica: Explore cada seção para descobrir mais funcionalidades!</p>
        </div>
      ),
      placement: "center",
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setTourRun(false);
      onComplete?.();
    }
  };

  // Only show tour on dashboard
  if (location !== "/dashboard") {
    return null;
  }

  return (
    <Joyride
      steps={getDashboardSteps()}
      run={tourRun}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "oklch(0.45 0.03 240)",
          textColor: "oklch(0.28 0.01 240)",
          backgroundColor: "oklch(1 0 0)",
          arrowColor: "oklch(1 0 0)",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "0.5rem",
          padding: "1.5rem",
        },
        tooltipContent: {
          padding: "0.5rem 0",
        },
        buttonNext: {
          backgroundColor: "oklch(0.45 0.03 240)",
          borderRadius: "0.375rem",
          padding: "0.5rem 1rem",
        },
        buttonBack: {
          color: "oklch(0.50 0.01 240)",
          marginRight: "0.5rem",
        },
        buttonSkip: {
          color: "oklch(0.50 0.01 240)",
        },
      }}
      locale={{
        back: "Voltar",
        close: "Fechar",
        last: "Concluir",
        next: "Próximo",
        skip: "Pular",
      }}
    />
  );
}
