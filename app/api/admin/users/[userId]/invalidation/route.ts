import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const admin = await getAdminUser();

  if (!admin) {
    return jsonError("Admin login required", 401);
  }

  const body = await request.json().catch(() => null);
  const invalidated = Boolean(body?.invalidated);
  const { userId } = await context.params;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      invalidatedAt: invalidated ? new Date() : null,
    },
    select: {
      id: true,
      invalidatedAt: true,
    },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      invalidatedAt: user.invalidatedAt?.toISOString() ?? null,
    },
  });
}
