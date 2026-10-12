import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError, publicUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import type { AppFollowUser } from "@/lib/shared";

type FollowTab = "followers" | "following";

const userSelect = {
  id: true,
  displayName: true,
  username: true,
  avatarUrl: true,
  description: true,
};

export async function GET(request: NextRequest, context: { params: Promise<{ username: string }> }) {
  const viewer = await getAuthUser();

  if (!viewer) {
    return jsonError("Please log in to view follows", 401);
  }

  const { username } = await context.params;
  const tab = normalizeTab(request.nextUrl.searchParams.get("tab"));

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return jsonError("User not found", 404);
  }

  const [listedUsers, followers, following] = await Promise.all([
    getListedUsers(user.id, tab),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
  ]);

  const listedIds = listedUsers.map((listedUser) => listedUser.id);

  const [viewerFollowing, viewerFollowers] =
    listedIds.length > 0
      ? await Promise.all([
          prisma.follow.findMany({
            where: {
              followerId: viewer.id,
              followingId: { in: listedIds },
            },
            select: { followingId: true },
          }),
          prisma.follow.findMany({
            where: {
              followerId: { in: listedIds },
              followingId: viewer.id,
            },
            select: { followerId: true },
          }),
        ])
      : [[], []];

  const followedIds = new Set(viewerFollowing.map((follow) => follow.followingId));
  const followerIds = new Set(viewerFollowers.map((follow) => follow.followerId));

  const users: AppFollowUser[] = listedUsers.map((listedUser) => ({
    ...listedUser,
    followedByViewer: followedIds.has(listedUser.id),
    followsViewer: followerIds.has(listedUser.id),
    isViewer: listedUser.id === viewer.id,
  }));

  return NextResponse.json({
    tab,
    user: {
      ...publicUser(user),
      stats: {
        followers: String(followers),
        following: String(following),
        posts: "0",
      },
    },
    users,
  });
}

function normalizeTab(value: string | null): FollowTab {
  return value === "following" ? "following" : "followers";
}

async function getListedUsers(userId: string, tab: FollowTab) {
  if (tab === "following") {
    const rows = await prisma.follow.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: "desc" },
      include: { following: { select: userSelect } },
      take: 100,
    });

    return rows.map((row) => row.following);
  }

  const rows = await prisma.follow.findMany({
    where: { followingId: userId },
    orderBy: { createdAt: "desc" },
    include: { follower: { select: userSelect } },
    take: 100,
  });

  return rows.map((row) => row.follower);
}
