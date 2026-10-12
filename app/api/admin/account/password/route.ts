import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const admin = await getAdminUser();

  if (!admin) {
    return jsonError("Admin login required", 401);
  }

  const body = await request.json().catch(() => null);
  const currentPassword = String(body?.currentPassword ?? "");
  const nextPassword = String(body?.nextPassword ?? "");

  if (!currentPassword || !nextPassword) {
    return jsonError("Current password and new password are required");
  }

  if (nextPassword.length < 10) {
    return jsonError("New password must be at least 10 characters");
  }

  const adminUser = await prisma.adminUser.findUnique({ where: { id: admin.id } });

  if (!adminUser || !verifyPassword(currentPassword, adminUser.passwordHash)) {
    return jsonError("Current password is incorrect", 401);
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: hashPassword(nextPassword) },
  });

  return NextResponse.json({ ok: true });
}
