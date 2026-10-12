import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { jsonError, publicUser } from "@/lib/api";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getRequestLocation } from "@/lib/request-location";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return jsonError("Invalid JSON");
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return jsonError("Email and password are required");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return jsonError("Email or password is incorrect", 401);
  }

  const requestLocation = await getRequestLocation(request);
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      ipAddress: requestLocation.ipAddress,
      ipLocation: requestLocation.ipLocation,
    },
  });

  await createSession(user.id);

  return NextResponse.json({ user: publicUser(updatedUser) });
}
