import { describe, it, expect } from "vitest";

/**
 * Algoritmo SM-2 (SuperMemo 2) para repetição espaçada
 * Implementação baseada em: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 */

interface SM2Result {
  interval: number;
  repetitions: number;
  easeFactor: number;
}

function calculateSM2(
  quality: number, // 0-5 (0 = erro total, 5 = perfeito)
  repetitions: number,
  previousInterval: number,
  previousEaseFactor: number
): SM2Result {
  let newEaseFactor = previousEaseFactor;
  let newRepetitions = repetitions;
  let newInterval = previousInterval;

  // Calcular novo easeFactor
  newEaseFactor = previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Garantir que easeFactor não seja menor que 1.3
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  // Se a resposta foi correta (quality >= 3)
  if (quality >= 3) {
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(previousInterval * newEaseFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    // Se errou, reiniciar
    newRepetitions = 0;
    newInterval = 1;
  }

  return {
    interval: newInterval,
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
  };
}

/**
 * Converter auto-avaliação para quality score do SM-2
 */
function selfRatingToQuality(rating: "again" | "hard" | "good" | "easy", wasCorrect: boolean): number {
  if (!wasCorrect) return 0; // Erro total
  
  switch (rating) {
    case "again":
      return 2; // Difícil, mas lembrou
    case "hard":
      return 3; // Correto com esforço
    case "good":
      return 4; // Correto
    case "easy":
      return 5; // Perfeito
    default:
      return 3;
  }
}

describe("Algoritmo SM-2 de Repetição Espaçada", () => {
  it("Deve iniciar com valores padrão corretos", () => {
    const initialState = {
      interval: 0,
      repetitions: 0,
      easeFactor: 2.5,
    };

    expect(initialState.easeFactor).toBe(2.5);
    expect(initialState.interval).toBe(0);
    expect(initialState.repetitions).toBe(0);
  });

  it("Deve aumentar intervalo após primeira revisão correta", () => {
    const result = calculateSM2(
      4, // quality = good
      0, // primeira revisão
      0, // sem intervalo anterior
      2.5 // easeFactor inicial
    );

    expect(result.interval).toBe(1); // Primeira revisão: 1 dia
    expect(result.repetitions).toBe(1);
    expect(result.easeFactor).toBeGreaterThanOrEqual(2.5);
  });

  it("Deve aumentar intervalo para 6 dias na segunda revisão correta", () => {
    const result = calculateSM2(
      4, // quality = good
      1, // segunda revisão
      1, // intervalo anterior de 1 dia
      2.5
    );

    expect(result.interval).toBe(6); // Segunda revisão: 6 dias
    expect(result.repetitions).toBe(2);
  });

  it("Deve multiplicar intervalo por easeFactor após segunda revisão", () => {
    const result = calculateSM2(
      4, // quality = good
      2, // terceira revisão
      6, // intervalo anterior de 6 dias
      2.5 // easeFactor
    );

    expect(result.interval).toBe(Math.round(6 * 2.5)); // 15 dias
    expect(result.repetitions).toBe(3);
  });

  it("Deve reiniciar intervalo quando resposta estiver incorreta", () => {
    const result = calculateSM2(
      1, // quality < 3 (erro)
      5, // mesmo com muitas repetições
      30, // intervalo anterior grande
      2.8
    );

    expect(result.interval).toBe(1); // Reinicia para 1 dia
    expect(result.repetitions).toBe(0); // Reinicia repetições
  });

  it("Deve reduzir easeFactor quando resposta for difícil", () => {
    const result = calculateSM2(
      2, // quality baixo
      0,
      0,
      2.5
    );

    expect(result.easeFactor).toBeLessThan(2.5);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3); // Mínimo
  });

  it("Deve aumentar easeFactor quando resposta for fácil", () => {
    const result = calculateSM2(
      5, // quality = easy/perfect
      0,
      0,
      2.5
    );

    expect(result.easeFactor).toBeGreaterThan(2.5);
  });

  it("Deve garantir easeFactor mínimo de 1.3", () => {
    // Simular múltiplas respostas ruins
    let state = { interval: 0, repetitions: 0, easeFactor: 2.5 };

    for (let i = 0; i < 10; i++) {
      state = calculateSM2(0, state.repetitions, state.interval, state.easeFactor);
    }

    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("Deve converter auto-avaliação 'again' corretamente", () => {
    const quality = selfRatingToQuality("again", true);
    expect(quality).toBe(2);
  });

  it("Deve converter auto-avaliação 'hard' corretamente", () => {
    const quality = selfRatingToQuality("hard", true);
    expect(quality).toBe(3);
  });

  it("Deve converter auto-avaliação 'good' corretamente", () => {
    const quality = selfRatingToQuality("good", true);
    expect(quality).toBe(4);
  });

  it("Deve converter auto-avaliação 'easy' corretamente", () => {
    const quality = selfRatingToQuality("easy", true);
    expect(quality).toBe(5);
  });

  it("Deve retornar 0 para resposta incorreta independente da auto-avaliação", () => {
    const quality = selfRatingToQuality("easy", false);
    expect(quality).toBe(0);
  });

  it("Deve simular sequência realista de revisões bem-sucedidas", () => {
    let state = { interval: 0, repetitions: 0, easeFactor: 2.5 };
    const schedule: number[] = [];

    // Simular 5 revisões bem-sucedidas
    for (let i = 0; i < 5; i++) {
      state = calculateSM2(4, state.repetitions, state.interval, state.easeFactor);
      schedule.push(state.interval);
    }

    // Verificar progressão esperada: 1, 6, 15, 37, 92 dias (aproximadamente)
    expect(schedule[0]).toBe(1);
    expect(schedule[1]).toBe(6);
    expect(schedule[2]).toBeGreaterThan(10);
    expect(schedule[3]).toBeGreaterThan(30);
    expect(schedule[4]).toBeGreaterThan(70);
  });

  it("Deve simular sequência com erro no meio", () => {
    let state = { interval: 0, repetitions: 0, easeFactor: 2.5 };

    // Primeira revisão: sucesso
    state = calculateSM2(4, state.repetitions, state.interval, state.easeFactor);
    expect(state.interval).toBe(1);

    // Segunda revisão: sucesso
    state = calculateSM2(4, state.repetitions, state.interval, state.easeFactor);
    expect(state.interval).toBe(6);

    // Terceira revisão: ERRO
    state = calculateSM2(1, state.repetitions, state.interval, state.easeFactor);
    expect(state.interval).toBe(1); // Reinicia
    expect(state.repetitions).toBe(0); // Reinicia

    // Quarta revisão: sucesso novamente
    state = calculateSM2(4, state.repetitions, state.interval, state.easeFactor);
    expect(state.interval).toBe(1); // Recomeça do início
  });
});

describe("Cálculo de Prioridade de Revisão", () => {
  function calculatePriority(
    daysOverdue: number,
    successRate: number,
    difficultyScore: number
  ): number {
    // Peso dos fatores
    const overdueWeight = 0.4;
    const successWeight = 0.3;
    const difficultyWeight = 0.3;

    // Normalizar daysOverdue (0-100)
    const overdueScore = Math.min(100, daysOverdue * 10);

    // Inverter successRate (quanto menor, maior a prioridade)
    const failureScore = 100 - successRate;

    // Calcular prioridade final
    const priority =
      overdueScore * overdueWeight +
      failureScore * successWeight +
      difficultyScore * difficultyWeight;

    return Math.round(priority);
  }

  it("Deve calcular prioridade alta para item atrasado", () => {
    const priority = calculatePriority(
      5, // 5 dias atrasado
      80, // 80% de acerto
      50 // dificuldade média
    );

    expect(priority).toBeGreaterThan(30);
  });

  it("Deve calcular prioridade alta para item com baixa taxa de sucesso", () => {
    const priority = calculatePriority(
      0, // não atrasado
      20, // apenas 20% de acerto
      50
    );

    expect(priority).toBeGreaterThan(30);
  });

  it("Deve calcular prioridade baixa para item dominado", () => {
    const priority = calculatePriority(
      0, // não atrasado
      95, // 95% de acerto
      10 // baixa dificuldade
    );

    expect(priority).toBeLessThan(20);
  });

  it("Deve calcular prioridade máxima para item crítico", () => {
    const priority = calculatePriority(
      10, // muito atrasado
      10, // quase sempre erra
      100 // máxima dificuldade
    );

    expect(priority).toBeGreaterThan(80);
  });
});
