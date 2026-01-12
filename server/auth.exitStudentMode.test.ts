import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { STUDENT_COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    active: true,
  };

  const ctx: TrpcContext = {
    user,
    studentSession: null,
    userType: 'teacher',
    req: {
      protocol: "https",
      hostname: "example.com",
      headers: {},
      get: (header: string) => {
        if (header === "host") return "example.com";
        return undefined;
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.exitStudentMode", () => {
  it("deve limpar apenas o cookie de aluno ao sair do modo aluno", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.exitStudentMode();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(STUDENT_COOKIE_NAME);
  });

  it("deve configurar maxAge negativo no cookie para expiração", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.auth.exitStudentMode();

    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });

  it("deve retornar sucesso mesmo sem sessão ativa", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    // Remover usuário para simular contexto não autenticado
    ctx.user = null;
    
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.exitStudentMode();

    expect(result.success).toBe(true);
    expect(clearedCookies).toHaveLength(1);
  });

  it("deve ser acessível como procedimento público", async () => {
    // Contexto sem autenticação
    const ctx: TrpcContext = {
      user: null,
      studentSession: null,
      userType: null,
      req: {
        protocol: "https",
        hostname: "example.com",
        headers: {},
        get: (header: string) => {
          if (header === "host") return "example.com";
          return undefined;
        },
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    
    // Não deve lançar erro de autenticação
    await expect(caller.auth.exitStudentMode()).resolves.toBeDefined();
  });
});
