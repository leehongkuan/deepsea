import crypto from "crypto";
import { cookies } from "next/headers";
import { hashToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_SESSION_COOKIE = "deepsea_admin_session";
const ADMIN_SESSION_DAYS = 1;

export type AdminAuthUser = {
  id: string;
  username: string;
};

export async function createAdminSession(adminUserId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      adminUserId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (token) {
    await prisma.adminSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminUser(): Promise<AdminAuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { adminUser: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.adminSession.delete({ where: { id: session.id } });
    }
    return null;
  }

  return {
    id: session.adminUser.id,
    username: session.adminUser.username,
  };
}

export function generateInitialPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789_*-$";
  let password = "";

  for (let index = 0; index < 16; index += 1) {
    password += alphabet[crypto.randomInt(alphabet.length)];
  }

  return password;
}
