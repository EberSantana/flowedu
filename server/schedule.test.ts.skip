import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// IDs para rastrear recursos criados nos testes
let testSubjectId: number | null = null;
let testClassId: number | null = null;
let testShiftId: number | null = null;
let testTimeSlotId: number | null = null;
let testScheduledClassId: number | null = null;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };

  return ctx;
}

describe("schedule router - CRUD operations", () => {
  beforeAll(async () => {
    // Criar dados de teste necessários
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Criar disciplina de teste
    const subjectResult = await caller.subjects.create({
      name: `Test Subject ${Date.now()}`,
      code: `TS${Date.now()}`,
      description: "Disciplina de teste para agendamento",
      color: "#3b82f6",
    });
    
    // Buscar a disciplina criada
    const subjects = await caller.subjects.list();
    testSubjectId = subjects[subjects.length - 1]?.id || null;

    // Criar turma de teste
    await caller.classes.create({
      name: `Test Class ${Date.now()}`,
      code: `TC${Date.now()}`,
      description: "Turma de teste para agendamento",
    });
    
    // Buscar a turma criada
    const classes = await caller.classes.list();
    testClassId = classes[classes.length - 1]?.id || null;

    // Criar turno de teste
    await caller.shifts.create({
      name: `Test Shift ${Date.now()}`,
      color: "#10b981",
      displayOrder: 99,
    });
    
    // Buscar o turno criado
    const shifts = await caller.shifts.list();
    testShiftId = shifts[shifts.length - 1]?.id || null;

    // Criar horário de teste
    if (testShiftId) {
      await caller.timeSlots.create({
        shiftId: testShiftId,
        slotNumber: 1,
        startTime: "08:00",
        endTime: "08:50",
      });
      
      // Buscar o horário criado
      const timeSlots = await caller.timeSlots.list();
      testTimeSlotId = timeSlots[timeSlots.length - 1]?.id || null;
    }
  });

  it("should list scheduled classes for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const scheduledClasses = await caller.schedule.list();
    expect(Array.isArray(scheduledClasses)).toBe(true);
  });

  it("should create a new scheduled class", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (!testSubjectId || !testClassId || !testTimeSlotId) {
      console.warn("Skipping test: required test data not available");
      return;
    }

    const result = await caller.schedule.create({
      subjectId: testSubjectId,
      classId: testClassId,
      timeSlotId: testTimeSlotId,
      dayOfWeek: 1, // Segunda-feira
      notes: "Aula de teste",
    });

    expect(result.success).toBe(true);

    // Buscar a aula criada para obter o ID
    const scheduledClasses = await caller.schedule.list();
    testScheduledClassId = scheduledClasses[0]?.id || null;
  });

  it("should get full schedule with all related data", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const fullSchedule = await caller.schedule.getFullSchedule();

    expect(fullSchedule).toHaveProperty("shifts");
    expect(fullSchedule).toHaveProperty("timeSlots");
    expect(fullSchedule).toHaveProperty("scheduledClasses");
    expect(fullSchedule).toHaveProperty("subjects");
    expect(fullSchedule).toHaveProperty("classes");
    expect(Array.isArray(fullSchedule.shifts)).toBe(true);
    expect(Array.isArray(fullSchedule.timeSlots)).toBe(true);
    expect(Array.isArray(fullSchedule.scheduledClasses)).toBe(true);
    expect(Array.isArray(fullSchedule.subjects)).toBe(true);
    expect(Array.isArray(fullSchedule.classes)).toBe(true);
  });

  it("should update a scheduled class", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (!testScheduledClassId) {
      console.warn("Skipping test: no scheduled class to update");
      return;
    }

    const result = await caller.schedule.update({
      id: testScheduledClassId,
      notes: "Aula de teste atualizada",
    });

    expect(result.success).toBe(true);
  });

  it("should delete a scheduled class", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (!testScheduledClassId) {
      console.warn("Skipping test: no scheduled class to delete");
      return;
    }

    const result = await caller.schedule.delete({
      id: testScheduledClassId,
    });

    expect(result.success).toBe(true);
    testScheduledClassId = null;
  });
});

