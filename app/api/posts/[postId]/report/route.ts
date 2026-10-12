import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, context: { params: Promise<{ postId: string }> }) {
  const user = await getAuthUser();

  if (!user) {
    return jsonError("Please log in to report posts", 401);
  }

  const { postId } = await context.params;
  const body = await request.json().catch(() => null);
  const reason = String(body?.reason ?? "").trim().slice(0, 280) || null;
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { id: true, authorId: true },
  });

  if (!post) {
    return jsonError("Post not found", 404);
  }

  if (post.authorId === user.id) {
    return jsonError("You cannot report your own post", 400);
  }

  await prisma.report.upsert({
    where: { reporterId_postId: { reporterId: user.id, postId } },
    update: { reason },
    create: { reporterId: user.id, postId, reason },
  });

  return NextResponse.json({ ok: true });
}
