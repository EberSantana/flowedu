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
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    if (!code) {
      return res.status(400).send("Missing authorization code");
    }

    try {
      // Exchange code for JWT
      const jwt = await sdk.exchangeCodeForJwt(code);
      
      // Get user info from Manus OAuth
      const userInfo = await sdk.getUserInfoWithJwt(jwt);
      
      console.log('[OAuth] User info received:', userInfo);

      // Upsert user in local database
      const user = await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name,
        email: userInfo.email,
        loginMethod: "oauth",
      });

      console.log('[OAuth] User upserted:', user.id, user.email);

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
