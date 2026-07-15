"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { saveUploadedPhoto, InvalidUploadError } from "@/lib/uploads";

const SettingsSchema = z.object({
  familyName: z.string().trim().min(1, "Informe o nome da família."),
  description: z.string().optional(),
});

export type SettingsFormState = { error?: string; success?: boolean } | undefined;

export async function updateFamilySettings(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireAdmin();

  const parsed = SettingsSchema.safeParse({
    familyName: formData.get("familyName"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const backgroundFile = formData.get("backgroundPhoto");
  let backgroundPhotoId: string | undefined;

  if (backgroundFile instanceof File && backgroundFile.size > 0) {
    try {
      const { relativePath, mimeType } = await saveUploadedPhoto(backgroundFile);
      const photo = await prisma.photo.create({
        data: { filePath: relativePath, mimeType, uploadedById: user.id },
      });
      backgroundPhotoId = photo.id;
    } catch (err) {
      if (err instanceof InvalidUploadError) {
        return { error: err.message };
      }
      throw err;
    }
  }

  const existing = await prisma.familySettings.findFirst();

  if (existing) {
    await prisma.familySettings.update({
      where: { id: existing.id },
      data: {
        familyName: parsed.data.familyName,
        description: parsed.data.description || null,
        ...(backgroundPhotoId ? { backgroundPhotoId } : {}),
      },
    });
  } else {
    await prisma.familySettings.create({
      data: {
        familyName: parsed.data.familyName,
        description: parsed.data.description || null,
        backgroundPhotoId,
      },
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}
