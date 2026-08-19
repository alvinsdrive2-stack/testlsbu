import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "gapensi_admin";
const PARTICIPANT_COOKIE = "gapensi_participant";

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET);
}

export async function createAdminSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(secret());

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function verifyAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function createParticipantSession(participantToken: string) {
  const token = await new SignJWT({ role: "participant", token: participantToken })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret());

  const store = await cookies();
  store.set(PARTICIPANT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getParticipantToken(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(PARTICIPANT_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "participant" ? (payload.token as string) : null;
  } catch {
    return null;
  }
}

export async function destroyParticipantSession() {
  const store = await cookies();
  store.delete(PARTICIPANT_COOKIE);
}
