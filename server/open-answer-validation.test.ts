import { describe, it, expect } from "vitest";
import { analyzeOpenAnswer } from "./open-answer-validation";

describe("Open Answer Validation System", () => {
  it("should analyze a correct answer with high confidence", async () => {
    const result = await analyzeOpenAnswer({
      question: "O que é fotossíntese?",
      studentAnswer:
        "Fotossíntese é o processo pelo qual as plantas convertem luz solar em energia química, produzindo glicose e liberando oxigênio.",
      correctAnswer:
        "Fotossíntese é o processo realizado por plantas, algas e algumas bactérias que convertem energia luminosa em energia química, produzindo glicose a partir de CO2 e água, liberando oxigênio como subproduto.",
    });

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.confidence).toBeGreaterThanOrEqual(60);
    expect(result.feedback).toBeTruthy();
    expect(result.strengths).toBeInstanceOf(Array);
    expect(result.weaknesses).toBeInstanceOf(Array);
    expect(result.reasoning).toBeTruthy();
  }, 30000);

  it("should analyze a partially correct answer", async () => {
    const result = await analyzeOpenAnswer({
      question: "Explique o ciclo da água.",
      studentAnswer:
        "O ciclo da água é quando a água evapora e depois chove.",
      correctAnswer:
        "O ciclo da água envolve evaporação, condensação, precipitação e infiltração. A água evapora dos oceanos e rios, forma nuvens por condensação, retorna à superfície como precipitação (chuva, neve) e infiltra no solo ou retorna aos corpos d'água.",
    });

    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.score).toBeLessThanOrEqual(70);
    expect(result.feedback).toBeTruthy();
    expect(result.weaknesses.length).toBeGreaterThan(0);
  }, 30000);

  it("should handle empty answer", async () => {
    const result = await analyzeOpenAnswer({
      question: "O que é democracia?",
      studentAnswer: "",
      correctAnswer:
        "Democracia é um sistema de governo onde o poder emana do povo, que participa diretamente ou através de representantes eleitos.",
    });

    expect(result.score).toBe(0);
    expect(result.confidence).toBe(100);
    expect(result.needsReview).toBe(false);
    expect(result.feedback).toContain("vazia");
  });

  it("should give low score for vague answer", async () => {
    const result = await analyzeOpenAnswer({
      question: "Discuta as implicações éticas da inteligência artificial.",
      studentAnswer:
        "A IA pode ser boa ou ruim dependendo de como é usada.",
      correctAnswer:
        "As implicações éticas da IA incluem questões de privacidade, viés algorítmico, substituição de empregos, responsabilidade por decisões automatizadas, e o impacto na autonomia humana.",
    });

    // Resposta muito vaga deve ter nota baixa
    expect(result.score).toBeLessThanOrEqual(50);
    expect(result.feedback).toBeTruthy();
    expect(result.weaknesses.length).toBeGreaterThan(0);
  }, 30000);

  it("should recognize correct answer with different wording", async () => {
    const result = await analyzeOpenAnswer({
      question: "Qual é a capital do Brasil?",
      studentAnswer: "A capital do Brasil é Brasília.",
      correctAnswer: "Brasília",
    });

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.confidence).toBeGreaterThanOrEqual(80);
  }, 30000);

  it("should provide constructive feedback", async () => {
    const result = await analyzeOpenAnswer({
      question: "Explique a Lei da Gravitação Universal de Newton.",
      studentAnswer:
        "É a lei que diz que os objetos caem no chão por causa da gravidade.",
      correctAnswer:
        "A Lei da Gravitação Universal afirma que todos os corpos com massa exercem uma força de atração mútua, proporcional ao produto de suas massas e inversamente proporcional ao quadrado da distância entre eles.",
    });

    expect(result.feedback).toBeTruthy();
    expect(result.reasoning).toBeTruthy();
    expect(result.score).toBeLessThan(70);
  }, 30000);

  it("should handle answers with context", async () => {
    const result = await analyzeOpenAnswer({
      question: "O que caracteriza o Romantismo na literatura?",
      studentAnswer:
        "O Romantismo valoriza a emoção, a natureza e o nacionalismo.",
      correctAnswer:
        "O Romantismo é caracterizado pela valorização da emoção sobre a razão, idealização da natureza, nacionalismo, subjetivismo e individualismo.",
      context:
        "Movimento literário do século XIX que se opôs ao Classicismo.",
    });

    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.feedback).toBeTruthy();
  }, 30000);

  it("should identify strengths and weaknesses", async () => {
    const result = await analyzeOpenAnswer({
      question: "Quais são as principais características do Renascimento?",
      studentAnswer:
        "O Renascimento foi um período de grande desenvolvimento artístico. Leonardo da Vinci foi um artista importante dessa época.",
      correctAnswer:
        "O Renascimento foi caracterizado pelo humanismo, valorização da razão e ciência, retorno aos valores clássicos greco-romanos, antropocentrismo, e grandes avanços nas artes, ciências e filosofia.",
    });

    expect(result.strengths).toBeInstanceOf(Array);
    expect(result.weaknesses).toBeInstanceOf(Array);
    // Resposta menciona arte mas falta outros aspectos importantes
    expect(result.weaknesses.length).toBeGreaterThan(0);
  }, 30000);
});
