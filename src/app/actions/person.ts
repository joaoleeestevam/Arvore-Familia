"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { saveUploadedPhoto, InvalidUploadError } from "@/lib/uploads";

const PersonSchema = z.object({
  fullName: z.string().trim().min(1, "Informe o nome completo."),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  fatherId: z.string().optional(),
  motherId: z.string().optional(),
});

export type PersonFormState = { error?: string } | undefined;

function toDateOrNull(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createPerson(
  _prevState: PersonFormState,
  formData: FormData,
): Promise<PersonFormState> {
  const user = await getCurrentUser();

  const parsed = PersonSchema.safeParse({
    fullName: formData.get("fullName"),
    gender: formData.get("gender") || undefined,
    birthDate: formData.get("birthDate") || undefined,
    deathDate: formData.get("deathDate") || undefined,
    bio: formData.get("bio") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    fatherId: formData.get("fatherId") || undefined,
    motherId: formData.get("motherId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  const photoFile = formData.get("photo");

  const person = await prisma.person.create({
    data: {
      fullName: data.fullName,
      gender: data.gender ?? null,
      birthDate: toDateOrNull(data.birthDate),
      deathDate: toDateOrNull(data.deathDate),
      bio: data.bio || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      fatherId: data.fatherId || null,
      motherId: data.motherId || null,
      createdById: user.id,
      status: user.role === "ADMIN" ? "APPROVED" : "PENDING",
    },
  });

  if (photoFile instanceof File && photoFile.size > 0) {
    try {
      const { relativePath, mimeType } = await saveUploadedPhoto(photoFile);
      const photo = await prisma.photo.create({
        data: {
          filePath: relativePath,
          mimeType,
          uploadedById: user.id,
          people: { create: { personId: person.id } },
        },
      });
      await prisma.person.update({
        where: { id: person.id },
        data: { profilePhotoId: photo.id },
      });
    } catch (err) {
      if (err instanceof InvalidUploadError) {
        return { error: err.message };
      }
      throw err;
    }
  }

  revalidatePath("/arvore");
  redirect(`/arvore/${person.id}`);
}

export async function updatePerson(
  personId: string,
  _prevState: PersonFormState,
  formData: FormData,
): Promise<PersonFormState> {
  const user = await getCurrentUser();

  const target = await prisma.person.findUnique({
    where: { id: personId },
    select: { status: true, createdById: true },
  });
  if (!target) {
    return { error: "Pessoa não encontrada." };
  }

  const canEdit =
    user.role === "ADMIN" ||
    (target.status === "PENDING" && target.createdById === user.id);
  if (!canEdit) {
    return {
      error:
        "Esta pessoa já foi aprovada. Só um administrador pode editá-la agora.",
    };
  }

  const parsed = PersonSchema.safeParse({
    fullName: formData.get("fullName"),
    gender: formData.get("gender") || undefined,
    birthDate: formData.get("birthDate") || undefined,
    deathDate: formData.get("deathDate") || undefined,
    bio: formData.get("bio") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    fatherId: formData.get("fatherId") || undefined,
    motherId: formData.get("motherId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  if (data.fatherId === personId || data.motherId === personId) {
    return { error: "Uma pessoa não pode ser seu próprio pai/mãe." };
  }

  await prisma.person.update({
    where: { id: personId },
    data: {
      fullName: data.fullName,
      gender: data.gender ?? null,
      birthDate: toDateOrNull(data.birthDate),
      deathDate: toDateOrNull(data.deathDate),
      bio: data.bio || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      fatherId: data.fatherId || null,
      motherId: data.motherId || null,
    },
  });

  revalidatePath("/arvore");
  revalidatePath(`/arvore/${personId}`);
  redirect(`/arvore/${personId}`);
}

export async function setProfilePhoto(personId: string, photoId: string) {
  await getCurrentUser();

  const tagged = await prisma.photoPerson.findUnique({
    where: { photoId_personId: { photoId, personId } },
    include: { photo: { select: { mediaType: true } } },
  });
  if (!tagged) {
    throw new Error("Esta foto não está associada a esta pessoa.");
  }
  if (tagged.photo.mediaType !== "IMAGE") {
    throw new Error("Só é possível usar uma foto como foto de perfil.");
  }

  await prisma.person.update({
    where: { id: personId },
    data: { profilePhotoId: photoId },
  });

  revalidatePath(`/arvore/${personId}`);
}

export async function approvePerson(personId: string) {
  await requireAdmin();

  await prisma.person.update({
    where: { id: personId },
    data: { status: "APPROVED" },
  });

  revalidatePath("/arvore");
  revalidatePath("/arvore/pendentes");
  revalidatePath(`/arvore/${personId}`);
}

export async function rejectPerson(personId: string) {
  await requireAdmin();

  await prisma.person.update({
    where: { id: personId },
    data: { profilePhotoId: null },
  });
  await prisma.person.deleteMany({ where: { id: personId } });

  revalidatePath("/arvore");
  revalidatePath("/arvore/pendentes");
}

export async function deletePerson(personId: string) {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN") {
    throw new Error("Apenas administradores podem excluir pessoas.");
  }

  await prisma.person.update({
    where: { id: personId },
    data: { profilePhotoId: null },
  });
  await prisma.person.deleteMany({ where: { id: personId } });

  revalidatePath("/arvore");
  redirect("/arvore");
}
