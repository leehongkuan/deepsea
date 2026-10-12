import { NextRequest, NextResponse } from "next/server";
import { isAvatarUrl } from "@/lib/avatars";
import { getAuthUser } from "@/lib/auth";
import { jsonError, publicUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser();

  if (!user) {
    return jsonError("Please log in to edit your profile", 401);
  }

  const body = await request.json().catch(() => null);
  const displayName = String(body?.displayName ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const avatarUrl = isAvatarUrl(body?.avatarUrl) ? body.avatarUrl : user.avatarUrl;

  if (!displayName) {
    return jsonError("Display name is required");
  }

  if (displayName.length > 50) {
    return jsonError("Display name cannot exceed 50 characters");
  }

  if (description.length > 280) {
    return jsonError("Description cannot exceed 280 characters");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName,
      description: description || null,
      avatarUrl,
    },
  });

  return NextResponse.json({
    user: publicUser(updated),
  });
}
