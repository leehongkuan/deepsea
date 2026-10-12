import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(_request: NextRequest, context: { params: Promise<{ username: string }> }) {
  const viewer = await getAuthUser();

  if (!viewer) {
    return jsonError("Please log in to block users", 401);
  }

  const { username } = await context.params;
  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!target) {
    return jsonError("User not found", 404);
  }

  if (target.id === viewer.id) {
    return jsonError("You cannot block yourself", 400);
  }

  const existing = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: viewer.id, blockedId: target.id } },
  });

  if (existing) {
    await prisma.userBlock.delete({ where: { id: existing.id } });
    return NextResponse.json({ blocked: false });
  }

  await prisma.$transaction([
    prisma.userBlock.create({
      data: { blockerId: viewer.id, blockedId: target.id },
    }),
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: viewer.id, followingId: target.id },
          { followerId: target.id, followingId: viewer.id },
        ],
      },
    }),
  ]);

  return NextResponse.json({ blocked: true });
}
