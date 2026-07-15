import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { updatePhoto } from "@/app/actions/photo";
import { toDateInputValue } from "@/lib/dates";
import PhotoUploadForm from "@/components/PhotoUploadForm";

export default async function EditarFotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;

  const [photo, people] = await Promise.all([
    prisma.photo.findUnique({
      where: { id },
      include: { people: true },
    }),
    prisma.person.findMany({
      where: { status: "APPROVED" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);

  if (!photo) notFound();

  if (user.role !== "ADMIN" && photo.uploadedById !== user.id) {
    redirect(`/fotos/${photo.id}`);
  }

  const boundAction = updatePhoto.bind(null, photo.id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Editar foto
      </h1>
      <PhotoUploadForm
        action={boundAction}
        people={people}
        submitLabel="Salvar alterações"
        initialValues={{
          takenDate: toDateInputValue(photo.takenDate),
          caption: photo.caption ?? undefined,
          description: photo.description ?? undefined,
          personIds: photo.people.map((p) => p.personId),
          otherPeopleNames: photo.otherPeopleNames ?? undefined,
        }}
      />
    </div>
  );
}
