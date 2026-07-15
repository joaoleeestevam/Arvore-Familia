import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/dates";
import PhotoThumb from "@/components/PhotoThumb";
import DeleteStoryButton from "./delete-button";

export default async function HistoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;

  const story = await prisma.story.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      people: { include: { person: true } },
      photos: { include: { photo: true } },
    },
  });

  if (!story) notFound();

  const canManage = user.role === "ADMIN" || story.authorId === user.id;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        {story.title}
      </h1>
      <p className="text-sm text-stone-500 dark:text-stone-400">
        {story.author?.name ?? "Anônimo"} · {formatDate(story.createdAt)}
      </p>
      <p className="whitespace-pre-wrap text-stone-700 dark:text-stone-300">
        {story.content}
      </p>

      {(story.people.length > 0 || story.otherPeopleNames) && (
        <div>
          <h2 className="mb-1 text-sm font-medium text-stone-900 dark:text-stone-100">
            Quem participou
          </h2>
          <div className="flex flex-wrap gap-2">
            {story.people.map(({ person }) => (
              <Link
                key={person.id}
                href={`/arvore/${person.id}`}
                className="rounded-full border border-stone-300 px-3 py-1 text-sm text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                {person.fullName}
              </Link>
            ))}
            {story.otherPeopleNames
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

      {story.photos.length > 0 && (
        <div>
          <h2 className="mb-1 text-sm font-medium text-stone-900 dark:text-stone-100">
            Fotos
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {story.photos.map(({ photo }) => (
              <Link
                key={photo.id}
                href={`/fotos/${photo.id}`}
                className="block aspect-square overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800"
              >
                <PhotoThumb
                  photoId={photo.id}
                  alt={photo.caption ?? story.title}
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {canManage && (
        <div className="flex gap-2 pt-2">
          <Link
            href={`/historias/${story.id}/editar`}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Editar
          </Link>
          <DeleteStoryButton storyId={story.id} />
        </div>
      )}
    </div>
  );
}
