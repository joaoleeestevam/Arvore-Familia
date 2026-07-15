import Link from "next/link";
import { Users, Images, BookOpen, Cake, PartyPopper } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getFamilySettings } from "@/lib/settings";
import { formatDate, getMonthNamePt } from "@/lib/dates";
import PhotoThumb from "@/components/PhotoThumb";
import MediaThumb from "@/components/MediaThumb";

export default async function HomePage() {
  const user = await getCurrentUser();
  const settings = await getFamilySettings();

  const [
    peopleCount,
    photosCount,
    storiesCount,
    recentPhotos,
    recentStories,
    peopleWithBirthdays,
  ] = await Promise.all([
    prisma.person.count(),
    prisma.photo.count(),
    prisma.story.count(),
    prisma.photo.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.story.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { author: { select: { name: true } } },
    }),
    prisma.person.findMany({
      where: { status: "APPROVED", birthDate: { not: null }, deathDate: null },
      select: { id: true, fullName: true, birthDate: true, profilePhotoId: true },
    }),
  ]);

  const now = new Date();
  const currentMonth = now.getUTCMonth();
  const today = now.getUTCDate();

  const birthdaysThisMonth = peopleWithBirthdays
    .filter((p) => p.birthDate!.getUTCMonth() === currentMonth)
    .map((p) => ({ ...p, day: p.birthDate!.getUTCDate() }))
    .sort((a, b) => a.day - b.day);

  return (
    <div className="relative">
      {settings.backgroundPhotoId && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 overflow-hidden"
        >
          <PhotoThumb
            photoId={settings.backgroundPhotoId}
            alt=""
            className="h-full w-full object-cover object-center opacity-[0.06] grayscale dark:opacity-[0.08]"
          />
        </div>
      )}

      <div className="relative space-y-10">
        <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400" />
          <h2 className="bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-xl font-semibold text-transparent sm:text-2xl dark:from-violet-400 dark:to-fuchsia-400">
            {settings.familyName}
          </h2>
          {settings.description && (
            <p className="mt-1 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
              {settings.description}
            </p>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            Olá, {user.name}
          </h1>
          <p className="mt-1 text-stone-500 dark:text-stone-400">
            Bem-vindo(a) ao espaço da família.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/arvore"
            className="group rounded-xl border border-stone-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
          >
            <span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
              <Users className="h-4.5 w-4.5" />
            </span>
            <div className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
              {peopleCount}
            </div>
            <div className="text-sm text-stone-500 dark:text-stone-400">
              Pessoas
            </div>
          </Link>
          <Link
            href="/fotos"
            className="group rounded-xl border border-stone-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
          >
            <span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
              <Images className="h-4.5 w-4.5" />
            </span>
            <div className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
              {photosCount}
            </div>
            <div className="text-sm text-stone-500 dark:text-stone-400">
              Fotos
            </div>
          </Link>
          <Link
            href="/historias"
            className="group rounded-xl border border-stone-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
          >
            <span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
              <BookOpen className="h-4.5 w-4.5" />
            </span>
            <div className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
              {storiesCount}
            </div>
            <div className="text-sm text-stone-500 dark:text-stone-400">
              Histórias
            </div>
          </Link>
        </div>

        {birthdaysThisMonth.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-medium text-stone-900 dark:text-stone-100">
              <Cake className="h-5 w-5 text-amber-500" />
              Aniversariantes de {getMonthNamePt(currentMonth)}
            </h2>
            <ul className="space-y-2">
              {birthdaysThisMonth.map((p) => {
                const isToday = p.day === today;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/arvore/${p.id}`}
                      className={
                        "flex items-center gap-3 rounded-lg border px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md " +
                        (isToday
                          ? "border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950 dark:to-orange-950/60"
                          : "border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900")
                      }
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                        {p.profilePhotoId ? (
                          <PhotoThumb photoId={p.profilePhotoId} alt={p.fullName} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-stone-400">
                            {p.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="flex-1 text-sm text-stone-900 dark:text-stone-100">
                        {p.fullName}
                      </span>
                      <span
                        className={
                          "flex shrink-0 items-center gap-1 text-sm font-medium " +
                          (isToday
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-stone-500 dark:text-stone-400")
                        }
                      >
                        {isToday && <PartyPopper className="h-4 w-4" />}
                        {isToday ? "hoje!" : `dia ${p.day}`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-medium text-stone-900 dark:text-stone-100">
              <Images className="h-5 w-5 text-rose-500" />
              Fotos recentes
            </h2>
            <Link
              href="/fotos"
              className="text-sm text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
            >
              Ver todas
            </Link>
          </div>
          {recentPhotos.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Nenhuma foto enviada ainda.{" "}
              <Link href="/fotos/novo" className="underline">
                Envie a primeira
              </Link>
              .
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {recentPhotos.map((photo) => (
                <Link
                  key={photo.id}
                  href={`/fotos/${photo.id}`}
                  className="aspect-square overflow-hidden rounded-lg bg-stone-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-stone-800"
                >
                  <MediaThumb
                    id={photo.id}
                    mediaType={photo.mediaType}
                    externalUrl={photo.externalUrl}
                    alt={photo.caption ?? "Foto da família"}
                  />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-medium text-stone-900 dark:text-stone-100">
              <BookOpen className="h-5 w-5 text-amber-500" />
              Últimas histórias
            </h2>
            <Link
              href="/historias"
              className="text-sm text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
            >
              Ver todas
            </Link>
          </div>
          {recentStories.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Nenhuma história registrada ainda.{" "}
              <Link href="/historias/novo" className="underline">
                Escreva a primeira
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {recentStories.map((story) => (
                <li key={story.id}>
                  <Link
                    href={`/historias/${story.id}`}
                    className="block rounded-lg border border-stone-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
                  >
                    <div className="font-medium text-stone-900 dark:text-stone-100">
                      {story.title}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      {story.author?.name ?? "Anônimo"} ·{" "}
                      {formatDate(story.createdAt)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
