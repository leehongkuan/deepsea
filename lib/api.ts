import { NextResponse } from "next/server";
import type { Locale } from "@/lib/shared";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function isLocale(value: unknown): value is Locale {
  return value === "zh" || value === "en" || value === "ja";
}

export function publicUser(user: {
  id: string;
  email: string;
  displayName: string;
  username: string;
  language: string;
  avatarUrl: string | null;
  description: string | null;
  ipLocation: string | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    username: user.username,
    language: isLocale(user.language) ? user.language : "en",
    avatarUrl: user.avatarUrl,
    description: user.description,
    ipLocation: user.ipLocation,
    createdAt: user.createdAt.toISOString(),
  };
}
