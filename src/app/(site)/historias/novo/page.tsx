import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { createStory } from "@/app/actions/story";
import StoryForm from "@/components/StoryForm";

export default async function NovaHistoriaPage() {
  await getCurrentUser();

  const people = await prisma.person.findMany({
    where: { status: "APPROVED" },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Nova história
      </h1>
      <StoryForm action={createStory} people={people} submitLabel="Publicar história" />
    </div>
  );
}
