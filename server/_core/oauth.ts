import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Rota OAuth desabilitada - sistema usa apenas login com email/senha
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    res.status(403).json({ 
      error: "OAuth login desabilitado",
      message: "Este sistema usa apenas login com email e senha. Por favor, acesse a p\u00e1gina de login." 
    });
  });
}
