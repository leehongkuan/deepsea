import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return jsonError("Please log in to view notifications", 401);
  }

  const notifications = await prisma.notification.findMany({
    where: { recipientId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: {
          displayName: true,
          username: true,
          avatarUrl: true,
        },
      },
      post: {
        select: {
          id: true,
          body: true,
        },
      },
    },
    take: 80,
  });

  await prisma.notification.updateMany({
    where: { recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({
    notifications: notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      createdAt: notification.createdAt.toISOString(),
      read: Boolean(notification.readAt),
      actor: {
        displayName: notification.actor.displayName,
        username: notification.actor.username,
        avatarUrl: notification.actor.avatarUrl,
      },
      post: {
        id: notification.post.id,
        body: notification.post.body,
      },
    })),
  });
}
