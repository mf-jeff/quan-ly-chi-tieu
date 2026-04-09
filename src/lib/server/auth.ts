import { SignJWT, jwtVerify } from "jose";
import { hashSync, compareSync } from "bcryptjs";
import { NextRequest } from "next/server";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-dev"
);

export async function signToken(payload: { userId: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
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
