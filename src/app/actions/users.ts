"use server";

import * as z from "zod";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const CreateUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  email: z.email({ error: "Informe um email válido." }).trim(),
  role: z.enum(["ADMIN", "MEMBER"]),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export type CreateUserState =
  | { error: string }
  | { success: true; email: string }
  | undefined;

function generateTempPassword() {
  return crypto.randomBytes(9).toString("base64url");
}

export async function createUser(
  _prevState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  await requireAdmin();

  const parsed = CreateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role") === "ADMIN" ? "ADMIN" : "MEMBER",
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe um usuário com este email." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      role: parsed.data.role,
      passwordHash,
      isActive: true,
      // força a pessoa a escolher uma senha só dela no primeiro acesso
      mustChangePassword: true,
    },
  });

  revalidatePath("/admin/usuarios");
  return { success: true, email };
}

const UpdateUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  email: z.email({ error: "Informe um email válido." }).trim(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type UpdateUserState = { error: string } | { success: true } | undefined;

export async function updateUser(
  userId: string,
  _prevState: UpdateUserState,
  formData: FormData,
): Promise<UpdateUserState> {
  const admin = await requireAdmin();

  const parsed = UpdateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role") === "ADMIN" ? "ADMIN" : "MEMBER",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) {
    return { error: "Já existe um usuário com este email." };
  }

  if (admin.id === userId && parsed.data.role !== "ADMIN") {
    return { error: "Você não pode remover seu próprio acesso de administrador." };
  }

  if (parsed.data.role !== "ADMIN") {
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (target?.role === "ADMIN") {
      const otherAdmins = await prisma.user.count({
        where: { role: "ADMIN", id: { not: userId } },
      });
      if (otherAdmins === 0) {
        return { error: "Não é possível remover o último administrador." };
      }
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.data.name, email, role: parsed.data.role },
  });

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function setUserActive(userId: string, isActive: boolean) {
  const admin = await requireAdmin();
  if (admin.id === userId && !isActive) {
    throw new Error("Você não pode desativar sua própria conta.");
  }

  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/usuarios");
}

export type ResetPasswordState =
  | { error: string }
  | { success: true; tempPassword: string }
  | undefined;

export async function resetPassword(
  userId: string,
): Promise<ResetPasswordState> {
  await requireAdmin();

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });

  revalidatePath("/admin/usuarios");
  return { success: true, tempPassword };
}
