import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/dates";
import PhotoThumb from "@/components/PhotoThumb";
import ApprovalButtons from "./approval-buttons";

export default async function PendentesPage() {
  await requireAdmin();

  const pending = await prisma.person.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      createdBy: { select: { name: true } },
      father: { select: { fullName: true } },
      mother: { select: { fullName: true } },
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Pessoas aguardando aprovação
      </h1>

      {pending.length === 0 ? (
        <p className="text-stone-500 dark:text-stone-400">
          Nenhum cadastro pendente no momento.
        </p>
      ) : (
        <ul className="space-y-3">
          {pending.map((person) => (
            <li
              key={person.id}
              className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                {person.profilePhotoId ? (
                  <PhotoThumb
                    photoId={person.profilePhotoId}
                    alt={person.fullName}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg text-stone-400">
                    {person.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <Link
                  href={`/arvore/${person.id}`}
                  className="font-medium text-stone-900 underline dark:text-stone-100"
                >
                  {person.fullName}
                </Link>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Enviado por {person.createdBy?.name ?? "desconhecido"} em{" "}
                  {formatDate(person.createdAt)}
                </p>
                {(person.father || person.mother) && (
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Filho(a) de{" "}
                    {[person.father?.fullName, person.mother?.fullName]
                      .filter(Boolean)
                      .join(" e ")}
                  </p>
                )}
              </div>

              <ApprovalButtons personId={person.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
