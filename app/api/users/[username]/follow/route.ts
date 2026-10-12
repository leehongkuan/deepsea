import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(_request: NextRequest, context: { params: Promise<{ username: string }> }) {
  const viewer = await getAuthUser();

  if (!viewer) {
    return jsonError("Please log in to follow users", 401);
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
    return jsonError("You cannot follow yourself");
  }

  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: viewer.id, blockedId: target.id },
        { blockerId: target.id, blockedId: viewer.id },
      ],
    },
    select: { id: true },
  });

  if (block) {
    return jsonError("You cannot follow this user right now", 403);
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: viewer.id,
        followingId: target.id,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({
      data: {
        followerId: viewer.id,
        followingId: target.id,
      },
    });
  }

  const followers = await prisma.follow.count({ where: { followingId: target.id } });

  return NextResponse.json({
    following: !existing,
    followers,
  });
}
