import { prisma } from "@/lib/prisma";

export type NotificationType = "like" | "comment" | "repost";

export async function createPostNotification({
  actorId,
  postId,
  type,
}: {
  actorId: string;
  postId: string;
  type: NotificationType;
}) {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { authorId: true },
  });

  if (!post || post.authorId === actorId) {
    return;
  }

  await prisma.notification.upsert({
    where: {
      recipientId_actorId_postId_type: {
        recipientId: post.authorId,
        actorId,
        postId,
        type,
      },
    },
    create: {
      recipientId: post.authorId,
      actorId,
      postId,
      type,
    },
    update: {
      readAt: null,
      createdAt: new Date(),
    },
  });
}
