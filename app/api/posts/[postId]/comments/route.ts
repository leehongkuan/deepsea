import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { createPostNotification } from "@/lib/notifications";
import { toAppComment } from "@/lib/posts";
import { prisma } from "@/lib/prisma";

type IncomingMedia = {
  type?: unknown;
  url?: unknown;
};

export async function POST(request: NextRequest, context: { params: Promise<{ postId: string }> }) {
  const user = await getAuthUser();

  if (!user) {
    return jsonError("Please log in to comment", 401);
  }

  if (user.invalidatedAt) {
    return jsonError("Your account cannot comment right now", 403);
  }

  const { postId } = await context.params;
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { id: true },
  });

  if (!post) {
    return jsonError("Post not found", 404);
  }

  const body = await request.json().catch(() => null);
  const text = String(body?.body ?? "").trim();
  const media: IncomingMedia[] = Array.isArray(body?.media) ? body.media : [];

  if (!text && media.length === 0) {
    return jsonError("Comment cannot be empty");
  }

  if (text.length > 5000) {
    return jsonError("Comment cannot exceed 5000 characters");
  }

  if (media.length > 9) {
    return jsonError("A comment can include up to 9 media files");
  }

  const safeMedia = media.map((item, index) => ({
    uploaderId: user.id,
    type: item?.type === "video" ? "video" : "image",
    url: String(item?.url ?? ""),
    sortOrder: index,
  }));

  if (safeMedia.some((item) => !item.url.startsWith("/uploads/"))) {
    return jsonError("Invalid media attachment");
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId: user.id,
      body: text,
      media: safeMedia.length > 0 ? { create: safeMedia } : undefined,
    },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          username: true,
          avatarUrl: true,
        },
      },
      media: {
        orderBy: { sortOrder: "asc" },
        select: { type: true, url: true },
      },
    },
  });

  const commentCount = await prisma.comment.count({
    where: { postId, deletedAt: null },
  });
  await createPostNotification({ actorId: user.id, postId, type: "comment" });

  return NextResponse.json(
    {
      comment: toAppComment(comment),
      commentCount,
    },
    { status: 201 },
  );
}
