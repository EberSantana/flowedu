import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

// Lista de openIds autorizados a acessar o portal do professor
// Inclui o dono do sistema + lista adicional via env ALLOWED_TEACHER_OPENIDS
function getAllowedOpenIds(): Set<string> {
  const allowed = new Set<string>();
  if (ENV.ownerOpenId) allowed.add(ENV.ownerOpenId);
  const extra = process.env.ALLOWED_TEACHER_OPENIDS ?? "";
  extra.split(",").map(s => s.trim()).filter(Boolean).forEach(id => allowed.add(id));
  return allowed;
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    if (!code) {
      return res.status(400).send("Missing authorization code");
    }

    try {
      // Exchange code for access token
      const tokenResponse = await sdk.exchangeCodeForToken(code, "");

      // Get user info from Manus OAuth
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      console.log('[OAuth] User info received:', userInfo);

      // Verificar se o usuário está autorizado a acessar o portal do professor
      const allowedOpenIds = getAllowedOpenIds();
      if (allowedOpenIds.size > 0 && !allowedOpenIds.has(userInfo.openId)) {
        console.warn('[OAuth] Acesso negado para openId não autorizado:', userInfo.openId);
        return res.redirect('/?error=acesso_nao_autorizado');
      }

      // Upsert user in local database
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name,
        email: userInfo.email ?? null,
        loginMethod: "oauth",
      });

      console.log('[OAuth] User upserted:', userInfo.openId);

      // Create session JWT
      const jwt = await sdk.createSessionToken(userInfo.openId, { name: userInfo.name });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, jwt, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // Redirect to home
      res.redirect("/");
    } catch (error) {
      console.error("[OAuth] Callback error:", error);
      res.status(500).send("OAuth authentication failed");
    }
  });
}
