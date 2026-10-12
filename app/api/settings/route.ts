import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

function formatBirthDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string) {
  return /^[a-zA-Z0-9_]{3,24}$/.test(username);
}

export async function GET() {
  const authUser = await getAuthUser();

  if (!authUser) {
    return jsonError("Please log in to view settings", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      email: true,
      username: true,
      birthDate: true,
    },
  });

  if (!user) {
    return jsonError("User not found", 404);
  }

  return NextResponse.json({
    settings: {
      email: user.email,
      username: user.username,
      birthDate: formatBirthDate(user.birthDate),
    },
  });
}

export async function PATCH(request: NextRequest) {
  const authUser = await getAuthUser();

  if (!authUser) {
    return jsonError("Please log in to update settings", 401);
  }

  const body = await request.json().catch(() => null);

  if (!body) {
    return jsonError("Invalid JSON");
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const username = String(body.username ?? "").trim().toLowerCase();
  const birthDate = String(body.birthDate ?? "");
  const password = String(body.password ?? "");

  if (!email || !username || !birthDate) {
    return jsonError("Email, handle, and birthday are required");
  }

  if (!isValidEmail(email)) {
    return jsonError("Please enter a valid email address");
  }

  if (!isValidUsername(username)) {
    return jsonError("Handle must be 3-24 letters, numbers, or underscores");
  }

  const parsedBirthDate = new Date(`${birthDate}T00:00:00.000Z`);

  if (Number.isNaN(parsedBirthDate.getTime())) {
    return jsonError("Please enter a valid birthday");
  }

  if (password && password.length < 6) {
    return jsonError("Password must be at least 6 characters");
  }

  const [emailOwner, usernameOwner] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
  ]);

  if (emailOwner && emailOwner.id !== authUser.id) {
    return jsonError("Email is already registered", 409);
  }

  if (usernameOwner && usernameOwner.id !== authUser.id) {
    return jsonError("Handle is already taken", 409);
  }

  const updated = await prisma.user.update({
    where: { id: authUser.id },
    data: {
      email,
      username,
      birthDate: parsedBirthDate,
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    },
    select: {
      email: true,
      username: true,
      birthDate: true,
    },
  });

  return NextResponse.json({
    settings: {
      email: updated.email,
      username: updated.username,
      birthDate: formatBirthDate(updated.birthDate),
    },
  });
}
