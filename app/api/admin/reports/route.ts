import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await getAdminUser();

  if (!admin) {
    return jsonError("Admin login required", 401);
  }

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: {
        select: {
          id: true,
          displayName: true,
          username: true,
        },
      },
      post: {
        select: {
          id: true,
          body: true,
          deletedAt: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              displayName: true,
              username: true,
              invalidatedAt: true,
            },
          },
        },
      },
      comment: {
        select: {
          id: true,
          body: true,
          deletedAt: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              displayName: true,
              username: true,
              invalidatedAt: true,
            },
          },
          post: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    reports: reports.map((report) => {
      const target = report.post
        ? {
            type: "post" as const,
            id: report.post.id,
            body: report.post.body,
            createdAt: report.post.createdAt.toISOString(),
            deletedAt: report.post.deletedAt?.toISOString() ?? null,
            author: {
              ...report.post.author,
              invalidatedAt: report.post.author.invalidatedAt?.toISOString() ?? null,
            },
          }
        : report.comment
          ? {
              type: "comment" as const,
              id: report.comment.id,
              body: report.comment.body,
              postId: report.comment.post.id,
              createdAt: report.comment.createdAt.toISOString(),
              deletedAt: report.comment.deletedAt?.toISOString() ?? null,
              author: {
                ...report.comment.author,
                invalidatedAt: report.comment.author.invalidatedAt?.toISOString() ?? null,
              },
            }
          : null;

      return {
        id: report.id,
        reason: report.reason,
        createdAt: report.createdAt.toISOString(),
        reviewedAt: report.reviewedAt?.toISOString() ?? null,
        reporter: report.reporter,
        target,
      };
    }),
  });
}
