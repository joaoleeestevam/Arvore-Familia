import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { decryptSession, getSessionCookie } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const verifySession = cache(async () => {
  const token = await getSessionCookie();
  const session = await decryptSession(token);

  if (!session?.userId) {
    redirect("/login");
  }

  return session;
});

export const getOptionalSession = cache(async () => {
  const token = await getSessionCookie();
  return decryptSession(token);
});

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
} as const;

// Usado por todas as páginas normais: redireciona para /login (sessão
// inválida) ou /trocar-senha (senha provisória ainda não trocada).
export const getCurrentUser = cache(async () => {
  const session = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: userSelect,
  });

  if (!user || !user.isActive) {
    redirect("/login");
  }
  if (user.mustChangePassword) {
    redirect("/trocar-senha");
  }

  return user;
});

// Usado só pela própria página /trocar-senha, que não pode redirecionar
// para si mesma.
export const getCurrentUserForPasswordChange = cache(async () => {
  const session = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: userSelect,
  });

  if (!user || !user.isActive) {
    redirect("/login");
  }

  return user;
});

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}
