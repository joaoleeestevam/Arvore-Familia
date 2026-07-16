import path from "node:path";
import { readFile } from "node:fs/promises";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { computeImageHash } from "../src/lib/phash-core";

const dbUrl = (process.env.DATABASE_URL ?? "file:./dev.db").replace("file:", "");
const adapter = new PrismaBetterSqlite3({
  url: path.isAbsolute(dbUrl) ? dbUrl : path.join(process.cwd(), dbUrl),
});
const prisma = new PrismaClient({ adapter });

function uploadsDir() {
  const dir = process.env.UPLOADS_DIR ?? "./uploads";
  return path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
}

async function main() {
  const photos = await prisma.photo.findMany({
    where: { mediaType: "IMAGE", phash: null, filePath: { not: null } },
    select: { id: true, filePath: true },
  });

  if (photos.length === 0) {
    console.log("Nenhuma foto pendente de hash. Nada a fazer.");
    return;
  }

  let updated = 0;
  for (const photo of photos) {
    try {
      const buffer = await readFile(path.join(uploadsDir(), photo.filePath!));
      const phash = await computeImageHash(buffer);
      await prisma.photo.update({ where: { id: photo.id }, data: { phash } });
      updated++;
    } catch (err) {
      console.warn(`Não deu para calcular o hash da foto ${photo.id}:`, err);
    }
  }

  console.log(`Hash calculado para ${updated}/${photos.length} fotos antigas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
