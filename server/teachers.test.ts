import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/trpc";

describe("Teachers and Professional Bands", () => {
  const mockUser = {
    id: 1,
    openId: "test-open-id",
    name: "Test Teacher",
    email: "test@example.com",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const createMockContext = (): Context => ({
    user: mockUser,
    req: {} as any,
    res: {} as any,
    clearSession: () => {},
  });

  it("should list professional bands", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const bands = await caller.professionalBands.list();
    expect(Array.isArray(bands)).toBe(true);
  });

  it("should get current teacher", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const teacher = await caller.teachers.getCurrent();
    // Teacher may or may not exist, just checking it doesn't throw
    expect(teacher === undefined || typeof teacher === "object").toBe(true);
  });

  it("should list subjects", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const subjects = await caller.subjects.list();
    expect(Array.isArray(subjects)).toBe(true);
  });

  it("should list class groups", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const classes = await caller.classGroups.list();
    expect(Array.isArray(classes)).toBe(true);
  });
});
