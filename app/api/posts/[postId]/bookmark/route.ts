import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(_request: NextRequest, context: { params: Promise<{ postId: string }> }) {
  const user = await getAuthUser();

  if (!user) {
    return jsonError("Please log in to bookmark posts", 401);
  }

  const { postId } = await context.params;
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { id: true },
  });

  if (!post) {
    return jsonError("Post not found", 404);
  }

  const existing = await prisma.bookmark.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
    select: { id: true },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
  } else {
    await prisma.bookmark.create({ data: { postId, userId: user.id } });
  }

  const bookmarkCount = await prisma.bookmark.count({ where: { postId } });

  return NextResponse.json({
    bookmarked: !existing,
    bookmarkCount,
  });
}
