import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { NextRequest } from "next/server";

const SESSION_COOKIE = "fitfest_session";
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.SESSION_SECRET || "dev-secret-change-me-in-production-32chars"
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  const jwt = await new SignJWT({ userId, token })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return { token, expiresAt };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(SESSION_COOKIE)?.value;
  if (jwt) {
    try {
      const { payload } = await jwtVerify(jwt, SECRET);
      if (payload.token) {
        await prisma.session.deleteMany({ where: { token: payload.token as string } });
      }
    } catch {}
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(SESSION_COOKIE)?.value;
  if (!jwt) return null;

  try {
    const { payload } = await jwtVerify(jwt, SECRET);
    const token = payload.token as string;
    const userId = payload.userId as string;

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            roles: { include: { role: true } },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      return null;
    }

    const roles = session.user.roles.map((ur) => ur.role.name);
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      roles,
      isSuperAdmin: roles.includes("SUPER_ADMIN"),
    };
  } catch {
    return null;
  }
}

export async function requireAuth(requiredRoles?: string[]) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((r) => user.roles.includes(r)) || user.isSuperAdmin;
    if (!hasRole) {
      throw new Error("FORBIDDEN");
    }
  }
  return user;
}

export async function getUserFromRequest(req: NextRequest) {
  const jwt = req.cookies.get(SESSION_COOKIE)?.value;
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, SECRET);
    const token = payload.token as string;
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: { include: { roles: { include: { role: true } } } },
      },
    });
    if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
    const roles = session.user.roles.map((ur) => ur.role.name);
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      roles,
      isSuperAdmin: roles.includes("SUPER_ADMIN"),
    };
  } catch {
    return null;
  }
}
