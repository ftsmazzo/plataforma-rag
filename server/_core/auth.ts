// Simple JWT-based authentication system

import { SignJWT, jwtVerify } from "jose";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getUserByEmail, getUserById } from "../db";
import { ForbiddenError } from "./errors";

const COOKIE_NAME = "app_session_id";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export interface SessionPayload {
  userId: number;
  email: string;
  role: string;
}

function getSessionCookieOptions(req: Request) {
  const isSecure = req.protocol === "https" || process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-change-in-production");
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1y")
    .sign(secret);

  return token;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-change-in-production");
    const { payload } = await jwtVerify(token, secret);
    
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

export function parseCookies(cookieHeader?: string): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name && rest.length > 0) {
      cookies.set(name, rest.join("="));
    }
  });

  return cookies;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Debug logging
    if (!hash || typeof hash !== 'string') {
      console.error("[Auth] Invalid hash:", { hash, type: typeof hash });
      return false;
    }
    
    if (!password || typeof password !== 'string') {
      console.error("[Auth] Invalid password:", { password, type: typeof password });
      return false;
    }

    // Trim hash in case there are spaces
    const trimmedHash = hash.trim();
    
    console.log("[Auth] Verifying password:", {
      passwordLength: password.length,
      hashLength: hash.length,
      trimmedHashLength: trimmedHash.length,
      hashStart: hash.substring(0, 10),
      hashEnd: hash.substring(hash.length - 10),
    });

    const result = await bcrypt.compare(password, trimmedHash);
    console.log("[Auth] bcrypt.compare result:", result);
    
    return result;
  } catch (error) {
    console.error("[Auth] Error verifying password:", error);
    return false;
  }
}

export async function authenticateRequest(req: Request) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies.get(COOKIE_NAME);
  
  if (!sessionCookie) {
    throw ForbiddenError("No session cookie");
  }

  const session = await verifySessionToken(sessionCookie);
  
  if (!session) {
    throw ForbiddenError("Invalid session token");
  }

  const user = await getUserById(session.userId);
  
  if (!user) {
    throw ForbiddenError("User not found");
  }

  return user;
}

export function setSessionCookie(res: Response, token: string, req: Request) {
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

export function clearSessionCookie(res: Response, req: Request) {
  const cookieOptions = getSessionCookieOptions(req);
  res.clearCookie(COOKIE_NAME, cookieOptions);
}
