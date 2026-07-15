import Link from "next/link";
import { TreePine, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { computeGenerations } from "@/lib/genealogy";
import FamilyTreeChart, { type TreePerson } from "@/components/FamilyTreeChart";

export default async function ArvorePage() {
  const user = await getCurrentUser();

  const [people, unions, myPending, pendingCount] = await Promise.all([
    prisma.person.findMany({
      where: { status: "APPROVED" },
      orderBy: { fullName: "asc" },
    }),
    prisma.union.findMany({
      select: { partnerAId: true, partnerBId: true, endDate: true },
    }),
    prisma.person.findMany({
      where: { status: "PENDING", createdById: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, fullName: true },
    }),
    user.role === "ADMIN"
      ? prisma.person.count({ where: { status: "PENDING" } })
      : Promise.resolve(0),
  ]);

  const approvedIds = new Set(people.map((p) => p.id));
  const visibleUnions = unions.filter(
    (u) => approvedIds.has(u.partnerAId) && approvedIds.has(u.partnerBId),
  );

  const generations = computeGenerations(people, visibleUnions);

  const treePeople: TreePerson[] = people.map((person) => ({
    id: person.id,
    fullName: person.fullName,
    gender: person.gender,
    birthDate: person.birthDate ? person.birthDate.toISOString() : null,
    deathDate: person.deathDate ? person.deathDate.toISOString() : null,
    profilePhotoId: person.profilePhotoId,
    fatherId: person.fatherId,
    motherId: person.motherId,
    generation: generations.get(person.id) ?? 0,
  }));

  const treeUnions = visibleUnions.map((u) => ({
    partnerAId: u.partnerAId,
    partnerBId: u.partnerBId,
    active: !u.endDate,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-stone-900 dark:text-stone-100">
          <TreePine className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          Árvore genealógica
        </h1>
        <div className="flex items-center gap-2">
          {user.role === "ADMIN" && pendingCount > 0 && (
            <Link
              href="/arvore/pendentes"
              className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
            >
              {pendingCount} aguardando aprovação
            </Link>
          )}
          <Link
            href="/arvore/novo"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-violet-500/20 transition hover:from-violet-500 hover:to-fuchsia-500"
          >
            <Plus className="h-4 w-4" />
            Pessoa
          </Link>
        </div>
      </div>

      {myPending.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <p className="font-medium">Aguardando aprovação de um administrador:</p>
          <ul className="mt-1 list-inside list-disc">
            {myPending.map((p) => (
              <li key={p.id}>
                <Link href={`/arvore/${p.id}`} className="underline">
                  {p.fullName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {treePeople.length === 0 ? (
        <p className="text-stone-500 dark:text-stone-400">
          Ninguém cadastrado ainda. Comece adicionando a primeira pessoa da
          família.
        </p>
      ) : (
        <FamilyTreeChart people={treePeople} unions={treeUnions} />
      )}
    </div>
  );
}
