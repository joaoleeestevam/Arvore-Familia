import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/dates";
import MediaThumb from "@/components/MediaThumb";
import DeletePhotoButton from "./delete-button";

export default async function FotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;

  const photo = await prisma.photo.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { name: true } },
      people: { include: { person: true } },
    },
  });

  if (!photo) notFound();

  const canManage = user.role === "ADMIN" || photo.uploadedById === user.id;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-800">
        <MediaThumb
          id={photo.id}
          mediaType={photo.mediaType}
          externalUrl={photo.externalUrl}
          alt={photo.caption ?? "Foto da família"}
          className="w-full object-contain"
          interactive
        />
      </div>

      {photo.caption && (
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
          {photo.caption}
        </h1>
      )}

      <div className="text-sm text-stone-500 dark:text-stone-400">
        {photo.takenDate && <p>Data: {formatDate(photo.takenDate)}</p>}
        <p>Enviada por: {photo.uploadedBy?.name ?? "Desconhecido"}</p>
      </div>

      {photo.description && (
        <p className="whitespace-pre-wrap text-stone-700 dark:text-stone-300">
          {photo.description}
        </p>
      )}

      {(photo.people.length > 0 || photo.otherPeopleNames) && (
        <div>
          <h2 className="mb-1 text-sm font-medium text-stone-900 dark:text-stone-100">
            Pessoas na foto
          </h2>
          <div className="flex flex-wrap gap-2">
            {photo.people.map(({ person }) => (
              <Link
                key={person.id}
                href={`/arvore/${person.id}`}
                className="rounded-full border border-stone-300 px-3 py-1 text-sm text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                {person.fullName}
              </Link>
            ))}
            {photo.otherPeopleNames
              ?.split(",")
              .map((n) => n.trim())
              .filter(Boolean)
              .map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-dashed border-stone-300 px-3 py-1 text-sm text-stone-500 dark:border-stone-600 dark:text-stone-400"
                >
                  {name}{" "}
                  <span className="text-xs text-stone-400">(sem cadastro)</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {canManage && (
        <div className="flex gap-2 pt-2">
          <Link
            href={`/fotos/${photo.id}/editar`}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Editar
          </Link>
          <DeletePhotoButton photoId={photo.id} />
        </div>
      )}
    </div>
  );
}
