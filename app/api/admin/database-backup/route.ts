import { execFile } from "child_process";
import { mkdir, readdir, stat } from "fs/promises";
import path from "path";
import { promisify } from "util";
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api";

const execFileAsync = promisify(execFile);
const BACKUP_DIR = path.join(process.cwd(), "storage", "db-backups");

type BackupInfo = {
  path: string;
  createdAt: string;
  size: number;
};

export async function GET() {
  const admin = await getAdminUser();

  if (!admin) {
    return jsonError("Admin login required", 401);
  }

  return NextResponse.json({
    backup: await getLatestBackup(),
  });
}

export async function POST() {
  const admin = await getAdminUser();

  if (!admin) {
    return jsonError("Admin login required", 401);
  }

  const config = getDatabaseConfig();

  if (!config) {
    return jsonError("DATABASE_URL is not a supported MySQL URL", 500);
  }

  await mkdir(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(BACKUP_DIR, `deepsea-${config.database}-${timestamp}.sql`);
  const args = [
    "--host",
    config.host,
    "--port",
    config.port,
    "--user",
    config.user,
    "--single-transaction",
    "--routines",
    "--triggers",
    "--databases",
    config.database,
    "--result-file",
    backupPath,
  ];

  try {
    await execFileAsync("mysqldump", args, {
      env: {
        ...process.env,
        MYSQL_PWD: config.password,
      },
      timeout: 60_000,
      maxBuffer: 1024 * 1024,
    });
  } catch (error) {
    console.error("Database backup failed", error);
    return jsonError("Database backup failed", 500);
  }

  const backupStat = await stat(backupPath);

  return NextResponse.json({
    backup: {
      path: backupPath,
      createdAt: backupStat.mtime.toISOString(),
      size: backupStat.size,
    },
  });
}

async function getLatestBackup(): Promise<BackupInfo | null> {
  await mkdir(BACKUP_DIR, { recursive: true });

  const files = await readdir(BACKUP_DIR);
  const backups = await Promise.all(
    files
      .filter((file) => file.endsWith(".sql"))
      .map(async (file) => {
        const filePath = path.join(BACKUP_DIR, file);
        const fileStat = await stat(filePath);

        return {
          path: filePath,
          createdAt: fileStat.mtime.toISOString(),
          size: fileStat.size,
        };
      }),
  );

  return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
}

function getDatabaseConfig() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "mysql:") {
      return null;
    }

    const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));

    if (!database) {
      return null;
    }

    return {
      host: parsed.hostname || "127.0.0.1",
      port: parsed.port || "3306",
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database,
    };
  } catch {
    return null;
  }
}
