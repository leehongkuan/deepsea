import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { toAppPost } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { jsonError, publicUser } from "@/lib/api";

export async function GET(_request: NextRequest, context: { params: Promise<{ username: string }> }) {
  const viewer = await getAuthUser();
  const { username } = await context.params;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return jsonError("User not found", 404);
  }

  const blockRelation = viewer
    ? await prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: viewer.id, blockedId: user.id },
            { blockerId: user.id, blockedId: viewer.id },
          ],
        },
        select: { blockerId: true },
      })
    : null;
  const blocksViewer = Boolean(viewer && blockRelation?.blockerId === user.id);
  const blockedByViewer = Boolean(viewer && blockRelation?.blockerId === viewer.id);

  const [posts, followers, following, followedByViewer] = await Promise.all([
    prisma.post.findMany({
      where: {
        authorId: user.id,
        deletedAt: null,
        ...(blocksViewer || blockedByViewer ? { id: "__blocked__" } : {}),
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
        likes: viewer ? { where: { userId: viewer.id }, select: { userId: true } } : false,
        bookmarks: viewer ? { where: { userId: viewer.id }, select: { userId: true } } : false,
        reposts: viewer ? { where: { userId: viewer.id }, select: { userId: true } } : false,
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
    }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    viewer
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewer.id,
              followingId: user.id,
            },
          },
          select: { id: true },
        })
      : null,
  ]);

  return NextResponse.json({
    user: {
      ...publicUser(user),
      stats: {
        followers: String(followers),
        following: String(following),
        posts: String(posts.length),
      },
      followedByViewer: Boolean(followedByViewer),
      blockedByViewer,
    },
    posts: posts.map((post) => toAppPost(post, viewer?.id)),
    viewer,
  });
}
