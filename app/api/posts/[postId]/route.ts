import { unlink } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { toAppComment, toAppPost } from "@/lib/posts";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type IncomingMedia = {
  type?: unknown;
  url?: unknown;
};

export async function GET(_request: NextRequest, context: { params: Promise<{ postId: string }> }) {
  const user = await getAuthUser();
  const { postId } = await context.params;

  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
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
      likes: user ? { where: { userId: user.id }, select: { userId: true } } : false,
      bookmarks: user ? { where: { userId: user.id }, select: { userId: true } } : false,
      reposts: user ? { where: { userId: user.id }, select: { userId: true } } : false,
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
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
      },
      _count: {
        select: {
          comments: { where: { deletedAt: null } },
          likes: true,
          bookmarks: true,
          reposts: true,
          views: true,
        },
      },
    },
  });

  if (!post) {
    return jsonError("Post not found", 404);
  }

  return NextResponse.json({
    post: toAppPost(post, user?.id),
    comments: post.comments.map(toAppComment),
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ postId: string }> }) {
  const user = await getAuthUser();

  if (!user) {
    return jsonError("Please log in to edit this post", 401);
  }

  const { postId } = await context.params;
  const body = await request.json().catch(() => null);
  const text = String(body?.body ?? "").trim();
  const media: IncomingMedia[] = Array.isArray(body?.media) ? body.media : [];

  if (!text && media.length === 0) {
    return jsonError("Post cannot be empty");
  }

  if (text.length > 5000) {
    return jsonError("Post cannot exceed 5000 characters");
  }

  if (media.length > 9) {
    return jsonError("A post can include up to 9 media files");
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

  const existing = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: {
      authorId: true,
      media: {
        select: { url: true },
      },
    },
  });

  if (!existing) {
    return jsonError("Post not found", 404);
  }

  if (existing.authorId !== user.id) {
    return jsonError("You can only edit your own posts", 403);
  }

  const removedMediaUrls = existing.media
    .map((item) => item.url)
    .filter((url) => !safeMedia.some((item) => item.url === url));

  const post = await prisma.$transaction(async (tx) => {
    await tx.media.deleteMany({ where: { postId } });

    return tx.post.update({
      where: { id: postId },
      data: {
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
        likes: { where: { userId: user.id }, select: { userId: true } },
        bookmarks: { where: { userId: user.id }, select: { userId: true } },
        reposts: { where: { userId: user.id }, select: { userId: true } },
        _count: {
          select: {
            comments: { where: { deletedAt: null } },
            likes: true,
            bookmarks: true,
            reposts: true,
            views: true,
          },
        },
      },
    });
  });

  await deleteUploadedFiles(removedMediaUrls);

  return NextResponse.json({
    post: toAppPost(post, user.id),
  });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ postId: string }> }) {
  const user = await getAuthUser();

  if (!user) {
    return jsonError("Please log in to delete this post", 401);
  }

  const { postId } = await context.params;
  const existing = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: {
      authorId: true,
      media: {
        select: { url: true },
      },
      comments: {
        select: {
          media: {
            select: { url: true },
          },
        },
      },
    },
  });

  if (!existing) {
    return jsonError("Post not found", 404);
  }

  if (existing.authorId !== user.id) {
    return jsonError("You can only delete your own posts", 403);
  }

  await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
  });

  await deleteUploadedFiles([
    ...existing.media.map((item) => item.url),
    ...existing.comments.flatMap((comment) => comment.media.map((item) => item.url)),
  ]);

  return NextResponse.json({ ok: true });
}

async function deleteUploadedFiles(urls: string[]) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const uniqueUrls = Array.from(new Set(urls));

  await Promise.all(
    uniqueUrls.map(async (url) => {
      if (!url.startsWith("/uploads/")) {
        return;
      }

      const filename = path.basename(url);

      try {
        await unlink(path.join(uploadsDir, filename));
      } catch (error) {
        if (!isMissingFileError(error)) {
          console.error(`Failed to delete uploaded file: ${url}`, error);
        }
      }
    }),
  );
}

function isMissingFileError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
