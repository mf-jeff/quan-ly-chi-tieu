import { SignJWT, jwtVerify } from "jose";
import { hashSync, compareSync } from "bcryptjs";
import { NextRequest } from "next/server";

let _jwtSecret: Uint8Array | null = null;

export function getJwtSecret(): Uint8Array {
  if (!_jwtSecret) {
    const key = process.env.JWT_SECRET;
    if (!key) throw new Error("JWT_SECRET environment variable is required");
    _jwtSecret = new TextEncoder().encode(key);
  }
  return _jwtSecret;
}

export async function signToken(payload: { userId: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(getJwtSecret());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  return hashSync(password, 10);
}

export function comparePassword(password: string, hash: string) {
  return compareSync(password, hash);
}

export async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return verifyToken(token);
}
