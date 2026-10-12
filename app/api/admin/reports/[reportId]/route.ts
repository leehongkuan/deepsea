import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type ReportAction = "hide" | "invalidate" | "review";

export async function PATCH(request: NextRequest, context: { params: Promise<{ reportId: string }> }) {
  const admin = await getAdminUser();

  if (!admin) {
    return jsonError("Admin login required", 401);
  }

  const { reportId } = await context.params;
  const body = await request.json().catch(() => null);
  const action = body?.action as ReportAction;

  if (action !== "hide" && action !== "invalidate" && action !== "review") {
    return jsonError("Invalid report action", 400);
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      post: { select: { id: true, authorId: true } },
      comment: { select: { id: true, authorId: true } },
    },
  });

  if (!report) {
    return jsonError("Report not found", 404);
  }

  const now = new Date();

  if (action === "hide") {
    if (report.postId) {
      await prisma.$transaction([
        prisma.post.update({ where: { id: report.postId }, data: { deletedAt: now } }),
        prisma.report.update({ where: { id: reportId }, data: { reviewedAt: now } }),
      ]);
    } else if (report.commentId) {
      await prisma.$transaction([
        prisma.comment.update({ where: { id: report.commentId }, data: { deletedAt: now } }),
        prisma.report.update({ where: { id: reportId }, data: { reviewedAt: now } }),
      ]);
    }
  }

  if (action === "invalidate") {
    const userId = report.post?.authorId ?? report.comment?.authorId;

    if (!userId) {
      return jsonError("Reported author not found", 404);
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { invalidatedAt: now } }),
      prisma.report.update({ where: { id: reportId }, data: { reviewedAt: now } }),
    ]);
  }

  if (action === "review") {
    await prisma.report.update({ where: { id: reportId }, data: { reviewedAt: now } });
  }

  return NextResponse.json({ ok: true });
}
