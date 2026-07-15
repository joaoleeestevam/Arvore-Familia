"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const CommentSchema = z.object({
  content: z.string().trim().min(1, "Escreva algo antes de enviar.").max(2000),
});

export type CommentFormState = { error: string } | undefined;

export async function createComment(
  photoId: string,
  _prevState: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const user = await getCurrentUser();

  const parsed = CommentSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.comment.create({
    data: {
      content: parsed.data.content,
      photoId,
      authorId: user.id,
    },
  });

  revalidatePath(`/fotos/${photoId}`);
}

export async function deleteComment(commentId: string) {
  const user = await getCurrentUser();

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return;

  if (user.role !== "ADMIN" && comment.authorId !== user.id) {
    throw new Error("Você não pode excluir este comentário.");
  }

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/fotos/${comment.photoId}`);
}
