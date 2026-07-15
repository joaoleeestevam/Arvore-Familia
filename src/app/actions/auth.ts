"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { getCurrentUser, getCurrentUserForPasswordChange } from "@/lib/dal";
import { sendEmail } from "@/lib/email";

const LoginSchema = z.object({
  email: z.string().trim().min(1, "Informe o email."),
  password: z.string().min(1, "Informe a senha."),
});

export type LoginState = {
  error?: string;
} | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Preencha email e senha." };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.isActive) {
    return { error: "Email ou senha inválidos." };
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return { error: "Email ou senha inválidos." };
  }

  await createSession({ userId: user.id, role: user.role, name: user.name });
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual."),
    newPassword: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type ChangePasswordState =
  | { error: string }
  | { success: true }
  | undefined;

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const currentUser = await getCurrentUser();

  const parsed = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
  if (!user) {
    return { error: "Usuário não encontrado." };
  }

  const currentMatches = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash,
  );
  if (!currentMatches) {
    return { error: "Senha atual incorreta." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { success: true };
}

const MandatoryPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type MandatoryPasswordState = { error: string } | undefined;

export async function changePasswordMandatory(
  _prevState: MandatoryPasswordState,
  formData: FormData,
): Promise<MandatoryPasswordState> {
  const user = await getCurrentUserForPasswordChange();

  const parsed = MandatoryPasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  redirect("/");
}

async function getAppOrigin() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

const ForgotPasswordSchema = z.object({
  email: z.email({ error: "Informe um email válido." }).trim(),
});

export type ForgotPasswordState = { message: string } | undefined;

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = ForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  const genericMessage =
    "Se esse email estiver cadastrado, enviamos um link de redefinição de senha para ele.";

  if (!parsed.success) {
    return { message: genericMessage };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (user && user.isActive) {
    // invalida links antigos antes de criar um novo
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const origin = await getAppOrigin();
    const resetUrl = `${origin}/redefinir-senha?token=${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Redefinição de senha",
      html: `
        <p>Olá, ${user.name}.</p>
        <p>Recebemos um pedido para redefinir sua senha. Clique no link abaixo (válido por 1 hora):</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Se você não pediu isso, pode ignorar este email.</p>
      `,
    });
  }

  return { message: genericMessage };
}

const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type ResetPasswordState = { error: string } | undefined;

export async function resetPasswordWithToken(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(parsed.data.token)
    .digest("hex");

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return { error: "Link inválido ou expirado. Solicite um novo." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash, mustChangePassword: false },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);

  redirect("/login");
}
