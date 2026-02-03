import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { authenticateRequest as authenticateStandalone } from "./auth-standalone";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import { COOKIE_NAME, STUDENT_COOKIE_NAME } from "../../shared/const";

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

// Flag para usar autenticação standalone (VPS) ou OAuth Manus
// SEMPRE usar standalone auth quando o login é por email/senha
const USE_STANDALONE_AUTH = true;

// Auto-login em desenvolvimento (pré-visualização Manus)
// DESABILITADO: para permitir login manual de professor e aluno
const AUTO_LOGIN_DEV = false; // process.env.NODE_ENV === 'development';

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let studentSession: StudentSession | null = null;
  let userType: 'teacher' | 'student' | null = null;

  // Tentar extrair cookie de sessão de ALUNO primeiro (cookie separado)
  const cookies = opts.req.headers.cookie;
  if (cookies) {
    // Priorizar cookie de aluno
    const studentCookieMatch = cookies.match(new RegExp(`${STUDENT_COOKIE_NAME}=([^;]+)`));
    if (studentCookieMatch) {
      const token = studentCookieMatch[1];
      
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
        // Token inválido ou expirado
      }
    }
  }

  // Se não é aluno, tentar autenticação de professor
  if (!studentSession) {
    try {
      // Usar autenticação standalone se configurado ou se OAuth não está disponível
      if (USE_STANDALONE_AUTH) {
        user = await authenticateStandalone(opts.req);
      } else {
        user = await sdk.authenticateRequest(opts.req);
      }
      
      if (user) {
        userType = 'teacher';
      }
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
    
    // Auto-login em desenvolvimento: criar usuário demo se não autenticado
    if (AUTO_LOGIN_DEV && !user) {
      try {
        // Importar dinamicamente para evitar dependência circular
        const dbModule = await import('../db');
        const database = await dbModule.getDb();
        
        if (database) {
          const schemaModule = await import('../../drizzle/schema');
          const ormModule = await import('drizzle-orm');
          
          // Buscar ou criar usuário demo
          const demoEmail = 'demo@flowedu.app';
          const existingUsers = await database.select().from(schemaModule.users).where(ormModule.eq(schemaModule.users.email, demoEmail)).limit(1);
          let demoUser = existingUsers[0];
          
          if (!demoUser) {
            // Criar usuário demo se não existir
            const bcrypt = await import('bcryptjs');
            const passwordHash = await bcrypt.default.hash('demo123', 10);
            
            await database.insert(schemaModule.users).values({
              openId: `demo-${Date.now()}`,
              name: 'Professor Demo',
              email: demoEmail,
              passwordHash,
              role: 'admin',
              active: true,
              createdAt: new Date(),
              lastSignedIn: new Date(),
            });
            
            // Buscar o usuário recém-criado
            const newlyCreated = await database.select().from(schemaModule.users).where(ormModule.eq(schemaModule.users.email, demoEmail)).limit(1);
            demoUser = newlyCreated[0];
          }
          
          if (demoUser) {
            user = demoUser;
            userType = 'teacher';
          }
        }
      } catch (error) {
        // Falha no auto-login não deve quebrar a aplicação
        console.error('[Auto-login] Erro ao criar usuário demo:', error);
      }
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
