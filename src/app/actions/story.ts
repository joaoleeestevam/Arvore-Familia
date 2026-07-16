"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { saveUploadedPhoto, InvalidUploadError } from "@/lib/uploads";
import { sanitizeRichText, isRichTextEmpty } from "@/lib/sanitize";

const StorySchema = z.object({
  title: z.string().trim().min(1, "Informe um título."),
  content: z
    .string()
    .refine((value) => !isRichTextEmpty(value), "Escreva o conteúdo da história."),
});

export type StoryFormState = { error?: string } | undefined;

function getPersonIds(formData: FormData) {
  return formData.getAll("personIds").map(String).filter(Boolean);
}

function getPhotoFiles(formData: FormData) {
  return formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
}

function getOtherPeopleNames(formData: FormData) {
  return (formData.get("otherPeopleNames") as string) || "";
}

async function attachPhotosToStory(
  storyId: string,
  photoFiles: File[],
  personIds: string[],
  otherPeopleNames: string,
  uploadedById: string,
) {
  for (const file of photoFiles) {
    const { relativePath, mimeType } = await saveUploadedPhoto(file);
    await prisma.photo.create({
      data: {
        filePath: relativePath,
        mimeType,
        otherPeopleNames: otherPeopleNames || null,
        uploadedById,
        stories: { create: { storyId } },
        people: { create: personIds.map((personId) => ({ personId })) },
      },
    });
  }
}

export async function createStory(
  _prevState: StoryFormState,
  formData: FormData,
): Promise<StoryFormState> {
  const user = await getCurrentUser();

  const parsed = StorySchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const personIds = getPersonIds(formData);
  const photoFiles = getPhotoFiles(formData);
  const otherPeopleNames = getOtherPeopleNames(formData);

  const story = await prisma.story.create({
    data: {
      title: parsed.data.title,
      content: sanitizeRichText(parsed.data.content),
      otherPeopleNames: otherPeopleNames || null,
      authorId: user.id,
      people: { create: personIds.map((personId) => ({ personId })) },
    },
  });

  try {
    await attachPhotosToStory(
      story.id,
      photoFiles,
      personIds,
      otherPeopleNames,
      user.id,
    );
  } catch (err) {
    if (err instanceof InvalidUploadError) {
      return { error: err.message };
    }
    throw err;
  }

  revalidatePath("/historias");
  for (const personId of personIds) {
    revalidatePath(`/arvore/${personId}`);
  }
  redirect(`/historias/${story.id}`);
}

export async function updateStory(
  storyId: string,
  _prevState: StoryFormState,
  formData: FormData,
): Promise<StoryFormState> {
  const user = await getCurrentUser();

  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story) {
    return { error: "História não encontrada." };
  }
  if (user.role !== "ADMIN" && story.authorId !== user.id) {
    return { error: "Você não pode editar esta história." };
  }

  const parsed = StorySchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const personIds = getPersonIds(formData);
  const photoFiles = getPhotoFiles(formData);
  const otherPeopleNames = getOtherPeopleNames(formData);

  await prisma.$transaction([
    prisma.storyPerson.deleteMany({ where: { storyId } }),
    prisma.storyPerson.createMany({
      data: personIds.map((personId) => ({ storyId, personId })),
    }),
    prisma.story.update({
      where: { id: storyId },
      data: {
        title: parsed.data.title,
        content: sanitizeRichText(parsed.data.content),
        otherPeopleNames: otherPeopleNames || null,
      },
    }),
  ]);

  try {
    await attachPhotosToStory(
      storyId,
      photoFiles,
      personIds,
      otherPeopleNames,
      user.id,
    );
  } catch (err) {
    if (err instanceof InvalidUploadError) {
      return { error: err.message };
    }
    throw err;
  }

  revalidatePath("/historias");
  revalidatePath(`/historias/${storyId}`);
  redirect(`/historias/${storyId}`);
}

export async function deleteStory(storyId: string) {
  const user = await getCurrentUser();

  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story) return;

  if (user.role !== "ADMIN" && story.authorId !== user.id) {
    throw new Error("Você não pode excluir esta história.");
  }

  await prisma.story.delete({ where: { id: storyId } });

  revalidatePath("/historias");
  redirect("/historias");
}
