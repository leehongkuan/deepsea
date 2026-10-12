import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();

  if (!admin) {
    return jsonError("Admin login required", 401);
  }

  const query = request.nextUrl.searchParams.get("q")?.trim();
  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { email: { contains: query } },
            { displayName: { contains: query } },
            { username: { contains: query } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      email: true,
      displayName: true,
      username: true,
      language: true,
      avatarUrl: true,
      description: true,
      birthDate: true,
      ipAddress: true,
      ipLocation: true,
      invalidatedAt: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          posts: true,
          comments: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      ...user,
      birthDate: user.birthDate.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      invalidatedAt: user.invalidatedAt?.toISOString() ?? null,
    })),
  });
}
