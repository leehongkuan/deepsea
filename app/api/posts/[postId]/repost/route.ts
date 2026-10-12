import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { createPostNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function POST(_request: NextRequest, context: { params: Promise<{ postId: string }> }) {
  const user = await getAuthUser();

  if (!user) {
    return jsonError("Please log in to repost", 401);
  }

  const { postId } = await context.params;
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { id: true },
  });

  if (!post) {
    return jsonError("Post not found", 404);
  }

  const existing = await prisma.repost.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
    select: { id: true },
  });

  if (existing) {
    await prisma.repost.delete({ where: { id: existing.id } });
  } else {
    if (user.invalidatedAt) {
      return jsonError("Your account cannot repost right now", 403);
    }

    await prisma.repost.create({ data: { postId, userId: user.id } });
    await createPostNotification({ actorId: user.id, postId, type: "repost" });
  }

  const repostCount = await prisma.repost.count({ where: { postId } });

  return NextResponse.json({
    reposted: !existing,
    repostCount,
  });
}
