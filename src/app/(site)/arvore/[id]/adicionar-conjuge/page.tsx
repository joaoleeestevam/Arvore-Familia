import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { createUnion } from "@/app/actions/union";
import UnionForm from "@/components/UnionForm";

export default async function AdicionarConjugePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getCurrentUser();
  const { id } = await params;

  const [person, people] = await Promise.all([
    prisma.person.findUnique({ where: { id }, select: { id: true, fullName: true } }),
    prisma.person.findMany({
      where: { status: "APPROVED", id: { not: id } },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);

  if (!person) notFound();

  const boundAction = createUnion.bind(null, person.id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Adicionar cônjuge de {person.fullName}
      </h1>
      <UnionForm action={boundAction} people={people} />
    </div>
  );
}
