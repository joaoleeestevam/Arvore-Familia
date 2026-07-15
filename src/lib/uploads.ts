import "server-only";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
]);

const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_VIDEO_SIZE = 300 * 1024 * 1024; // 300MB

function uploadsDir() {
  const dir = process.env.UPLOADS_DIR ?? "./uploads";
  return path.isAbsolute(dir)
    ? dir
    : path.join(/* turbopackIgnore: true */ process.cwd(), dir);
}

export class InvalidUploadError extends Error {}

async function saveFile(file: File) {
  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = path.join(dir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return { relativePath: fileName, mimeType: file.type };
}

export async function saveUploadedPhoto(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new InvalidUploadError(
      "Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF.",
    );
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new InvalidUploadError("A imagem deve ter no máximo 15MB.");
  }
  return saveFile(file);
}

export async function saveUploadedVideo(file: File) {
  if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
    throw new InvalidUploadError(
      "Formato de vídeo não suportado. Use MP4, WEBM, MOV ou OGG.",
    );
  }
  if (file.size > MAX_VIDEO_SIZE) {
    throw new InvalidUploadError("O vídeo deve ter no máximo 300MB.");
  }
  return saveFile(file);
}

export async function readUploadedPhoto(relativePath: string) {
  const safeName = path.basename(relativePath);
  const filePath = path.join(uploadsDir(), safeName);
  return readFile(filePath);
}

export async function deleteUploadedPhoto(relativePath: string) {
  const safeName = path.basename(relativePath);
  const filePath = path.join(uploadsDir(), safeName);
  try {
    await unlink(filePath);
  } catch {
    // arquivo já pode não existir; ignorar
  }
}