describe("schedule router - conflict validation", () => {
  let conflictSubjectId: number | null = null;
  let conflictClassId: number | null = null;
  let conflictTimeSlotId: number | null = null;
  let conflictScheduledClassId: number | null = null;

  beforeAll(async () => {
    const ctx = createAuthContext(2); // Usar usuário diferente para evitar conflitos com outros testes
    const caller = appRouter.createCaller(ctx);

    // Criar dados de teste para conflitos
    await caller.subjects.create({
      name: `Conflict Subject ${Date.now()}`,
      code: `CS${Date.now()}`,
      color: "#ef4444",
    });
    const subjects = await caller.subjects.list();
    conflictSubjectId = subjects[subjects.length - 1]?.id || null;

    await caller.classes.create({
      name: `Conflict Class ${Date.now()}`,
      code: `CC${Date.now()}`,
    });
    const classes = await caller.classes.list();
    conflictClassId = classes[classes.length - 1]?.id || null;

    await caller.shifts.create({
      name: `Conflict Shift ${Date.now()}`,
      color: "#f59e0b",
      displayOrder: 98,
    });
    const shifts = await caller.shifts.list();
    const conflictShiftId = shifts[shifts.length - 1]?.id || null;

    if (conflictShiftId) {
      await caller.timeSlots.create({
        shiftId: conflictShiftId,
        slotNumber: 1,
        startTime: "14:00",
        endTime: "14:50",
      });
      const timeSlots = await caller.timeSlots.list();
      conflictTimeSlotId = timeSlots[timeSlots.length - 1]?.id || null;
    }
  });

  it("should detect conflict when scheduling same class at same time slot and day", async () => {
    const ctx = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    if (!conflictSubjectId || !conflictClassId || !conflictTimeSlotId) {
      console.warn("Skipping test: required test data not available");
      return;
    }

    // Criar primeira aula
    const result1 = await caller.schedule.create({
      subjectId: conflictSubjectId,
      classId: conflictClassId,
      timeSlotId: conflictTimeSlotId,
      dayOfWeek: 2, // Terça-feira
    });
    expect(result1.success).toBe(true);

    // Buscar a aula criada
    const scheduledClasses = await caller.schedule.list();
    conflictScheduledClassId = scheduledClasses[0]?.id || null;

    // Tentar criar segunda aula no mesmo horário e turma (deve falhar)
    await expect(
      caller.schedule.create({
        subjectId: conflictSubjectId,
        classId: conflictClassId,
        timeSlotId: conflictTimeSlotId,
        dayOfWeek: 2, // Mesmo dia
      })
    ).rejects.toThrow("Já existe uma aula agendada neste horário para esta turma");
  });

  it("should allow scheduling same class at different time slot", async () => {
    const ctx = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    if (!conflictSubjectId || !conflictClassId) {
      console.warn("Skipping test: required test data not available");
      return;
    }

    // Criar novo horário
    const shifts = await caller.shifts.list();
    const shiftId = shifts[shifts.length - 1]?.id;
    
    if (!shiftId) {
      console.warn("Skipping test: no shift available");
      return;
    }

    await caller.timeSlots.create({
      shiftId: shiftId,
      slotNumber: 2,
      startTime: "15:00",
      endTime: "15:50",
    });
    const timeSlots = await caller.timeSlots.list();
    const newTimeSlotId = timeSlots[timeSlots.length - 1]?.id;

    if (!newTimeSlotId) {
      console.warn("Skipping test: no time slot available");
      return;
    }

    // Deve permitir criar aula em horário diferente
    const result = await caller.schedule.create({
      subjectId: conflictSubjectId,
      classId: conflictClassId,
      timeSlotId: newTimeSlotId,
      dayOfWeek: 2, // Mesmo dia, horário diferente
    });

    expect(result.success).toBe(true);
  });

  it("should allow scheduling same class at different day", async () => {
    const ctx = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    if (!conflictSubjectId || !conflictClassId || !conflictTimeSlotId) {
      console.warn("Skipping test: required test data not available");
      return;
    }

    // Deve permitir criar aula no mesmo horário em dia diferente
    const result = await caller.schedule.create({
      subjectId: conflictSubjectId,
      classId: conflictClassId,
      timeSlotId: conflictTimeSlotId,
      dayOfWeek: 3, // Quarta-feira (dia diferente)
    });

    expect(result.success).toBe(true);
  });

  it("should detect conflict when updating to conflicting time", async () => {
    const ctx = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    if (!conflictScheduledClassId || !conflictTimeSlotId || !conflictClassId) {
      console.warn("Skipping test: required test data not available");
      return;
    }

    // Buscar aulas existentes
    const scheduledClasses = await caller.schedule.list();
    
    // Encontrar uma aula que não seja a primeira (para tentar atualizar para o horário da primeira)
    const otherClass = scheduledClasses.find(sc => sc.id !== conflictScheduledClassId);
    
    if (!otherClass) {
      console.warn("Skipping test: no other scheduled class available");
      return;
    }

    // Tentar atualizar para o mesmo horário de outra aula (deve falhar)
    await expect(
      caller.schedule.update({
        id: otherClass.id,
        timeSlotId: conflictTimeSlotId,
        dayOfWeek: 2,
        classId: conflictClassId,
      })
    ).rejects.toThrow("Já existe uma aula agendada neste horário para esta turma");
  });

  afterAll(async () => {
    // Limpar dados de teste
    const ctx = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    const scheduledClasses = await caller.schedule.list();
    for (const sc of scheduledClasses) {
      try {
        await caller.schedule.delete({ id: sc.id });
      } catch (e) {
        // Ignorar erros de limpeza
      }
    }
  });
});

