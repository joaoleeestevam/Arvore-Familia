"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const UnionSchema = z.object({
  partnerId: z.string().trim().min(1, "Selecione a pessoa."),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type UnionFormState = { error?: string } | undefined;

function toDateOrNull(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createUnion(
  personId: string,
  _prevState: UnionFormState,
  formData: FormData,
): Promise<UnionFormState> {
  const user = await getCurrentUser();

  const parsed = UnionSchema.safeParse({
    partnerId: formData.get("partnerId"),
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  if (parsed.data.partnerId === personId) {
    return { error: "Uma pessoa não pode se casar/unir com ela mesma." };
  }

  await prisma.union.create({
    data: {
      partnerAId: personId,
      partnerBId: parsed.data.partnerId,
      startDate: toDateOrNull(parsed.data.startDate),
      endDate: toDateOrNull(parsed.data.endDate),
      createdById: user.id,
    },
  });

  revalidatePath(`/arvore/${personId}`);
  revalidatePath(`/arvore/${parsed.data.partnerId}`);
  revalidatePath("/arvore");
}

export async function endUnion(unionId: string) {
  await getCurrentUser();

  const union = await prisma.union.findUnique({ where: { id: unionId } });
  if (!union) return;

  await prisma.union.update({
    where: { id: unionId },
    data: { endDate: new Date() },
  });

  revalidatePath(`/arvore/${union.partnerAId}`);
  revalidatePath(`/arvore/${union.partnerBId}`);
  revalidatePath("/arvore");
}

export async function deleteUnion(unionId: string) {
  const user = await getCurrentUser();

  const union = await prisma.union.findUnique({ where: { id: unionId } });
  if (!union) return;

  if (user.role !== "ADMIN" && union.createdById !== user.id) {
    throw new Error("Você não pode remover este vínculo.");
  }

  await prisma.union.delete({ where: { id: unionId } });

  revalidatePath(`/arvore/${union.partnerAId}`);
  revalidatePath(`/arvore/${union.partnerBId}`);
  revalidatePath("/arvore");
}
