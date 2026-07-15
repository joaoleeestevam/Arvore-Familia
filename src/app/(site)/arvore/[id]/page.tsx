import Link from "next/link";
import { Heart, Images, Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { formatDate, calculateAge } from "@/lib/dates";
import { formatPhoneBR } from "@/lib/phone";
import PhotoThumb from "@/components/PhotoThumb";
import MediaThumb from "@/components/MediaThumb";
import DeletePersonButton from "./delete-button";
import SetProfilePhotoButton from "./set-profile-photo-button";
import ApprovalButtons from "../pendentes/approval-buttons";
import UnionActions from "./union-actions";

export default async function PessoaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;

  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      father: true,
      mother: true,
      childrenAsFather: true,
      childrenAsMother: true,
      photos: {
        include: { photo: true },
        orderBy: { photo: { createdAt: "desc" } },
      },
      unionsAsPartnerA: { include: { partnerB: true } },
      unionsAsPartnerB: { include: { partnerA: true } },
    },
  });

  if (!person) notFound();

  const isPending = person.status === "PENDING";
  const canViewPending =
    !isPending || user.role === "ADMIN" || person.createdById === user.id;
  if (!canViewPending) notFound();

  const children = [...person.childrenAsFather, ...person.childrenAsMother].sort(
    (a, b) => a.fullName.localeCompare(b.fullName),
  );
  const age = calculateAge(person.birthDate, person.deathDate ?? undefined);
  const canEdit =
    user.role === "ADMIN" ||
    (isPending && person.createdById === user.id);

  const unions = [
    ...person.unionsAsPartnerA.map((u) => ({
      id: u.id,
      partner: u.partnerB,
      startDate: u.startDate,
      endDate: u.endDate,
      createdById: u.createdById,
    })),
    ...person.unionsAsPartnerB.map((u) => ({
      id: u.id,
      partner: u.partnerA,
      startDate: u.startDate,
      endDate: u.endDate,
      createdById: u.createdById,
    })),
  ].sort((a, b) => (b.startDate?.getTime() ?? 0) - (a.startDate?.getTime() ?? 0));

  return (
    <div className="space-y-8">
      {isPending && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <span>
            Este cadastro ainda não foi aprovado por um administrador e só é
            visível para você e a administração.
          </span>
          {user.role === "ADMIN" && <ApprovalButtons personId={person.id} />}
        </div>
      )}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div
          className={
            "h-32 w-32 shrink-0 overflow-hidden rounded-full bg-stone-200 ring-4 dark:bg-stone-800 " +
            (person.gender === "MALE"
              ? "ring-sky-200 dark:ring-sky-800"
              : person.gender === "FEMALE"
                ? "ring-pink-200 dark:ring-pink-800"
                : "ring-stone-200 dark:ring-stone-800")
          }
        >
          {person.profilePhotoId ? (
            <PhotoThumb photoId={person.profilePhotoId} alt={person.fullName} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-stone-400">
              {person.fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            {person.fullName}
          </h1>
          <div className="mt-1 space-y-0.5 text-sm text-stone-500 dark:text-stone-400">
            {person.birthDate && (
              <p>
                Nascimento: {formatDate(person.birthDate)}
                {!person.deathDate && age !== null ? ` (${age} anos)` : ""}
              </p>
            )}
            {person.deathDate && (
              <p>
                Falecimento: {formatDate(person.deathDate)}
                {age !== null ? ` (aos ${age} anos)` : ""}
              </p>
            )}
            {person.phone && <p>Telefone: {formatPhoneBR(person.phone)}</p>}
            {person.email && <p>Email: {person.email}</p>}
            {person.address && <p>Endereço: {person.address}</p>}
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            {canEdit && (
              <Link
                href={`/arvore/${person.id}/editar`}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                Editar
              </Link>
            )}
            <Link
              href={`/arvore/${person.id}/nova-foto`}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Adicionar foto
            </Link>
            {user.role === "ADMIN" && (
              <DeletePersonButton personId={person.id} />
            )}
          </div>
        </div>
      </div>

      {person.bio && (
        <section>
          <h2 className="mb-1 text-lg font-medium text-stone-900 dark:text-stone-100">
            Sobre
          </h2>
          <p className="whitespace-pre-wrap text-stone-700 dark:text-stone-300">
            {person.bio}
          </p>
        </section>
      )}

      <section className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-1 text-lg font-medium text-stone-900 dark:text-stone-100">
            Pais
          </h2>
          {person.father || person.mother ? (
            <ul className="space-y-1 text-sm">
              {person.father && (
                <li>
                  <Link
                    href={`/arvore/${person.father.id}`}
                    className="text-stone-700 underline dark:text-stone-300"
                  >
                    {person.father.fullName}
                  </Link>{" "}
                  (pai)
                </li>
              )}
              {person.mother && (
                <li>
                  <Link
                    href={`/arvore/${person.mother.id}`}
                    className="text-stone-700 underline dark:text-stone-300"
                  >
                    {person.mother.fullName}
                  </Link>{" "}
                  (mãe)
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Não informado.
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-1 text-lg font-medium text-stone-900 dark:text-stone-100">
            Filhos
          </h2>
          {children.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/arvore/${child.id}`}
                    className="text-stone-700 underline dark:text-stone-300"
                  >
                    {child.fullName}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Nenhum registrado.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-medium text-stone-900 dark:text-stone-100">
            <Heart className="h-4.5 w-4.5 text-pink-500" />
            Cônjuges
          </h2>
          <Link
            href={`/arvore/${person.id}/adicionar-conjuge`}
            className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Link>
        </div>
        {unions.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {unions.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 px-3 py-2 dark:border-stone-800"
              >
                <div>
                  <Link
                    href={`/arvore/${u.partner.id}`}
                    className="text-stone-700 underline dark:text-stone-300"
                  >
                    {u.partner.fullName}
                  </Link>
                  <span className="ml-2 text-xs text-stone-500 dark:text-stone-400">
                    {u.startDate ? formatDate(u.startDate) : "?"}
                    {" – "}
                    {u.endDate ? formatDate(u.endDate) : "atual"}
                  </span>
                </div>
                <UnionActions
                  unionId={u.id}
                  active={!u.endDate}
                  canRemove={user.role === "ADMIN" || u.createdById === user.id}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Nenhum registrado.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-medium text-stone-900 dark:text-stone-100">
          <Images className="h-4.5 w-4.5 text-rose-500" />
          Fotos
        </h2>
        {person.photos.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Nenhuma foto ainda.{" "}
            <Link href={`/arvore/${person.id}/nova-foto`} className="underline">
              Adicionar a primeira
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {person.photos.map(({ photo }) => (
              <div key={photo.id} className="space-y-1">
                <Link
                  href={`/fotos/${photo.id}`}
                  className="block aspect-square overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800"
                >
                  <MediaThumb
                    id={photo.id}
                    mediaType={photo.mediaType}
                    externalUrl={photo.externalUrl}
                    alt={photo.caption ?? person.fullName}
                  />
                </Link>
                {photo.mediaType === "IMAGE" && photo.id !== person.profilePhotoId && (
                  <SetProfilePhotoButton personId={person.id} photoId={photo.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