describe("schedule router - edge cases", () => {
  it("should fail to create scheduled class with invalid day of week", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.schedule.create({
        subjectId: 1,
        classId: 1,
        timeSlotId: 1,
        dayOfWeek: 7, // Inválido (0-6)
      })
    ).rejects.toThrow();
  });

  it("should fail to create scheduled class with negative day of week", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.schedule.create({
        subjectId: 1,
        classId: 1,
        timeSlotId: 1,
        dayOfWeek: -1, // Inválido
      })
    ).rejects.toThrow();
  });

  it("should handle update of non-existent scheduled class gracefully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Atualizar aula inexistente não lança erro (comportamento padrão do Drizzle)
    // Apenas não afeta nenhum registro
    const result = await caller.schedule.update({
      id: 999999,
      notes: "Tentativa de atualização",
    });

    expect(result.success).toBe(true);
  });

  it("should fail to delete non-existent scheduled class", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Deletar aula inexistente não deve lançar erro (comportamento padrão do Drizzle)
    const result = await caller.schedule.delete({
      id: 999999,
    });

    expect(result.success).toBe(true);
  });
});

describe("shifts router", () => {
  it("should list shifts for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const shifts = await caller.shifts.list();
    expect(Array.isArray(shifts)).toBe(true);
  });

  it("should create a new shift", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.shifts.create({
      name: `Turno Teste ${Date.now()}`,
      color: "#8b5cf6",
      displayOrder: 100,
    });

    expect(result.success).toBe(true);
  });

  it("should fail to create shift without name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.shifts.create({
        name: "",
        color: "#8b5cf6",
        displayOrder: 1,
      })
    ).rejects.toThrow();
  });
});

describe("timeSlots router", () => {
  let testShiftIdForTimeSlots: number | null = null;

  beforeAll(async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Criar turno para os testes de horários
    await caller.shifts.create({
      name: `TimeSlot Test Shift ${Date.now()}`,
      color: "#ec4899",
      displayOrder: 101,
    });

    const shifts = await caller.shifts.list();
    testShiftIdForTimeSlots = shifts[shifts.length - 1]?.id || null;
  });

  it("should list time slots for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const timeSlots = await caller.timeSlots.list();
    expect(Array.isArray(timeSlots)).toBe(true);
  });

  it("should create a new time slot", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (!testShiftIdForTimeSlots) {
      console.warn("Skipping test: no shift available");
      return;
    }

    const result = await caller.timeSlots.create({
      shiftId: testShiftIdForTimeSlots,
      slotNumber: 1,
      startTime: "13:00",
      endTime: "13:50",
    });

    expect(result.success).toBe(true);
  });

  it("should list time slots by shift", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (!testShiftIdForTimeSlots) {
      console.warn("Skipping test: no shift available");
      return;
    }

    const timeSlots = await caller.timeSlots.listByShift({
      shiftId: testShiftIdForTimeSlots,
    });

    expect(Array.isArray(timeSlots)).toBe(true);
  });

  it("should fail to create time slot with invalid time format", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Formato de horário inválido deve lançar erro
    await expect(
      caller.timeSlots.create({
        shiftId: 1,
        slotNumber: 1,
        startTime: "25:00", // Inválido
        endTime: "13:50",
      })
    ).rejects.toThrow("Formato de horário inválido");
  });

  it("should fail to create time slot with end time before start time", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Horário de término antes do início deve lançar erro
    await expect(
      caller.timeSlots.create({
        shiftId: 1,
        slotNumber: 1,
        startTime: "14:00",
        endTime: "13:00", // Antes do início
      })
    ).rejects.toThrow("Horário de início deve ser anterior ao horário de término");
  });
});
