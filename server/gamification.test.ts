import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { students } from "../drizzle/schema";

describe("Sistema de Gamificação", () => {
  let testStudentId: number;

  beforeAll(async () => {
    // Criar um aluno de teste
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const result = await database
      .insert(students)
      .values({
        userId: 1,
        registrationNumber: "TEST-GAMIFICATION-001",
        fullName: "Aluno Teste Gamificação",
      });

    testStudentId = Number(result.insertId);
  });

  describe("Pontuação e Faixas", () => {
    it("deve criar pontuação inicial com faixa branca", async () => {
      const points = await db.getOrCreateStudentPoints(testStudentId);

      expect(points).not.toBeNull();
      expect(points?.totalPoints).toBe(0);
      expect(points?.currentBelt).toBe("white");
      expect(points?.streakDays).toBe(0);
    });

    it("deve adicionar pontos e manter faixa branca (0-200 pts)", async () => {
      const result = await db.addPointsToStudent(
        testStudentId,
        50,
        "Exercício teste",
        "exercise_objective"
      );

      expect(result).not.toBeNull();
      expect(result?.totalPoints).toBe(50);
      expect(result?.currentBelt).toBe("white");
      expect(result?.beltUpgrade).toBe(false);
    });

    it("deve subir para faixa amarela ao atingir 200 pontos", async () => {
      const result = await db.addPointsToStudent(
        testStudentId,
        150,
        "Mais pontos",
        "exercise_objective"
      );

      expect(result).not.toBeNull();
      expect(result?.totalPoints).toBe(200);
      expect(result?.currentBelt).toBe("yellow");
      expect(result?.beltUpgrade).toBe(true);
      expect(result?.oldBelt).toBe("white");
      expect(result?.newBelt).toBe("yellow");
    });

    it("deve calcular corretamente a faixa baseado em pontos", () => {
      expect(db.calculateBelt(0)).toBe("white");
      expect(db.calculateBelt(200)).toBe("yellow");
      expect(db.calculateBelt(400)).toBe("orange");
      expect(db.calculateBelt(600)).toBe("green");
      expect(db.calculateBelt(900)).toBe("blue");
      expect(db.calculateBelt(1200)).toBe("purple");
      expect(db.calculateBelt(1600)).toBe("brown");
      expect(db.calculateBelt(2000)).toBe("black");
      expect(db.calculateBelt(5000)).toBe("black");
    });
  });

  describe("Histórico de Pontos", () => {
    it("deve registrar histórico ao adicionar pontos", async () => {
      await db.addPointsToStudent(
        testStudentId,
        10,
        "Teste de histórico",
        "exercise_objective"
      );

      const history = await db.getStudentPointsHistory(testStudentId, 5);

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].points).toBe(10);
      expect(history[0].reason).toBe("Teste de histórico");
      expect(history[0].activityType).toBe("exercise_objective");
    });
  });

  describe("Streak (Sequência de Dias)", () => {
    it("deve iniciar streak em 1 dia na primeira atividade", async () => {
      const result = await db.updateStudentStreak(testStudentId);

      expect(result).not.toBeNull();
      expect(result?.streakDays).toBe(1);
    });

    it("deve manter streak se atividade no mesmo dia", async () => {
      const result = await db.updateStudentStreak(testStudentId);

      expect(result).not.toBeNull();
      expect(result?.streakDays).toBe(1); // Não aumenta no mesmo dia
    });
  });

  describe("Badges", () => {
    it("deve listar todos os badges disponíveis", async () => {
      const badges = await db.getAllBadges();

      expect(badges.length).toBeGreaterThan(0);
      expect(badges.some((b) => b.code === "fire_streak_7")).toBe(true);
      expect(badges.some((b) => b.code === "perfectionist_10")).toBe(true);
    });

    it("deve conceder badge ao aluno", async () => {
      const badge = await db.awardBadgeToStudent(testStudentId, "fire_streak_7");

      expect(badge).not.toBeNull();
      expect(badge?.code).toBe("fire_streak_7");
    });

    it("não deve conceder o mesmo badge duas vezes", async () => {
      const badge = await db.awardBadgeToStudent(testStudentId, "fire_streak_7");

      expect(badge).toBeNull(); // Já tem o badge
    });

    it("deve listar badges conquistados pelo aluno", async () => {
      const badges = await db.getStudentBadges(testStudentId);

      expect(badges.length).toBe(1);
      expect(badges[0].badge.code).toBe("fire_streak_7");
    });
  });

  describe("Notificações de Gamificação", () => {
    it("deve criar notificação ao subir de faixa", async () => {
      // Adicionar pontos suficientes para subir de faixa
      await db.addPointsToStudent(
        testStudentId,
        200,
        "Teste de notificação",
        "exam_completed"
      );

      const notifications = await db.getGamificationNotifications(testStudentId);

      expect(notifications.length).toBeGreaterThan(0);
      const beltNotification = notifications.find((n) => n.type === "belt_upgrade");
      expect(beltNotification).toBeDefined();
    });

    it("deve marcar notificação como lida", async () => {
      const notifications = await db.getGamificationNotifications(testStudentId);
      const firstNotification = notifications[0];

      const success = await db.markGamificationNotificationAsRead(firstNotification.id);

      expect(success).toBe(true);

      const updated = await db.getGamificationNotifications(testStudentId);
      const readNotification = updated.find((n) => n.id === firstNotification.id);
      expect(readNotification?.isRead).toBe(true);
    });
  });

  describe("Ranking", () => {
    it("deve retornar ranking da turma", async () => {
      const ranking = await db.getClassRanking(10);

      expect(ranking.length).toBeGreaterThan(0);
      expect(ranking[0].studentId).toBe(testStudentId);
      expect(ranking[0].totalPoints).toBeGreaterThan(0);
    });
  });
});
