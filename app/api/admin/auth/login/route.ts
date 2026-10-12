import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return jsonError("Invalid JSON");
  }

  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");

  if (!username || !password) {
    return jsonError("Username and password are required");
  }

  const admin = await prisma.adminUser.findUnique({ where: { username } });

  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return jsonError("Username or password is incorrect", 401);
  }

  await createAdminSession(admin.id);

  return NextResponse.json({
    admin: {
      id: admin.id,
      username: admin.username,
    },
  });
}
