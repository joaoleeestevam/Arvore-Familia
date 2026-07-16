"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  saveUploadedPhoto,
  saveUploadedVideo,
  deleteUploadedPhoto,
  InvalidUploadError,
} from "@/lib/uploads";
import { computeImageHash, hammingDistance, DUPLICATE_THRESHOLD } from "@/lib/phash";

const PhotoSchema = z.object({
  mediaType: z.enum(["IMAGE", "VIDEO_FILE", "VIDEO_LINK"]).default("IMAGE"),
  takenDate: z.string().optional(),
  caption: z.string().optional(),
  description: z.string().optional(),
  externalUrl: z.string().optional(),
});

export type PhotoFormState =
  | { error?: string }
  | { duplicate: { photoId: string; caption: string | null } }
  | undefined;

async function findDuplicatePhoto(phash: string) {
  const candidates = await prisma.photo.findMany({
    where: { mediaType: "IMAGE", phash: { not: null } },
    select: { id: true, phash: true, caption: true },
  });
  for (const candidate of candidates) {
    if (
      candidate.phash &&
      hammingDistance(phash, candidate.phash) <= DUPLICATE_THRESHOLD
    ) {
      return candidate;
    }
  }
  return null;
}

function toDateOrNull(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSafeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function resolveMedia(
  mediaType: "IMAGE" | "VIDEO_FILE" | "VIDEO_LINK",
  formData: FormData,
): Promise<
  | { error: string }
  | {
      filePath: string | null;
      mimeType: string | null;
      externalUrl: string | null;
      phash: string | null;
    }
> {
  if (mediaType === "IMAGE") {
    const file = formData.get("photo");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Selecione uma foto para enviar." };
    }
    try {
      const [saved, phash] = await Promise.all([
        saveUploadedPhoto(file),
        computeImageHash(Buffer.from(await file.arrayBuffer())),
      ]);
      return {
        filePath: saved.relativePath,
        mimeType: saved.mimeType,
        externalUrl: null,
        phash,
      };
    } catch (err) {
      if (err instanceof InvalidUploadError) return { error: err.message };
      throw err;
    }
  }

  if (mediaType === "VIDEO_FILE") {
    const file = formData.get("video");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Selecione um vídeo para enviar." };
    }
    try {
      const saved = await saveUploadedVideo(file);
      return {
        filePath: saved.relativePath,
        mimeType: saved.mimeType,
        externalUrl: null,
        phash: null,
      };
    } catch (err) {
      if (err instanceof InvalidUploadError) return { error: err.message };
      throw err;
    }
  }

  const url = (formData.get("externalUrl") as string | null)?.trim();
  if (!url) return { error: "Informe o link do vídeo." };
  if (!isSafeExternalUrl(url)) return { error: "Informe um link http(s) válido." };
  return { filePath: null, mimeType: null, externalUrl: url, phash: null };
}

export async function uploadPhoto(
  _prevState: PhotoFormState,
  formData: FormData,
): Promise<PhotoFormState> {
  const user = await getCurrentUser();

  const parsed = PhotoSchema.safeParse({
    mediaType: formData.get("mediaType") || undefined,
    takenDate: formData.get("takenDate") || undefined,
    caption: formData.get("caption") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: "Dados inválidos." };
  }

  const personIds = formData.getAll("personIds").map(String).filter(Boolean);
  const otherPeopleNames = (formData.get("otherPeopleNames") as string) || "";

  const media = await resolveMedia(parsed.data.mediaType, formData);
  if ("error" in media) {
    return { error: media.error };
  }

  const confirmDuplicate = formData.get("confirmDuplicate") === "true";
  if (media.phash && !confirmDuplicate) {
    const duplicate = await findDuplicatePhoto(media.phash);
    if (duplicate) {
      if (media.filePath) await deleteUploadedPhoto(media.filePath);
      return {
        duplicate: { photoId: duplicate.id, caption: duplicate.caption },
      };
    }
  }

  const photo = await prisma.photo.create({
    data: {
      mediaType: parsed.data.mediaType,
      filePath: media.filePath,
      mimeType: media.mimeType,
      externalUrl: media.externalUrl,
      phash: media.phash,
      takenDate: toDateOrNull(parsed.data.takenDate),
      caption: parsed.data.caption || null,
      description: parsed.data.description || null,
      otherPeopleNames: otherPeopleNames || null,
      uploadedById: user.id,
      people: {
        create: personIds.map((personId) => ({ personId })),
      },
    },
  });

  // se alguma das pessoas marcadas ainda não tem foto de perfil, define esta como atual
  // (só faz sentido para fotos de verdade, não para vídeos)
  if (parsed.data.mediaType === "IMAGE") {
    await prisma.person.updateMany({
      where: { id: { in: personIds }, profilePhotoId: null },
      data: { profilePhotoId: photo.id },
    });
  }

  revalidatePath("/fotos");
  for (const personId of personIds) {
    revalidatePath(`/arvore/${personId}`);
  }
  redirect(`/fotos/${photo.id}`);
}

export async function updatePhoto(
  photoId: string,
  _prevState: PhotoFormState,
  formData: FormData,
): Promise<PhotoFormState> {
  await getCurrentUser();

  const parsed = PhotoSchema.safeParse({
    mediaType: formData.get("mediaType") || undefined,
    takenDate: formData.get("takenDate") || undefined,
    caption: formData.get("caption") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: "Dados inválidos." };
  }

  const personIds = formData.getAll("personIds").map(String).filter(Boolean);
  const otherPeopleNames = (formData.get("otherPeopleNames") as string) || "";

  await prisma.$transaction([
    prisma.photoPerson.deleteMany({ where: { photoId } }),
    prisma.photoPerson.createMany({
      data: personIds.map((personId) => ({ photoId, personId })),
    }),
    prisma.photo.update({
      where: { id: photoId },
      data: {
        takenDate: toDateOrNull(parsed.data.takenDate),
        caption: parsed.data.caption || null,
        description: parsed.data.description || null,
        otherPeopleNames: otherPeopleNames || null,
      },
    }),
  ]);

  revalidatePath("/fotos");
  revalidatePath(`/fotos/${photoId}`);
  redirect(`/fotos/${photoId}`);
}

export async function deletePhoto(photoId: string) {
  const user = await getCurrentUser();

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;

  if (user.role !== "ADMIN" && photo.uploadedById !== user.id) {
    throw new Error("Você não pode excluir esta foto.");
  }

  await prisma.person.updateMany({
    where: { profilePhotoId: photoId },
    data: { profilePhotoId: null },
  });
  await prisma.photo.delete({ where: { id: photoId } });
  if (photo.filePath) {
    await deleteUploadedPhoto(photo.filePath);
  }

  revalidatePath("/fotos");
  redirect("/fotos");
}
