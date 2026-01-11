import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

describe("Calendar Annual Update", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let userId: number;

  beforeAll(async () => {
    // Criar usuário de teste
    const openId = `test-calendar-update-${Date.now()}`;
    const email = `calendar-update-${Date.now()}@test.com`;
    
    await db.upsertUser({
      openId,
      name: "Test User",
      email,
      role: "user",
    });
    
    const user = await db.getUserByOpenId(openId);
    if (!user) throw new Error("Failed to create test user");
    
    userId = user.id;

    const ctx: TrpcContext = {
      user,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    caller = appRouter.createCaller(ctx);
  });

  afterAll(async () => {
    // Limpar usuário de teste e seus dados
    try {
      await db.permanentDeleteUser(userId);
    } catch (error) {
      console.warn('[Test Cleanup] Failed to delete test user:', error);
    }
  });

  it("should delete only institutional events from specified year", async () => {
    // Criar eventos de 2024
    await db.createCalendarEvent({
      userId,
      title: "Feriado Teste",
      description: "Feriado de teste",
      eventDate: "2024-01-01",
      eventType: "holiday",
      isRecurring: 0,
    });

    await db.createCalendarEvent({
      userId,
      title: "Data Comemorativa Teste",
      description: "Data comemorativa de teste",
      eventDate: "2024-02-01",
      eventType: "commemorative",
      isRecurring: 0,
    });

    await db.createCalendarEvent({
      userId,
      title: "Evento Escolar Teste",
      description: "Evento escolar de teste",
      eventDate: "2024-03-01",
      eventType: "school_event",
      isRecurring: 0,
    });

    await db.createCalendarEvent({
      userId,
      title: "Observação Pessoal Teste",
      description: "Observação pessoal de teste",
      eventDate: "2024-04-01",
      eventType: "personal",
      isRecurring: 0,
    });

    // Deletar eventos institucionais de 2024
    const result = await caller.calendar.deleteEventsByYearAndType({
      year: 2024,
      eventTypes: ["holiday", "commemorative", "school_event"],
    });

    expect(result.deletedCount).toBeGreaterThan(0);

    // Verificar que observação pessoal foi preservada
    const events2024 = await caller.calendar.listByYear({ year: 2024 });
    const personalEvents = events2024.filter((e) => e.eventType === "personal");
    expect(personalEvents.length).toBeGreaterThan(0);
    expect(personalEvents.some((e) => e.title === "Observação Pessoal Teste")).toBe(true);

    // Verificar que eventos institucionais foram removidos
    const institutionalEvents = events2024.filter(
      (e) => e.eventType === "holiday" || e.eventType === "commemorative" || e.eventType === "school_event"
    );
    expect(institutionalEvents.some((e) => e.title === "Feriado Teste")).toBe(false);
    expect(institutionalEvents.some((e) => e.title === "Data Comemorativa Teste")).toBe(false);
    expect(institutionalEvents.some((e) => e.title === "Evento Escolar Teste")).toBe(false);
  });

  it("should update calendar annually (delete old + add new)", async () => {
    // Criar eventos de 2024
    await db.createCalendarEvent({
      userId,
      title: "Feriado Antigo",
      description: "Feriado de 2024",
      eventDate: "2024-05-01",
      eventType: "holiday",
      isRecurring: 0,
    });

    await db.createCalendarEvent({
      userId,
      title: "Observação Pessoal 2024",
      description: "Minha observação",
      eventDate: "2024-06-01",
      eventType: "personal",
      isRecurring: 0,
    });

    // Atualizar calendário de 2024 com novos eventos
    const newEvents = [
      {
        title: "Novo Feriado",
        description: "Novo feriado de 2024",
        eventDate: "2024-07-01",
        eventType: "holiday" as const,
      },
      {
        title: "Nova Data Comemorativa",
        description: "Nova data comemorativa de 2024",
        eventDate: "2024-08-01",
        eventType: "commemorative" as const,
      },
    ];

    const result = await caller.calendar.updateCalendarAnnually({
      year: 2024,
      newEvents,
    });

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBeGreaterThan(0);
    expect(result.addedCount).toBe(2);

    // Verificar que novos eventos foram adicionados
    const events2024 = await caller.calendar.listByYear({ year: 2024 });
    expect(events2024.some((e) => e.title === "Novo Feriado")).toBe(true);
    expect(events2024.some((e) => e.title === "Nova Data Comemorativa")).toBe(true);

    // Verificar que observação pessoal foi preservada
    expect(events2024.some((e) => e.title === "Observação Pessoal 2024")).toBe(true);

    // Verificar que evento antigo foi removido
    expect(events2024.some((e) => e.title === "Feriado Antigo")).toBe(false);
  });

  it("should not delete events from other years", async () => {
    // Criar eventos de 2023 e 2024
    await db.createCalendarEvent({
      userId,
      title: "Feriado 2023",
      description: "Feriado de 2023",
      eventDate: "2023-01-01",
      eventType: "holiday",
      isRecurring: 0,
    });

    await db.createCalendarEvent({
      userId,
      title: "Feriado 2024 Para Deletar",
      description: "Feriado de 2024",
      eventDate: "2024-09-01",
      eventType: "holiday",
      isRecurring: 0,
    });

    // Deletar apenas eventos de 2024
    await caller.calendar.deleteEventsByYearAndType({
      year: 2024,
      eventTypes: ["holiday", "commemorative", "school_event"],
    });

    // Verificar que evento de 2023 foi preservado
    const events2023 = await caller.calendar.listByYear({ year: 2023 });
    expect(events2023.some((e) => e.title === "Feriado 2023")).toBe(true);

    // Verificar que evento de 2024 foi removido
    const events2024 = await caller.calendar.listByYear({ year: 2024 });
    expect(events2024.some((e) => e.title === "Feriado 2024 Para Deletar")).toBe(false);
  });

  it("should preserve all personal events when updating calendar", async () => {
    // Criar múltiplas observações pessoais em 2024
    const personalEvents = [
      { title: "Nota Pessoal 1", date: "2024-10-01" },
      { title: "Nota Pessoal 2", date: "2024-10-15" },
      { title: "Nota Pessoal 3", date: "2024-11-01" },
    ];

    for (const event of personalEvents) {
      await db.createCalendarEvent({
        userId,
        title: event.title,
        description: "Observação pessoal",
        eventDate: event.date,
        eventType: "personal",
        isRecurring: 0,
      });
    }

    // Criar evento institucional
    await db.createCalendarEvent({
      userId,
      title: "Evento Institucional Para Deletar",
      description: "Evento escolar",
      eventDate: "2024-10-10",
      eventType: "school_event",
      isRecurring: 0,
    });

    // Atualizar calendário
    await caller.calendar.updateCalendarAnnually({
      year: 2024,
      newEvents: [
        {
          title: "Novo Evento Escolar",
          description: "Novo evento",
          eventDate: "2024-12-01",
          eventType: "school_event",
        },
      ],
    });

    // Verificar que todas as observações pessoais foram preservadas
    const events2024 = await caller.calendar.listByYear({ year: 2024 });
    const personalEventsAfter = events2024.filter((e) => e.eventType === "personal");

    expect(personalEventsAfter.length).toBeGreaterThanOrEqual(3);
    expect(personalEventsAfter.some((e) => e.title === "Nota Pessoal 1")).toBe(true);
    expect(personalEventsAfter.some((e) => e.title === "Nota Pessoal 2")).toBe(true);
    expect(personalEventsAfter.some((e) => e.title === "Nota Pessoal 3")).toBe(true);

    // Verificar que evento institucional foi removido
    expect(events2024.some((e) => e.title === "Evento Institucional Para Deletar")).toBe(false);

    // Verificar que novo evento foi adicionado
    expect(events2024.some((e) => e.title === "Novo Evento Escolar")).toBe(true);
  });
});
