import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 35 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2560;
const HEIC_EXTENSIONS = new Set(["heic", "heif"]);
const allowedTypes = new Map([
  ["image/jpeg", { extension: "jpg", type: "image" }],
  ["image/png", { extension: "png", type: "image" }],
  ["image/webp", { extension: "webp", type: "image" }],
  ["image/gif", { extension: "gif", type: "image" }],
  ["image/heic", { extension: "heic", type: "image" }],
  ["image/heif", { extension: "heif", type: "image" }],
  ["video/mp4", { extension: "mp4", type: "video" }],
  ["video/webm", { extension: "webm", type: "video" }],
  ["video/quicktime", { extension: "mov", type: "video" }],
]);
const allowedExtensions = new Map([
  ["jpg", { extension: "jpg", type: "image" }],
  ["jpeg", { extension: "jpg", type: "image" }],
  ["png", { extension: "png", type: "image" }],
  ["webp", { extension: "webp", type: "image" }],
  ["gif", { extension: "gif", type: "image" }],
  ["heic", { extension: "heic", type: "image" }],
  ["heif", { extension: "heif", type: "image" }],
  ["mp4", { extension: "mp4", type: "video" }],
  ["webm", { extension: "webm", type: "video" }],
  ["mov", { extension: "mov", type: "video" }],
]);

type MediaInfo = {
  extension: string;
  type: "image" | "video";
};

export async function POST(request: NextRequest) {
  const user = await getAuthUser();

  if (!user) {
    return jsonError("Please log in to upload media", 401);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("Missing media file");
  }

  const mediaInfo = getMediaInfo(file);

  if (!mediaInfo) {
    return jsonError("Only JPG, PNG, WebP, GIF, HEIC images and MP4, WebM, MOV videos are supported");
  }

  if (mediaInfo.type === "image" && file.size > MAX_IMAGE_BYTES) {
    return jsonError("Image must be smaller than 10MB");
  }

  if (mediaInfo.type === "video" && file.size > MAX_VIDEO_BYTES) {
    return jsonError("Video must be smaller than 35MB");
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  const preparedMedia =
    mediaInfo.type === "image"
      ? await prepareImage(bytes, mediaInfo.extension).catch((error) => {
          console.error("Failed to process uploaded image", {
            fileName: file.name,
            fileType: file.type,
            extension: mediaInfo.extension,
            error,
          });
          return null;
        })
      : { bytes, extension: mediaInfo.extension };

  if (!preparedMedia) {
    return jsonError("This image could not be processed. Please try another image.");
  }

  if (mediaInfo.type === "image" && preparedMedia.bytes.length > MAX_IMAGE_BYTES) {
    return jsonError("Compressed image must be smaller than 10MB");
  }

  const filename = `${crypto.randomUUID()}.${preparedMedia.extension}`;
  await writeFile(path.join(uploadsDir, filename), preparedMedia.bytes);

  return NextResponse.json({
    media: {
      type: mediaInfo.type,
      url: `/uploads/${filename}`,
    },
  });
}

function getMediaInfo(file: File): MediaInfo | undefined {
  const mimeInfo = allowedTypes.get(file.type);

  if (mimeInfo) {
    return mimeInfo as MediaInfo;
  }

  const extension = path.extname(file.name).slice(1).toLowerCase();
  const extensionInfo = allowedExtensions.get(extension);

  return extensionInfo as MediaInfo | undefined;
}

async function prepareImage(bytes: Buffer, sourceExtension: string) {
  if (sourceExtension === "gif") {
    return { bytes, extension: "gif" };
  }

  const decodableBytes = HEIC_EXTENSIONS.has(sourceExtension) ? await convertHeicToJpeg(bytes) : bytes;
  const optimized = await sharp(decodableBytes, { failOn: "truncated" })
    .rotate()
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 88,
      effort: 5,
      smartSubsample: true,
    })
    .toBuffer();

  return { bytes: optimized, extension: "webp" };
}

async function convertHeicToJpeg(bytes: Buffer) {
  const heicConvertModule = (await import("heic-convert")) as {
    default?: (options: { buffer: Buffer; format: "JPEG"; quality: number }) => Promise<ArrayBuffer | Buffer>;
  };
  const heicConvert = heicConvertModule.default;

  if (!heicConvert) {
    throw new Error("HEIC converter is unavailable");
  }

  const converted = await heicConvert({
    buffer: bytes,
    format: "JPEG",
    quality: 0.95,
  });

  return Buffer.isBuffer(converted) ? converted : Buffer.from(new Uint8Array(converted));
}
