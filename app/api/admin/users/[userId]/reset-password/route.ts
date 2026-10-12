import { NextRequest, NextResponse } from "next/server";
import { generateInitialPassword, getAdminUser } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function POST(_request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const admin = await getAdminUser();

  if (!admin) {
    return jsonError("Admin login required", 401);
  }

  const { userId } = await context.params;
  const initialPassword = generateInitialPassword();

  const user = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashPassword(initialPassword) },
    select: {
      id: true,
      email: true,
      displayName: true,
      username: true,
    },
  });

  return NextResponse.json({
    user,
    initialPassword,
  });
}
