/**
 * Sistema de Faixas de Progressão Profissional para Professores
 * Inspirado no sistema de faixas de karatê
 */

export type BeltColor = "white" | "yellow" | "orange" | "green" | "blue" | "purple" | "brown" | "black";

export interface BeltInfo {
  level: number;
  name: string;
  color: BeltColor;
  pointsRequired: number;
  displayColor: string; // Cor hex para exibição
  description: string;
}

/**
 * Definição das 8 faixas do sistema
 * Pontuação progressiva: cada faixa requer mais pontos que a anterior
 */
export const BELT_SYSTEM: Record<BeltColor, BeltInfo> = {
  white: {
    level: 1,
    name: "Faixa Branca",
    color: "white",
    pointsRequired: 0,
    displayColor: "#F5F5F5",
    description: "Iniciante - Começando a jornada profissional"
  },
  yellow: {
    level: 2,
    name: "Faixa Amarela",
    color: "yellow",
    pointsRequired: 100,
    displayColor: "#FCD34D",
    description: "Aprendiz - Desenvolvendo fundamentos"
  },
  orange: {
    level: 3,
    name: "Faixa Laranja",
    color: "orange",
    pointsRequired: 250,
    displayColor: "#FB923C",
    description: "Praticante - Consolidando conhecimentos"
  },
  green: {
    level: 4,
    name: "Faixa Verde",
    color: "green",
    pointsRequired: 500,
    displayColor: "#4ADE80",
    description: "Competente - Demonstrando habilidades sólidas"
  },
  blue: {
    level: 5,
    name: "Faixa Azul",
    color: "blue",
    pointsRequired: 1000,
    displayColor: "#60A5FA",
    description: "Proficiente - Dominando técnicas avançadas"
  },
  purple: {
    level: 6,
    name: "Faixa Roxa",
    color: "purple",
    pointsRequired: 2000,
    displayColor: "#A78BFA",
    description: "Experiente - Referência em sua área"
  },
  brown: {
    level: 7,
    name: "Faixa Marrom",
    color: "brown",
    pointsRequired: 4000,
    displayColor: "#A16207",
    description: "Avançado - Próximo ao domínio completo"
  },
  black: {
    level: 8,
    name: "Faixa Preta",
    color: "black",
    pointsRequired: 8000,
    displayColor: "#1F2937",
    description: "Mestre - Excelência profissional alcançada"
  }
};

/**
 * Pontuação por tipo de atividade
 */
export const ACTIVITY_POINTS = {
  class_taught: 10,           // Aula ministrada
  planning: 5,                // Planejamento de aula
  grading: 8,                 // Correção de atividades
  meeting: 15,                // Reunião pedagógica
  course_creation: 50,        // Criação de plano de curso
  material_creation: 25,      // Criação de material didático
  student_support: 12,        // Atendimento a alunos
  professional_dev: 30,       // Desenvolvimento profissional
  other: 5                    // Outras atividades
};

/**
 * Labels amigáveis para tipos de atividades
 */
export const ACTIVITY_LABELS: Record<keyof typeof ACTIVITY_POINTS, string> = {
  class_taught: "Aula Ministrada",
  planning: "Planejamento de Aula",
  grading: "Correção de Atividades",
  meeting: "Reunião Pedagógica",
  course_creation: "Criação de Plano de Curso",
  material_creation: "Criação de Material Didático",
  student_support: "Atendimento a Alunos",
  professional_dev: "Desenvolvimento Profissional",
  other: "Outras Atividades"
};

/**
 * Calcula a faixa atual baseada nos pontos totais
 */
export function calculateBelt(totalPoints: number): BeltInfo {
  const belts = Object.values(BELT_SYSTEM).sort((a, b) => b.pointsRequired - a.pointsRequired);
  
  for (const belt of belts) {
    if (totalPoints >= belt.pointsRequired) {
      return belt;
    }
  }
  
  return BELT_SYSTEM.white;
}

/**
 * Calcula a próxima faixa
 */
export function getNextBelt(currentBelt: BeltColor): BeltInfo | null {
  const current = BELT_SYSTEM[currentBelt];
  const nextLevel = current.level + 1;
  
  const nextBelt = Object.values(BELT_SYSTEM).find(b => b.level === nextLevel);
  return nextBelt || null;
}

/**
 * Calcula o progresso percentual para a próxima faixa
 */
export function calculateProgress(totalPoints: number): {
  currentBelt: BeltInfo;
  nextBelt: BeltInfo | null;
  progressPercent: number;
  pointsToNext: number;
} {
  const currentBelt = calculateBelt(totalPoints);
  const nextBelt = getNextBelt(currentBelt.color);
  
  if (!nextBelt) {
    return {
      currentBelt,
      nextBelt: null,
      progressPercent: 100,
      pointsToNext: 0
    };
  }
  
  const pointsInCurrentBelt = totalPoints - currentBelt.pointsRequired;
  const pointsNeededForNext = nextBelt.pointsRequired - currentBelt.pointsRequired;
  const progressPercent = Math.min(100, (pointsInCurrentBelt / pointsNeededForNext) * 100);
  const pointsToNext = nextBelt.pointsRequired - totalPoints;
  
  return {
    currentBelt,
    nextBelt,
    progressPercent,
    pointsToNext
  };
}
