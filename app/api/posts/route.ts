import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { toAppPost } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { getRequestLocation } from "@/lib/request-location";

type IncomingMedia = {
  type?: unknown;
  url?: unknown;
};

const postInclude = (userId?: string) => ({
  author: {
    select: {
      id: true,
      displayName: true,
      username: true,
      avatarUrl: true,
    },
  },
  media: {
    orderBy: { sortOrder: "asc" as const },
    select: { type: true, url: true },
  },
  likes: userId ? { where: { userId }, select: { userId: true } } : false,
  bookmarks: userId ? { where: { userId }, select: { userId: true } } : false,
  reposts: userId ? { where: { userId }, select: { userId: true } } : false,
  _count: {
    select: {
      comments: true,
      likes: true,
      bookmarks: true,
      reposts: true,
      views: true,
    },
  },
});

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  const query = request.nextUrl.searchParams.get("q")?.trim();
  const feed = request.nextUrl.searchParams.get("feed");
  const followingOnly = feed === "following";

  if (followingOnly && !user) {
    return jsonError("Please log in to view following feed", 401);
  }

  const followingIds = followingOnly
    ? (
        await prisma.follow.findMany({
          where: { followerId: user!.id },
          select: { followingId: true },
        })
      ).map((follow) => follow.followingId)
    : [];
  const blockedUserIds = user
    ? (
        await prisma.userBlock.findMany({
          where: {
            OR: [{ blockerId: user.id }, { blockedId: user.id }],
          },
          select: { blockerId: true, blockedId: true },
        })
      ).map((block) => (block.blockerId === user.id ? block.blockedId : block.blockerId))
    : [];

  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      AND: [
        ...(blockedUserIds.length > 0 ? [{ authorId: { notIn: blockedUserIds } }] : []),
        ...(followingOnly ? [{ authorId: { in: followingIds } }] : []),
      ],
      ...(query
        ? {
            OR: [
              { body: { contains: query } },
              { author: { displayName: { contains: query } } },
              { author: { username: { contains: query } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: postInclude(user?.id),
    take: 50,
  });

  if (!query && user) {
    const reposts = await prisma.repost.findMany({
      where: {
        AND: [
          { userId: followingOnly ? { in: followingIds } : user.id },
          ...(blockedUserIds.length > 0 ? [{ userId: { notIn: blockedUserIds } }] : []),
        ],
        post: {
          deletedAt: null,
          ...(blockedUserIds.length > 0 ? { authorId: { notIn: blockedUserIds } } : {}),
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            displayName: true,
          },
        },
        post: {
          include: postInclude(user.id),
        },
      },
      take: 50,
    });

    const timelinePosts = [
      ...posts.map((post) => toAppPost(post, user.id)),
      ...reposts.map((repost) =>
        toAppPost(repost.post, user.id, {
          timelineId: `repost:${repost.id}`,
          repostedBy: repost.user.displayName,
          repostedAt: repost.createdAt,
        }),
      ),
    ]
      .sort(
        (a, b) =>
          new Date(b.repostedAt ?? b.createdAt).getTime() - new Date(a.repostedAt ?? a.createdAt).getTime(),
      )
      .filter((post, index, items) => items.findIndex((item) => item.id === post.id) === index)
      .slice(0, 50);

    return NextResponse.json({
      posts: timelinePosts,
    });
  }

  return NextResponse.json({
    posts: posts.map((post) => toAppPost(post, user?.id)),
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();

  if (!user) {
    return jsonError("Please log in to post", 401);
  }

  if (user.invalidatedAt) {
    return jsonError("Your account cannot post right now", 403);
  }

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

  const requestLocation = await getRequestLocation(request);
  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;

  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      body: text,
      ipAddress: requestLocation.ipAddress,
      ipLocation: requestLocation.ipLocation,
      userAgent,
      media: safeMedia.length > 0 ? { create: safeMedia } : undefined,
    },
    include: postInclude(user.id),
  });

  return NextResponse.json(
    {
      post: toAppPost(post, user.id),
    },
    { status: 201 },
  );
}
