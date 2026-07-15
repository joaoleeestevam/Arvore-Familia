import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { updatePerson } from "@/app/actions/person";
import { toDateInputValue } from "@/lib/dates";
import PersonForm from "@/components/PersonForm";

export default async function EditarPessoaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;

  const [person, people] = await Promise.all([
    prisma.person.findUnique({ where: { id } }),
    prisma.person.findMany({
      where: { status: "APPROVED" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);

  if (!person) notFound();

  const canEdit =
    user.role === "ADMIN" ||
    (person.status === "PENDING" && person.createdById === user.id);
  if (!canEdit) {
    redirect(`/arvore/${person.id}`);
  }

  const boundAction = updatePerson.bind(null, person.id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Editar {person.fullName}
      </h1>
      <PersonForm
        action={boundAction}
        people={people}
        currentPersonId={person.id}
        submitLabel="Salvar alterações"
        initialValues={{
          fullName: person.fullName,
          gender: person.gender ?? undefined,
          birthDate: toDateInputValue(person.birthDate),
          deathDate: toDateInputValue(person.deathDate),
          bio: person.bio ?? undefined,
          phone: person.phone ?? undefined,
          email: person.email ?? undefined,
          address: person.address ?? undefined,
          fatherId: person.fatherId ?? undefined,
          motherId: person.motherId ?? undefined,
        }}
      />
    </div>
  );
}
