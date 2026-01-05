import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, X, BookOpen, Calendar, TrendingUp, BarChart3, Lightbulb, Users, Clock, CheckCircle } from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  targetElement?: string; // Seletor CSS do elemento a destacar
}

const ONBOARDING_STEPS: Record<string, OnboardingStep[]> = {
  traditional: [
    {
      title: "Bem-vindo ao Sistema de Gestão",
      description: "Este sistema foi projetado para ajudá-lo a organizar sua carga horária e calendário de forma simples e eficiente.",
      icon: <BookOpen className="h-12 w-12 text-blue-600" />,
    },
    {
      title: "Gerencie suas Disciplinas",
      description: "Cadastre e organize suas disciplinas com facilidade. Acesse 'Disciplinas' no menu lateral para começar.",
      icon: <BookOpen className="h-12 w-12 text-blue-600" />,
      targetElement: "[href='/subjects']",
    },
    {
      title: "Visualize sua Grade de Horários",
      description: "Acompanhe sua grade completa de aulas por turno (Matutino, Vespertino, Noturno) em uma visualização clara.",
      icon: <Calendar className="h-12 w-12 text-purple-600" />,
      targetElement: "[href='/schedule']",
    },
    {
      title: "Acompanhe sua Carga Horária",
      description: "Monitore o total de aulas agendadas e sua distribuição semanal diretamente no Dashboard.",
      icon: <Clock className="h-12 w-12 text-orange-600" />,
      targetElement: "[data-tour='stats']",
    },
    {
      title: "Calendário Anual",
      description: "Gerencie datas comemorativas, eventos escolares e observações pessoais em um calendário completo.",
      icon: <Calendar className="h-12 w-12 text-green-600" />,
      targetElement: "[href='/calendar']",
    },
  ],
  
  enthusiast: [
    {
      title: "Bem-vindo, Professor!",
      description: "Você tem acesso completo a todas as funcionalidades do sistema. Vamos explorar as principais ferramentas!",
      icon: <CheckCircle className="h-12 w-12 text-blue-600" />,
    },
    {
      title: "Dashboard Completo",
      description: "Seu Dashboard mostra estatísticas, ações rápidas, aulas de hoje e eventos próximos. Personalize-o clicando em 'Personalizar'.",
      icon: <BarChart3 className="h-12 w-12 text-blue-600" />,
      targetElement: "[data-tour='stats']",
    },
    {
      title: "Ações Rápidas",
      description: "Acesse rapidamente as funcionalidades mais usadas: Nova Disciplina, Grade Completa, Relatórios, Tarefas e muito mais.",
      icon: <Users className="h-12 w-12 text-purple-600" />,
      targetElement: "[data-tour='quick-actions']",
    },
    {
      title: "Trilhas de Aprendizagem",
      description: "Crie trilhas de aprendizagem gamificadas para seus alunos com exercícios, pontos e progressão por faixas de karatê.",
      icon: <TrendingUp className="h-12 w-12 text-indigo-600" />,
      targetElement: "[href='/learning-paths']",
    },
    {
      title: "Metodologias Ativas",
      description: "Explore ferramentas pedagógicas inovadoras como Kahoot, Padlet, Mentimeter e muito mais.",
      icon: <Lightbulb className="h-12 w-12 text-amber-600" />,
      targetElement: "[href='/active-methodologies']",
    },
    {
      title: "Relatórios e Análises",
      description: "Gere relatórios detalhados de desempenho, carga horária e estatísticas de suas turmas.",
      icon: <BarChart3 className="h-12 w-12 text-green-600" />,
      targetElement: "[href='/reports']",
    },
  ],
  
  interactive: [
    {
      title: "Bem-vindo, Professor Inovador!",
      description: "Você está no perfil Interativo, focado em metodologias ativas e projetos interdisciplinares. Vamos começar!",
      icon: <Lightbulb className="h-12 w-12 text-amber-600" />,
    },
    {
      title: "Metodologias Ativas",
      description: "Acesse uma biblioteca completa de ferramentas colaborativas: Kahoot, Padlet, Miro, Mentimeter e muito mais.",
      icon: <Lightbulb className="h-12 w-12 text-amber-600" />,
      targetElement: "[href='/active-methodologies']",
    },
    {
      title: "Projetos Interdisciplinares",
      description: "Crie e gerencie projetos que integram múltiplas disciplinas e envolvem grupos de alunos.",
      icon: <Users className="h-12 w-12 text-blue-600" />,
      targetElement: "[href='/interactive-projects']",
    },
    {
      title: "Trilhas de Aprendizagem Gamificadas",
      description: "Combine projetos com trilhas gamificadas para engajar seus alunos de forma inovadora.",
      icon: <TrendingUp className="h-12 w-12 text-indigo-600" />,
      targetElement: "[href='/learning-paths']",
    },
    {
      title: "Acompanhe o Engajamento",
      description: "Monitore a participação dos alunos em projetos e metodologias ativas através de relatórios específicos.",
      icon: <BarChart3 className="h-12 w-12 text-green-600" />,
      targetElement: "[href='/reports']",
    },
  ],
  
  organizational: [
    {
      title: "Bem-vindo ao Painel de Gestão",
      description: "Você está no perfil Organizacional, focado em relatórios, automações e controle total de atividades.",
      icon: <BarChart3 className="h-12 w-12 text-blue-600" />,
    },
    {
      title: "Relatórios Completos",
      description: "Gere relatórios detalhados de carga horária, desempenho de turmas e estatísticas de pensamento computacional.",
      icon: <BarChart3 className="h-12 w-12 text-green-600" />,
      targetElement: "[href='/reports']",
    },
    {
      title: "Grade de Horários Organizada",
      description: "Visualize e gerencie sua grade completa com filtros por disciplina, turma e turno.",
      icon: <Calendar className="h-12 w-12 text-purple-600" />,
      targetElement: "[href='/schedule']",
    },
    {
      title: "Controle de Carga Horária",
      description: "Acompanhe sua carga horária total e distribuição semanal de aulas em tempo real.",
      icon: <Clock className="h-12 w-12 text-orange-600" />,
      targetElement: "[data-tour='stats']",
    },
    {
      title: "Calendário e Eventos",
      description: "Gerencie datas importantes, eventos escolares e prazos em um calendário anual completo.",
      icon: <Calendar className="h-12 w-12 text-teal-600" />,
      targetElement: "[href='/calendar']",
    },
  ],
};

