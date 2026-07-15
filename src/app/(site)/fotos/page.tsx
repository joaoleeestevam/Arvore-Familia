import Link from "next/link";
import { Images, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import MediaThumb from "@/components/MediaThumb";

export default async function FotosPage() {
  await getCurrentUser();

  const photos = await prisma.photo.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-stone-900 dark:text-stone-100">
          <Images className="h-6 w-6 text-rose-500" />
          Fotos e vídeos da família
        </h1>
        <Link
          href="/fotos/novo"
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-rose-500/20 transition hover:from-rose-500 hover:to-orange-400"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Link>
      </div>

      {photos.length === 0 ? (
        <p className="text-stone-500 dark:text-stone-400">
          Nenhuma foto ou vídeo enviado ainda.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <Link
              key={photo.id}
              href={`/fotos/${photo.id}`}
              className="space-y-1"
            >
              <div className="aspect-square overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-800">
                <MediaThumb
                  id={photo.id}
                  mediaType={photo.mediaType}
                  externalUrl={photo.externalUrl}
                  alt={photo.caption ?? "Foto da família"}
                />
              </div>
              {photo.caption && (
                <p className="truncate text-sm text-stone-700 dark:text-stone-300">
                  {photo.caption}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
