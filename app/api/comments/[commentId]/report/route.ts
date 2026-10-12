import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, context: { params: Promise<{ commentId: string }> }) {
  const user = await getAuthUser();

  if (!user) {
    return jsonError("Please log in to report comments", 401);
  }

  const { commentId } = await context.params;
  const body = await request.json().catch(() => null);
  const reason = String(body?.reason ?? "").trim().slice(0, 280) || null;
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, deletedAt: null, post: { deletedAt: null } },
    select: { id: true, authorId: true },
  });

  if (!comment) {
    return jsonError("Comment not found", 404);
  }

  if (comment.authorId === user.id) {
    return jsonError("You cannot report your own comment", 400);
  }

  await prisma.report.upsert({
    where: { reporterId_commentId: { reporterId: user.id, commentId } },
    update: { reason },
    create: { reporterId: user.id, commentId, reason },
  });

  return NextResponse.json({ ok: true });
}
