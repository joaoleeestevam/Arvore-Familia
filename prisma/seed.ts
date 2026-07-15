import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const dbUrl = (process.env.DATABASE_URL ?? "file:./dev.db").replace(
  "file:",
  "",
);
const adapter = new PrismaBetterSqlite3({
  url: path.isAbsolute(dbUrl) ? dbUrl : path.join(process.cwd(), dbUrl),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log(
      `Já existe um administrador cadastrado (${existingAdmin.email}). Nada a fazer.`,
    );
    return;
  }

  const email = process.env.ADMIN_EMAIL ?? "admin@familia.local";
  const name = process.env.ADMIN_NAME ?? "Administrador";
  const password = process.env.ADMIN_PASSWORD ?? crypto.randomBytes(9).toString("base64url");

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "ADMIN",
      isActive: true,
      mustChangePassword: true,
    },
  });

  console.log("Usuário administrador criado com sucesso:");
  console.log(`  Email: ${email}`);
  console.log(`  Senha: ${password}`);
  console.log(
    "\nGuarde essa senha em local seguro. Ela será trocada obrigatoriamente no primeiro login.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
