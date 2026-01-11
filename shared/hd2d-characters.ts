/**
 * Configuração dos personagens HD-2D (Octopath Traveler II Style)
 * Sistema de avatares pixel art com iluminação volumétrica e efeitos visuais
 */

export interface HD2DCharacter {
  id: number;
  name: string;
  title: string;
  description: string;
  imagePath: string;
  beltColor: string; // Faixa padrão do personagem
  unlockLevel: number; // Nível necessário para desbloquear
  unlockPoints: number; // Pontos necessários para desbloquear
  personality: string; // Traço de personalidade
  specialAbility: string; // Habilidade especial temática
  auraColor: string; // Cor da aura/glow do personagem
}

export const HD2D_CHARACTERS: HD2DCharacter[] = [
  {
    id: 1,
    name: "Warrior",
    title: "O Guerreiro Determinado",
    description: "Um jovem guerreiro com determinação inabalável e espírito de luta.",
    imagePath: "/avatars/character-1-warrior.png",
    beltColor: "white",
    unlockLevel: 1,
    unlockPoints: 0,
    personality: "Determinado e corajoso",
    specialAbility: "Força Interior",
    auraColor: "#f59e0b", // Amber
  },
  {
    id: 2,
    name: "Scholar",
    title: "A Estudiosa Sábia",
    description: "Uma jovem inteligente que busca conhecimento através da disciplina.",
    imagePath: "/avatars/character-2-scholar.png",
    beltColor: "yellow",
    unlockLevel: 5,
    unlockPoints: 500,
    personality: "Inteligente e analítica",
    specialAbility: "Mente Brilhante",
    auraColor: "#3b82f6", // Blue
  },
  {
    id: 3,
    name: "Guardian",
    title: "O Guardião Protetor",
    description: "Um defensor poderoso que protege os mais fracos com sua força.",
    imagePath: "/avatars/character-3-guardian.png",
    beltColor: "orange",
    unlockLevel: 10,
    unlockPoints: 1000,
    personality: "Protetor e leal",
    specialAbility: "Escudo Inabalável",
    auraColor: "#f97316", // Orange
  },
  {
    id: 4,
    name: "Dancer",
    title: "A Dançarina Graciosa",
    description: "Uma artista marcial que combina graça e poder em movimentos fluidos.",
    imagePath: "/avatars/character-4-dancer.png",
    beltColor: "green",
    unlockLevel: 15,
    unlockPoints: 1500,
    personality: "Graciosa e ágil",
    specialAbility: "Dança do Vento",
    auraColor: "#10b981", // Emerald
  },
  {
    id: 5,
    name: "Monk",
    title: "O Monge Sereno",
    description: "Um sábio que encontrou paz interior através da meditação e treino.",
    imagePath: "/avatars/character-5-monk.png",
    beltColor: "blue",
    unlockLevel: 20,
    unlockPoints: 2000,
    personality: "Calmo e sábio",
    specialAbility: "Serenidade Mística",
    auraColor: "#6366f1", // Indigo
  },
  {
    id: 6,
    name: "Rogue",
    title: "A Ladina Ágil",
    description: "Uma lutadora veloz que domina técnicas furtivas e precisas.",
    imagePath: "/avatars/character-6-rogue.png",
    beltColor: "purple",
    unlockLevel: 25,
    unlockPoints: 2500,
    personality: "Ágil e astuta",
    specialAbility: "Sombra Veloz",
    auraColor: "#a855f7", // Purple
  },
  {
    id: 7,
    name: "Healer",
    title: "A Curandeira Compassiva",
    description: "Uma alma gentil que usa suas habilidades para ajudar e curar.",
    imagePath: "/avatars/character-7-healer.png",
    beltColor: "brown",
    unlockLevel: 30,
    unlockPoints: 3000,
    personality: "Compassiva e gentil",
    specialAbility: "Luz Curativa",
    auraColor: "#eab308", // Yellow
  },
  {
    id: 8,
    name: "Master",
    title: "O Mestre Lendário",
    description: "Um mestre lendário que dominou todas as técnicas e alcançou a perfeição.",
    imagePath: "/avatars/character-8-master.png",
    beltColor: "black",
    unlockLevel: 40,
    unlockPoints: 4000,
    personality: "Sábio e poderoso",
    specialAbility: "Domínio Total",
    auraColor: "#ef4444", // Red
  },
];

/**
 * Obter personagem por ID
 */
export function getCharacterById(id: number): HD2DCharacter | undefined {
  return HD2D_CHARACTERS.find((char) => char.id === id);
}

/**
 * Obter personagens desbloqueados baseado em pontos
 */
export function getUnlockedCharacters(totalPoints: number): HD2DCharacter[] {
  return HD2D_CHARACTERS.filter((char) => totalPoints >= char.unlockPoints);
}

/**
 * Verificar se personagem está desbloqueado
 */
export function isCharacterUnlocked(characterId: number, totalPoints: number): boolean {
  const character = getCharacterById(characterId);
  if (!character) return false;
  return totalPoints >= character.unlockPoints;
}

/**
 * Obter próximo personagem a desbloquear
 */
export function getNextCharacterToUnlock(totalPoints: number): HD2DCharacter | null {
  const locked = HD2D_CHARACTERS.filter((char) => totalPoints < char.unlockPoints);
  return locked.length > 0 ? locked[0] : null;
}
