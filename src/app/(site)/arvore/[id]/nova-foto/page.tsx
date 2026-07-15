import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { uploadPhoto } from "@/app/actions/photo";
import PhotoUploadForm from "@/components/PhotoUploadForm";

export default async function NovaFotoDaPessoaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getCurrentUser();
  const { id } = await params;

  const [person, people] = await Promise.all([
    prisma.person.findUnique({ where: { id }, select: { id: true, fullName: true } }),
    prisma.person.findMany({
      where: { status: "APPROVED" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);

  if (!person) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Nova foto de {person.fullName}
      </h1>
      <PhotoUploadForm
        action={uploadPhoto}
        people={people}
        fixedPersonIds={[person.id]}
      />
    </div>
  );
}
