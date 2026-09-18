import { cookies } from "next/headers";
import { verifyToken, TokenPayload } from "./jwt";
import { memoryDb, ensureDbSynced } from "@/lib/db";

export const SESSION_COOKIE_NAME = "nexus_session";

export async function getSessionUser(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function getUserFromHeader(authHeader: string | null | undefined): TokenPayload | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export async function authenticateRequest(req: Request): Promise<TokenPayload | null> {
  await ensureDbSynced();
  let user: TokenPayload | null = null;

  // 1. Check Authorization header
  const authHeader = req.headers.get("Authorization");
  const headerUser = getUserFromHeader(authHeader);
  if (headerUser) {
    user = headerUser;
  } else {
    // 2. Check cookies
    user = await getSessionUser();
  }

  if (!user) return null;

  // 3. Verify status: if user is SUSPENDED or BANNED, reject
  for (const u of memoryDb.users.values()) {
    if (u.id === user.userId) {
      if (u.status === "SUSPENDED" || u.status === "BANNED") {
        return null;
      }
      break;
    }
  }

  return user;
}
