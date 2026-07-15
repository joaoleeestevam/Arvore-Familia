import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { uploadPhoto } from "@/app/actions/photo";
import PhotoUploadForm from "@/components/PhotoUploadForm";

export default async function NovaFotoPage() {
  await getCurrentUser();

  const people = await prisma.person.findMany({
    where: { status: "APPROVED" },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true },
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Nova foto
      </h1>
      <PhotoUploadForm action={uploadPhoto} people={people} />
    </div>
  );
}
