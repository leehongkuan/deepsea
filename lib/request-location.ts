import type { NextRequest } from "next/server";

const LOCAL_IPS = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"]);

export async function getRequestLocation(request: NextRequest) {
  const ipAddress = getClientIp(request);
  const headerLocation = getHeaderLocation(request, ipAddress);

  return {
    ipAddress,
    ipLocation: headerLocation || (await lookupIpLocation(ipAddress)) || "Unknown location",
  };
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip =
    forwardedFor ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("true-client-ip");

  return ip ? ip.slice(0, 45) : null;
}

function getHeaderLocation(request: NextRequest, ipAddress: string | null) {
  if (!ipAddress || isPrivateIp(ipAddress)) {
    return "Local network";
  }

  const city = decodeHeader(request.headers.get("x-vercel-ip-city") || request.headers.get("cf-ipcity"));
  const region = decodeHeader(request.headers.get("x-vercel-ip-country-region"));
  const country =
    decodeHeader(request.headers.get("x-vercel-ip-country")) ||
    decodeHeader(request.headers.get("cf-ipcountry")) ||
    decodeHeader(request.headers.get("x-country-code"));
  const location = [city, region, country].filter(Boolean).join(", ");

  return location ? location.slice(0, 120) : null;
}

async function lookupIpLocation(ipAddress: string | null) {
  if (!ipAddress || isPrivateIp(ipAddress)) {
    return "Local network";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(
      `https://ipapi.co/${encodeURIComponent(ipAddress)}/json/`,
      {
        headers: { accept: "application/json" },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json().catch(() => null)) as {
      city?: unknown;
      region?: unknown;
      country_name?: unknown;
      country?: unknown;
      error?: unknown;
    } | null;

    if (!data || data.error) {
      return null;
    }

    const city = typeof data.city === "string" ? data.city : "";
    const region = typeof data.region === "string" ? data.region : "";
    const country =
      typeof data.country_name === "string" ? data.country_name : typeof data.country === "string" ? data.country : "";
    const location = [city, region, country].filter(Boolean).join(", ");

    return location ? location.slice(0, 120) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function isPrivateIp(ipAddress: string) {
  return (
    LOCAL_IPS.has(ipAddress) ||
    ipAddress.startsWith("192.168.") ||
    ipAddress.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ipAddress) ||
    ipAddress.startsWith("fc") ||
    ipAddress.startsWith("fd") ||
    ipAddress.startsWith("fe80:")
  );
}

function decodeHeader(value: string | null) {
  if (!value || value === "XX") {
    return "";
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