export function ProfileOnboarding() {
  const { user } = useAuth();
  const profile = user?.profile || 'enthusiast';
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  
  const steps = ONBOARDING_STEPS[profile] || ONBOARDING_STEPS.enthusiast;
  
  useEffect(() => {
    // Verificar se o usuário já viu o onboarding deste perfil
    const storageKey = `onboarding_completed_${profile}`;
    const hasCompleted = localStorage.getItem(storageKey);
    
    if (!hasCompleted) {
      // Aguardar 1 segundo antes de mostrar para garantir que a página carregou
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [profile]);
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleClose = () => {
    if (dontShowAgain) {
      const storageKey = `onboarding_completed_${profile}`;
      localStorage.setItem(storageKey, 'true');
    }
    setIsOpen(false);
    setCurrentStep(0);
  };
  
  const handleSkip = () => {
    const storageKey = `onboarding_completed_${profile}`;
    localStorage.setItem(storageKey, 'true');
    setIsOpen(false);
    setCurrentStep(0);
  };
  
  const currentStepData = steps[currentStep];
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              {currentStepData.icon}
              {currentStepData.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-base mt-4">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>
        
        {/* Indicador de progresso */}
        <div className="flex items-center justify-center gap-2 my-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-blue-600'
                  : index < currentStep
                  ? 'w-2 bg-blue-400'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <label
              htmlFor="dont-show"
              className="text-sm text-gray-600 cursor-pointer"
            >
              Não mostrar novamente
            </label>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
            >
              Pular Tour
            </Button>
            
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
            
            <Button
              onClick={handleNext}
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                'Concluir'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook para resetar o onboarding (útil para testes ou botão "Refazer Tour")
 */
export function useResetOnboarding() {
  const { user } = useAuth();
  const profile = user?.profile || 'enthusiast';
  
  return () => {
    const storageKey = `onboarding_completed_${profile}`;
    localStorage.removeItem(storageKey);
    window.location.reload();
  };
}
