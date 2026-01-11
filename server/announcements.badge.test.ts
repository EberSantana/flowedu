import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Badge de Avisos Não Lidos - Verificação da Query", () => {
  it("deve executar a query getUnreadAnnouncementsCount sem erros", async () => {
    // Testar com ID de aluno fictício - deve retornar 0 ou número válido
    const count = await db.getUnreadAnnouncementsCount(999999);
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("deve retornar número inteiro não negativo", async () => {
    const count = await db.getUnreadAnnouncementsCount(1);
    expect(Number.isInteger(count)).toBe(true);
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
