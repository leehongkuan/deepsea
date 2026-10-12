import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { toAppPost } from "@/lib/posts";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return jsonError("Please log in to view bookmarks", 401);
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: user.id,
      post: { deletedAt: null },
    },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
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
              comments: true,
              likes: true,
              bookmarks: true,
              reposts: true,
              views: true,
            },
          },
        },
      },
    },
    take: 50,
  });

  return NextResponse.json({
    posts: bookmarks.map((bookmark) => toAppPost(bookmark.post, user.id)),
  });
}
