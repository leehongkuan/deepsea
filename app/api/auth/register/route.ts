import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { isLocale, jsonError, publicUser } from "@/lib/api";
import { avatarOptions, isAvatarUrl } from "@/lib/avatars";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getRequestLocation } from "@/lib/request-location";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return jsonError("Invalid JSON");
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const confirmPassword = String(body.confirmPassword ?? "");
  const displayName = String(body.displayName ?? "").trim();
  const birthDate = String(body.birthDate ?? "");
  const inviteCodeValue = String(body.inviteCode ?? "").trim();
  const language = isLocale(body.language) ? body.language : "en";
  const avatarUrl = isAvatarUrl(body.avatarUrl) ? body.avatarUrl : avatarOptions[0].url;
  const requestLocation = await getRequestLocation(request);

  if (!email || !password || !confirmPassword || !displayName || !birthDate || !inviteCodeValue) {
    return jsonError("Please complete every field");
  }

  if (password !== confirmPassword) {
    return jsonError("Passwords do not match");
  }

  if (password.length < 6) {
    return jsonError("Password must be at least 6 characters");
  }

  const inviteCode = await prisma.inviteCode.findUnique({
    where: { code: inviteCodeValue },
    select: { id: true, active: true },
  });

  if (!inviteCode?.active) {
    return jsonError("Invitation code is invalid", 403);
  }

  const username = await uniqueUsername(createUsername(displayName, email));

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        displayName,
        username,
        birthDate: new Date(`${birthDate}T00:00:00.000Z`),
        language,
        avatarUrl,
        ipAddress: requestLocation.ipAddress,
        ipLocation: requestLocation.ipLocation,
        inviteCodeId: inviteCode.id,
      },
    });

    await createSession(user.id);

    return NextResponse.json({ user: publicUser(user) }, { status: 201 });
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      return jsonError("Email is already registered", 409);
    }
    throw error;
  }
}

function createUsername(displayName: string, email: string) {
  const name = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16);
  const fallback = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16);
  return name || fallback || "deepseauser";
}

async function uniqueUsername(base: string) {
  let candidate = base;
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function isPrismaUniqueError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}
