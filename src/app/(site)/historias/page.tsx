import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/dates";
import { toPlainTextExcerpt } from "@/lib/sanitize";
import PhotoThumb from "@/components/PhotoThumb";

export default async function HistoriasPage() {
  await getCurrentUser();

  const stories = await prisma.story.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      photos: { include: { photo: true }, take: 1 },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-stone-900 dark:text-stone-100">
          <BookOpen className="h-6 w-6 text-amber-500" />
          Histórias da família
        </h1>
        <Link
          href="/historias/novo"
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-amber-500/20 transition hover:from-amber-400 hover:to-orange-400"
        >
          <Plus className="h-4 w-4" />
          História
        </Link>
      </div>

      {stories.length === 0 ? (
        <p className="text-stone-500 dark:text-stone-400">
          Nenhuma história registrada ainda.
        </p>
      ) : (
        <ul className="space-y-3">
          {stories.map((story) => (
            <li key={story.id}>
              <Link
                href={`/historias/${story.id}`}
                className="flex gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
              >
                {story.photos[0] && (
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800">
                    <PhotoThumb
                      photoId={story.photos[0].photo.id}
                      alt={story.title}
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-medium text-stone-900 dark:text-stone-100">
                    {story.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
                    {toPlainTextExcerpt(story.content)}
                  </p>
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-500">
                    {story.author?.name ?? "Anônimo"} ·{" "}
                    {formatDate(story.createdAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
