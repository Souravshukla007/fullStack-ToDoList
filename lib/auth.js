import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "todo_session";

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-only-change-me";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function setSession(userId) {
  const token = await createSessionToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUserId() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  const userId = Number(payload?.userId);
  return Number.isFinite(userId) ? userId : null;
}

export async function requireUserId() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  return userId;
}
