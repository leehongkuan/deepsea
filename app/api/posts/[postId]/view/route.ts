import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const VIEWER_COOKIE = "deepsea_viewer";

export async function POST(_request: NextRequest, context: { params: Promise<{ postId: string }> }) {
  const user = await getAuthUser();
  const { postId } = await context.params;
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { id: true },
  });

  if (!post) {
    return jsonError("Post not found", 404);
  }

  const cookieStore = await cookies();
  let visitorId = cookieStore.get(VIEWER_COOKIE)?.value;

  if (!user && !visitorId) {
    visitorId = crypto.randomUUID();
    cookieStore.set(VIEWER_COOKIE, visitorId, {
      sameSite: "lax",
      path: "/",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
  }

  if (user) {
    await prisma.postView.upsert({
      where: { postId_userId: { postId, userId: user.id } },
      create: { postId, userId: user.id },
      update: {},
    });
  } else if (visitorId) {
    await prisma.postView.upsert({
      where: { postId_visitorId: { postId, visitorId } },
      create: { postId, visitorId },
      update: {},
    });
  }

  const viewCount = await prisma.postView.count({ where: { postId } });

  return NextResponse.json({ viewCount });
}
