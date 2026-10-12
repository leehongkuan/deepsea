import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { toAppPost } from "@/lib/posts";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return jsonError("Please log in to view your profile", 401);
  }

  const posts = await prisma.post.findMany({
    where: {
      authorId: user.id,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
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
    take: 50,
  });

  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
  ]);

  return NextResponse.json({
    user: {
      ...user,
      stats: {
        followers: String(followers),
        following: String(following),
        posts: String(posts.length),
      },
    },
    posts: posts.map((post) => toAppPost(post, user.id)),
  });
}
