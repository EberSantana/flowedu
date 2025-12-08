import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
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
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("classes router", () => {
  it("should list classes for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const classes = await caller.classes.list();
    expect(Array.isArray(classes)).toBe(true);
  });

  it("should create a new class", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const uniqueCode = `1A${Date.now()}`;
    const result = await caller.classes.create({
      name: "1º Ano A",
      code: uniqueCode,
      description: "Turma do primeiro ano",
    });

    expect(result.success).toBe(true);
  });

  it("should fail to create class without name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.classes.create({
        name: "",
        code: `1B${Date.now()}`,
      })
    ).rejects.toThrow();
  });
});
