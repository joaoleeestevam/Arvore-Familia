import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { createPerson } from "@/app/actions/person";
import PersonForm from "@/components/PersonForm";

export default async function NovaPessoaPage() {
  await getCurrentUser();

  const people = await prisma.person.findMany({
    where: { status: "APPROVED" },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true },
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Nova pessoa
      </h1>
      <PersonForm
        action={createPerson}
        people={people}
        allowPhotoUpload
        submitLabel="Adicionar à árvore"
      />
    </div>
  );
}
