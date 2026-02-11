/**
 * Módulo de Autenticação Standalone para VPS
 * 
 * Este módulo fornece funções de autenticação que funcionam de forma independente,
 * sem depender do OAuth Manus. Ideal para deploy em VPS própria.
 */

import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { COOKIE_NAME } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import * as db from "../db";
import type { User } from "../../drizzle/schema";

// Configuração
const JWT_SECRET = process.env.JWT_SECRET || process.env.COOKIE_SECRET || "your-super-secret-key-change-in-production";
const JWT_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export type SessionPayload = {
  userId: number;
  openId: string;
  email: string;
  name: string;
  role: string;
};

/**
 * Gera a chave secreta para JWT
 */
function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Cria um token de sessão JWT para um usuário
 */
export async function createSessionToken(
  user: { id: number; openId: string; email: string | null; name: string | null; role: string },
  options: { expiresInMs?: number } = {}
): Promise<string> {
  const issuedAt = Date.now();
  const expiresInMs = options.expiresInMs ?? JWT_EXPIRES_IN_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
  const secretKey = getSecretKey();

  return new SignJWT({
    userId: user.id,
    openId: user.openId,
    email: user.email || "",
    name: user.name || "",
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

/**
 * Verifica e decodifica um token de sessão JWT
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    const { userId, openId, email, name, role } = payload as Record<string, unknown>;

    // userId pode vir como number ou string do JWT, precisamos converter
    const parsedUserId = typeof userId === 'number' ? userId : (typeof userId === 'string' ? parseInt(userId, 10) : NaN);
    
    if (isNaN(parsedUserId) || typeof openId !== "string") {
      console.warn("[Auth] Session payload missing required fields. userId:", typeof userId, userId, "openId:", typeof openId, openId);
      return null;
    }

    return {
      userId: parsedUserId,
      openId: openId as string,
      email: (email as string) || "",
      name: (name as string) || "",
      role: (role as string) || "user",
    };
  } catch (error) {
    console.warn("[Auth] Session verification failed", String(error));
    return null;
  }
}

/**
 * Extrai cookies de uma requisição
 */
function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  if (!cookieHeader) {
    return new Map<string, string>();
  }
  const parsed = parseCookieHeader(cookieHeader);
  return new Map(Object.entries(parsed));
}

/**
 * Autentica uma requisição e retorna o usuário
 */
export async function authenticateRequest(req: Request): Promise<User> {
  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies.get(COOKIE_NAME);
  
  const session = await verifySessionToken(sessionCookie);

  if (!session) {
    throw ForbiddenError("Sessão inválida ou expirada. Faça login novamente.");
  }

  // Buscar usuário no banco
  const user = await db.getUserByOpenId(session.openId);

  if (!user) {
    throw ForbiddenError("Usuário não encontrado. Faça login novamente.");
  }

  // Verificar se usuário está ativo
  if (!user.active) {
    throw ForbiddenError("Conta desativada. Entre em contato com o administrador.");
  }

  // Atualizar último acesso
  await db.updateUserLastSignIn(user.id, new Date());

  return user;
}

/**
 * Gera um openId único para novos usuários (sem OAuth)
 */
export function generateOpenId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `local_${timestamp}_${random}`;
}

/**
 * Gera um token de recuperação de senha
 */
export function generatePasswordResetToken(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  const extra = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}-${extra}`;
}
