import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import { COOKIE_NAME } from "../../shared/const";

type StudentSession = {
  userType: 'student';
  studentId: number;
  registrationNumber: string;
  fullName: string;
  professorId: number;
};

type TeacherSession = User & {
  userType: 'teacher';
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  studentSession: StudentSession | null;
  userType: 'teacher' | 'student' | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let studentSession: StudentSession | null = null;
  let userType: 'teacher' | 'student' | null = null;

  // Tentar extrair cookie de sessão
  const cookies = opts.req.headers.cookie;
  if (cookies) {
    const cookieMatch = cookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (cookieMatch) {
      const token = cookieMatch[1];
      
      try {
        const decoded = jwt.verify(token, ENV.cookieSecret) as any;
        
        // Verificar se é sessão de aluno
        if (decoded.userType === 'student') {
          studentSession = {
            userType: 'student',
            studentId: decoded.studentId,
            registrationNumber: decoded.registrationNumber,
            fullName: decoded.fullName,
            professorId: decoded.professorId,
          };
          userType = 'student';
        }
      } catch (error) {
        // Token inválido ou expirado, tentar autenticação de professor
      }
    }
  }

  // Se não é aluno, tentar autenticação de professor
  if (!studentSession) {
    try {
      user = await sdk.authenticateRequest(opts.req);
      if (user) {
        userType = 'teacher';
      }
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    studentSession,
    userType,
  };
}
