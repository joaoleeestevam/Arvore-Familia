import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const DEFAULT_FAMILY_NAME = "Minha Família";

// Configurações são uma única linha (singleton). Se ainda não existir,
// devolvemos os valores padrão sem gravar nada no banco.
export const getFamilySettings = cache(async () => {
  const settings = await prisma.familySettings.findFirst();
  return {
    id: settings?.id ?? null,
    familyName: settings?.familyName ?? DEFAULT_FAMILY_NAME,
    description: settings?.description ?? null,
    backgroundPhotoId: settings?.backgroundPhotoId ?? null,
  };
});
